/*!
 * a2 - oauth2 browser client
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */

/**
 * Module Dependencies
 */
var util = require('util')
  , EventEmitter = require('events').EventEmitter
  , express = require('express')
  , serializer = require('serializer')
  , errors = require('./errors')
  , verify = require('./verify')
  , ClientService = require('./services/client')
  , AuthenticationService = require('./services/authentication')
  , AuthorizationService = require('./services/authorization')
  , TokenService = require('./services/token')
  , ViewService = require('./services/view')
  , UserService = require('./services/user')
  , middleware = require('./middleware')
  , LocalStore = require('./store/local');


/**
 * OAuth2 Authorization server
 * @param options
 *
 * Options:
 *  `crypt_secret`        Key used for token encryption
 *  `sign_secret`         Key used for signing tokens
 *  `authorize_endpoint`  Relative url to authorize endpoint, defaults to '/oauth2/authorize'
 *  `token_endpoint`      Relative url to token endpoint, defaults to '/oauth2/access_token'
 *  `login_endpoint`      Relative url for login form. Uses the internal login form or calls the one given loginForm()
 * Optional:
 *  `login_template`          Optional login form template name for res.render to use instead of redirecting to login_endpoint.
 *  `clients`             Function that loads client associated with provided client_id. Defaults to mongodb a2.clients
 *  `users`               Function that loads user associated with the provided user_id. Defaults to mongodb a2.users
 *  `scopes`              Array of valid scopes, scopes[0] is the default grant.
 *  `views`               Function to render views `login`, `authorize`.
 *  `token`               Function to load grant accosiated with token. Defaults to mongodb a2.grants
 *  `login`               Function to login user, called with username, password. Defaults to mongodb a2.users
 *
 */
function Server(options) {
  var self = this;
  options = options || {};
  EventEmitter.call(this);
  this.options = options;
  options.authorize_endpoint = options.authorize_endpoint || '/oauth2/authorize';
  options.token_endpoint = options.token_endpoint || '/oauth2/access_token';
  options.login_endpoint = options.login_endpoint || '/login';
  this.loginTemplate  = options.login_template || null;
  this.scopes = options.scopes || ['basic'];

  this.serializer = serializer.createSecureSerializer(options.crypt_secret, options.sign_secret);
  this.store = options.store || new LocalStore();
  this.clientService = options.client_service || new ClientService(this);
  this.authenticationService = options.authentication_service || new AuthenticationService(this);
  this.authorizationService = options.authorization_service || new AuthorizationService(this);
  this.tokenService = options.token_service || new TokenService(this);
  this.viewService = options.view_service || new ViewService(this);
  this.userService = options.user_service || new UserService(this);



  this.static = express.static(__dirname + '/browser/');


  this.router = exports.router = express.router(function (app) {
    app.get(options.authorize_endpoint, middleware.validate(self), self.authorizeGET.bind(self));
    //app.get(options.login_endpoint,self.loginEndpoint.bind(self));
    app.post(options.authorize_endpoint, middleware.validate(self), self.authorizePOST.bind(self));
  /* app.get(options.token_endpoint, self..bind(self));*/
    app.post(options.token_endpoint, self.tokenPOST.bind(self));
  });
}

util.inherits(Server, EventEmitter);

/**
 * Expose Server
 */
module.exports = Server;


Server.prototype.tokenPOST = function(req, res, next) {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-store');
  var self = this;
  var query = req.body || {};
  var clientId = query.client_id;
  var clientSecret = query.client_secret;
  var code = query.code;
  var grantType = query.grant_type;
  var redirectUri = query.redirect_uri;
  req.a2 = req.a2 || {};
  req.a2.client = req.a2.client || {};
  req.a2.client.id = clientId;
  req.a2.user = req.a2.user || {};

  if(!clientId || !clientSecret || !code || !redirectUri || !grantType || grantType != 'authorization_code') {
    return errors.invalid_request(req, res);
  }

  this.clientService.load(clientId, function(err, client) {
    if(err || !client) {
      console.log(err, "Client not found");
      return errors.invalid_request(req, res);
    }
    if(client.secret !== clientSecret) {
      console.log(client.secret, "does not match",clientSecret);
      return errors.access_denied(req, res);
    }
    if(redirectUri != client.redirect_uri) {
      console.log(redirectUri, "does not match",client.redirect_uri);
      return errors.invalid_request(req, res);
    }
    self.authorizationService.loadGrant(code, function(err, grant) {
      console.log("Grant loaded.", grant, err);
      if(err || !grant || grant.code != code) {
        console.log(grant.code, "is not",code);
        return errors.invalid_grant(req, res);
      }
      console.log("Exchanging grant for token");
      self.tokenService.exchangeGrantForToken(grant, function(err, token) {
        var response = {
          access_token: token,
          token_type: 'bearer',
          refresh_token: 'asdasdasd',
          scope: grant.scope,
          expires_in: 3600*24
        };
        res.send(response);
      });
    });
  });
};

