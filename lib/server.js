/*!
 * a2 - oauth2 browser client
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */

/**
 * Module Dependencies
 */
var util = require('util')
  , url = require('url')
  , utils = require('./utils')
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

  this.validGrantTypes = options.grant_types || ['auhto'];

  this.static = express.static(__dirname + '/browser/');
  this.router = exports.router = express();

  if(options.express_app && (options.authorize_endpoint || options.login_template)) {
    this.router.set('views', options.express.app.set('views'));
    this.router.set('view engine', options.express.app.set('view engine'));
  } else if(options.views && options.view_engine &&  (options.authorize_endpoint || options.login_template)) {
    this.router.set('views', options.views);
    this.router.set('view engine', options.view_engine);
  } else if(options.authorize_endpoint || options.login_template) {
    throw new Error("If you specify authorize_endpoint or login_template you need to pass view_engine and view_directory or express_app to read settings from.");
  }

  if(options.authorize_endpoint) {
    this.router.get(options.authorize_endpoint, middleware.initialize(self), self.authorizeGET.bind(self));
    this.router.post(options.authorize_endpoint, middleware.initialize(self), self.authorizePOST.bind(self));
  }
  if(options.token_endpoint) {
    this.router.post(options.token_endpoint, middleware.initialize(self), self.tokenPOST.bind(self));
  }
}

util.inherits(Server, EventEmitter);

/**
 * Expose Server
 */
module.exports = Server;


