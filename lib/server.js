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
 *  `client_service`          Service to be used for handling clients
 *  `authentication_service`  Service to be used for authentication users for user if you want to allow password grants
 *  `authorization_service`   Service to be used in authorizing apps, validate scopes, handling auth codes
 *  `token_service`           Service to be used in token handling, generation, validation, refreshing
 *  `view_service`            Service to be used in rendering forms
 *  `scopes`                  Array of valid scopes, scopes[0] is granted by default if scope is not provided.
 */
function Server(options) {
  var self = this;
  options = options || {};
  EventEmitter.call(this);

  options.authorize_endpoint = options.authorize_endpoint || '/oauth2/authorize';
  options.token_endpoint = options.token_endpoint || '/oauth2/access_token';
  options.login_endpoint = options.login_endpoint || '/login';
  this.scopes = options.scopes || ['basic'];

  this.serializer = serializer.createSecureSerializer(options.crypt_secret, options.sign_secret);
  this.store = options.store || new LocalStore();
  this.clientService = options.client_service || new ClientService(this);
  this.authenticationService = options.authentication_service || new AuthenticationService(this);
  this.authorizationService = options.authorization_service || new AuthorizationService(this);
  this.tokenService = options.token_service || new TokenService(this);
  this.viewService = options.view_service || new ViewService(this);

  this.options = options;

  this.static = express.static(__dirname + '/browser/');


  this.router = exports.router = express.router(function (app) {
    app.get(options.authorize_endpoint, middleware.validate(self), self.authorizeGET.bind(self));
    //app.get(options.login_endpoint,self.loginEndpoint.bind(self));
    app.post(options.authorize_endpoint, middleware.validate(self), self.authorizePOST.bind(self));
  /*  app.get(options.token_endpoint, self..bind(self));
    app.post(options.authorize_endpoint, self..bind(self));*/
  });
}

util.inherits(Server, EventEmitter);

/**
 * Expose Server
 */
module.exports = Server;


/**
 * Authorization endpoint, handles POST requests to authorization endpoint.
 * @param req http request
 * @param res http response
 * @param next callback for next middleware.
 */
Server.prototype.authorizePOST = function(req, res, next) {
  var self = this;
  var query = req.query || {};
  this.setupRequest(req);
  if(!query.client_id || !query.response_type) {
    return errors.invalid_request(req, res);
  }

  this.lookupClient(query.client_id, function(err, client) {
    if(err) return errors.invalid_request(req, res);

    var validRedirect = verify.redirectUri(client, query.redirect_uri);
    if(!validRedirect) return errors.invalid_request(req, res);

    req.a2.client = {
      name: client.name
    };

    var validResponseType = verify.responseType(query.response_type);
    if(!validResponseType) return errors.unsupported_response_type(req, res);


    // check_login event should return user or render the login form for the user.
    self.emit('check_login', req, res, function(err, user) {
      if(err) return self.emit('login_form', req, res);
      self.emit('check_scope', user, client, req.query.scope || [''], function(err, scopes) {
        if(err) return errors.invalid_scope(req, res);

        if(Object.keys(scopes).length > 0) {
          req.a2.scopes = scopes;
          return self.emit('authorize_form', req, res, scopes);
        }
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
    self.authenticationService.login(req, res, function(err, user) {
      if(err) {
        var url = encodeURIComponent(req.url);
        return res.redirect(self.options.login_endpoint+'?redirect_uri='+url);
      }
      req.a2.user = user;
      self.authorizationService.checkScope(req, res, user, client, req.query.scope || [''], function(err, scopes) {
        if(err) return errors.invalid_scope(req, res);
        if(Object.keys(scopes).length > 0) {
          req.a2.scopes = scopes;

          return self.emit('authorize_form', req, res, scopes, function() {
            // if authorize_form calls this it means implicit authorize grant, ie your own app.
            if(req.query.response_type == "code") {

            } else if(req.query.response_type == "token") {
              self.tokenService.createOrFind(client.client_id, user.user_id, {scope:scopes}, function(error, token) {
                if(error) {
                  return errors.server_error(req, res);
                }

                res.redirect(client.redirect_uri+'#access_token='+encodeURIComponent(token));
              });

            }
          });
        }

      });
    });
  });
/*
  this.lookupClient(query.client_id, function(err, client) {
    if(err) return errors.invalid_request(req, res);


    var validRedirect = verify.redirectUri(client, query.redirect_uri);
    if(!validRedirect) return errors.invalid_request(req, res);

    req.a2.client = {
      name: client.name
    };

    var validResponseType = verify.responseType(query.response_type);
    if(!validResponseType) return errors.unsupported_response_type(req, res);

    // check_login event should return user or render the login form for the user.
    self.emit('check_login', req, res, function(err, user) {
      if(err) return self.emit('login_form', req, res);
      self.emit('check_scope', user, client, req.query.scope || [''], function(err, scopes) {
        if(err) return errors.invalid_scope(req, res);

        if(Object.keys(scopes).length > 0) {
          req.a2.scopes = scopes;
          return self.emit('authorize_form', req, res, scopes);
        }
      });
    });
  });*/
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