/**
 * Authorization endpoint, handles POST requests to authorization endpoint.
 * @param req http request
 * @param res http response
 * @param next callback for next middleware.
 */
Server.prototype.authorizePOST = function(req, res, next) {
  var self = this;
  var query = req.body || {};
  var scopes = query.scopes;
  var clientId = query.client_id;

  if(!clientId || scopes === undefined) {
    return errors.invalid_request(req, res);
  }
  console.log(req.body);
  this.clientService.load(query.client_id, function(err, client) {
    if(err) {
      return errors.invalid_request(req, res);
    }
    req.a2.client = client;
    var validRedirect = verify.redirectUri(client, query.redirect_uri);
    if(!validRedirect) return errors.invalid_request(req, res);

    var validResponseType = verify.responseType(query.response_type);
    if(!validResponseType) return errors.unsupported_response_type(req, res);

    console.log("Checking that user is logged in");
    // check_login event should return user or render the login form for the user.
    self.authenticationService.login(req, res, function(err, user) {
      if(err) {
        return self.authenticationService.renderLoginForm(req, res);
      }
      console.log("Checking if user has authorized any scopes");
      self.authorizationService.checkScope(req, res, user, client, req.body.scopes || [''], function(err, scopes) {
        if(err) {
          return errors.invalid_scope(req, res);
        }

        req.a2.scopes = scopes;
        var authorizeScopes = Object.keys(scopes);
        console.log("Asking authorizeService to authorizes scopes ",authorizeScopes);
        return self.authorizationService.authorize(user, client, authorizeScopes, function(err, grant) {
          if(err) {
            return errors.server_error(req, res);
          }
          if(query.response_type === "code") {
            console.log("Grant created with code ",grant.code);
            return res.redirect(client.redirect_uri+'?code='+encodeURIComponent(grant.code));
          } else {
            self.tokenService.exchangeGrantForToken(grant, function(err, token) {
              if(err) {
                return errors.server_error(req, res);
              }
              return res.redirect(client.redirect_uri+'#access_token='+encodeURIComponent(token));
            });
          }
        });

      });
    });
  });
};

/**
 * Authorization  endpoint, handles GET requests to authorization end point.
 * @param req http request
 * @param res http response
 * @param next callback for next middleware.
 */
Server.prototype.authorizeGET = function(req, res, next) {
  var self = this;
  var query = req.query || {};
  if(!query.client_id || !query.response_type) {
    return errors.invalid_request(req, res);
  }

  this.clientService.load(query.client_id, function(err, client) {
    if(err) {
      return errors.server_error(req, res);
    }
    if(!client) {
      console.log("invalid client invalid_request",err, client);
      return errors.invalid_request(req, res)
    }
    req.a2.client = client;
    console.log("Authentication service logging in user.");
    self.authenticationService.login(req, res, function(err, user) {
      if(err) {
        return self.authenticationService.renderLoginForm(req, res);
      }
      req.a2.user = user;
      console.log("check scopes");
      self.authorizationService.checkScope(req, res, user, client, req.query.scope || [''], function(err, scopes) {
        if(err) {
          return errors.invalid_scope(req, res);
        }
        if(Object.keys(scopes).length > 0) {
          req.a2.scopes = scopes;
          console.log("Unauthorized scopes found, rendering authorize form.");
          return self.authorizationService.renderAuthorizeForm(req, res, scopes);
        } else {
          self.authorizationService.authorize(user, client, scopes, function(err, grant) {
            if(query.response_type === "code") {
              return res.redirect(client.redirect_uri+'?code='+encodeURIComponent(grant.code));
            } else {
              self.tokenService.exchangeGrantForToken(grant, function(error, token) {
                if(error) {
                  return errors.server_error(req, res);
                }
                return res.redirect(client.redirect_uri+'#access_token='+encodeURIComponent(token));
              });
            }
          });
        }
      });
    });
  });

};

/**
 * Emits `load_client` and needs to get a client or error back.
 * @param id  `client_id` of the client
 * @param callback
 */
Server.prototype.lookupClient = function(id, callback) {
  if(!id) return callback(new Error("invalid client_id"));

  this.emit('load_client', id, callback);
};

Server.prototype.loginEndpoint = function(req, res) {
  this.emit('login_form', req, res);
};