Server.prototype.tokenPOST = function(req, res, next) {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Connection', 'close');
  var self = this;
  var query = req.body || {};
  var clientId = query.client_id;
  var clientSecret = query.client_secret;
  var code = query.code;
  var grantType = query.grant_type;
  var username = query.username;
  var password = query.password;
  var error = verify.verifyTokenPOSTRequest(req, res);
  if(error && error.error) {
    return;
  }

  var redirectUri = query.redirect_uri;
  req.a2 = req.a2 || {};
  req.a2.client_id = clientId;
  if(grantType == "authorization_code") {
    if(!clientId || !clientSecret || !code || !redirectUri) {
      return errors.invalid_request(req, res);
    }
  } else if(grantType == "password") {
    if(!clientId || !clientSecret || !username || !password) {
      return errors.invalid_request(req, res);
    }
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
    if(grantType == "authorization_code" && redirectUri != client.redirect_uri) {
      console.log(redirectUri, "does not match",client.redirect_uri);
      return errors.invalid_request(req, res);
    }
    if(req.a2.grant_type == "password") {
      self.userService.password(req.body.username, req.body.password, client, function(err, user, scopes) {
        if(err || !user) {
          return errors.token.invalid_grant(req, res);
        }
        console.log(user, client, req.a2.redirect_uri, scopes);
        return self.authorizationService.authorize(user, client, req.a2.redirect_uri, scopes, function(err, grant) {
          if(err) {
            return errors.server_error(req, res);
          }
          self.tokenService.exchangeGrantForToken(grant, "token", function(err, grant) {
            if(err) {
              return errors.token.server_error(req, res);
            }
            var response = {
              access_token: grant.access_token.access_token,
              token_type: grant.access_token.token_type,
              refresh_token: grant.refresh_token,
              scope: grant.scope.join(' '),
              expires_in: grant.access_token.ttl
            };

            res.send(response);
          });
        });
      });
    } else {
    self.authorizationService.validateCode(code, client, redirectUri, function(error, valid) {
      if(error || !valid) {
        return errors.token.invalid_grant(req, res);
      }
      self.authorizationService.loadGrant(code, function(err, grant) {
        if(err || !grant) {
          return errors.token.invalid_grant(req, res);
        }

        if(grant.code != code || redirectUri != grant.redirect_uri) {
          console.error("Code or url missmatch",code,redirectUri,grant);
          return errors.token.invalid_grant(req, res);
        }

        console.log("Exchanging grant for token");
        self.tokenService.exchangeGrantForToken(grant, "code", function(err, grant) {
          if(err) {
            /**
             * 4.1.2.  Authorization Response
             * The client MUST NOT use the authorization code  more than once.  If an authorization code is used more than
             * once, the authorization server MUST deny the request and SHOULD revoke (when possible) all tokens previously
             * issued based on that authorization code.
             *  The authorization code is bound to he client identifier and redirection URI.
             */
            self.authorizationService.revokeTokensForCode(code, function() {});
            return errors.token.server_error(req, res);
          }
          var response = {
            access_token: grant.access_token.access_token,
            token_type: grant.access_token.token_type,
            refresh_token: grant.refresh_token,
            scope: grant.scope.join(' '),
            expires_in: grant.access_token.ttl
          };

          res.send(response);
        });
      });
    });
    }
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
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Connection', 'close');
  var query = req.body || {};
  var clientId = query.client_id;
  if(!query.scope) {
    req.a2.scope = [self.authorizationService.validScopes[0]];
  } else {
    req.a2.scope = query.scope;
  }
  if(query.state) {
    req.a2.state = query.state;
  }
  if(!clientId) {
    return errors.code.invalid_client_id(req, res);
  }

  this.clientService.load(clientId, function(err, client) {
    if(err || !client) {
      return errors.code.invalid_client_id(req, res);
    }
    req.a2.client = client;
    if(!verify.redirectUri(client, query.redirect_uri)) {
      return errors.code.invalid_redirect_uri(req, res);
    }

    req.a2.redirect_uri = query.redirect_uri || client.redirect_uri;

    if(!verify.responseType(query.response_type)) {
      return errors.code.invalid_request(req, res);
    }

    self.authenticationService.login(req, res, function(err, user) {
      if(err) {
        return self.authenticationService.renderLoginForm(req, res);
      }

      self.authorizationService.checkScope(req, res, user, client, req.a2.scope, function(err, scopes) {
        if(err) {
          return errors.code.invalid_scope(req, res);
        }
        var authorizeScopes = Object.keys(scopes);
        console.log("Asking authorizeService to authorizes scopes ",authorizeScopes);
        return self.authorizationService.authorize(user, client, req.a2.redirect_uri, authorizeScopes, function(err, grant) {
          if(err) {
            return errors.server_error(req, res);
          }
          if(query.response_type === "code") {
            return res.redirect(utils.createRedirectionUrlForCode(req.a2, grant.code));
          } else {
            self.tokenService.exchangeGrantForToken(grant, "token", function(err, grant) {
              if(err) {
                return errors.code.server_error(req, res);
              }
              console.log("Implicit flow, sending user to",client.redirect_uri+'#access_token='+encodeURIComponent(grant.access_token.access_token));
              return res.redirect(utils.createRedirectionUrlForToken(req.a2, grant.access_token.access_token));
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
  var self, redirectUrl, query;
  query = req.query || {};
  self = this;

  if(!query.client_id) {
    return errors.code.invalid_client_id(req, res);
  }


  this.clientService.load(query.client_id, function(err, client) {
    if(err || !client) {
      return errors.code.invalid_client_id(req, res);
    }
    req.a2.client = client;

    var error = verify.verifyAuthorizationGET(req, res);
    if(error && error.error) {
      return;
    }
    self.authenticationService.login(req, res, function(err, user) {
      if(err || !user) {
        return self.authenticationService.renderLoginForm(req, res);
      }
      req.a2.user = user;
      self.authorizationService.checkScope(req, res, user, client, req.a2.scope, function(err, scopes) {
        if(err) {
          return errors.code.invalid_scope(req, res);
        }

        if(Object.keys(scopes).length > 0) {
          return self.authorizationService.renderAuthorizeForm(req, res, scopes);
        } else {
          self.authorizationService.authorize(user, client, req.a2.redirect_uri, scopes, function(err, grant) {
            if(err) {
              return errors.code.server_error(req, res);
            }
            if(query.response_type === "code") {
              return res.redirect(utils.createRedirectionUrlForCode(req.a2, grant.code));
            } else {
              self.tokenService.exchangeGrantForToken(grant, "token", function(error, grant) {
                if(error) {
                  console.log(error);
                  return errors.code.server_error(req, res);
                }
                return res.redirect(utils.createRedirectionUrlForToken(req.a2, grant.access_token.access_token));
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

