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
  , verify = require('./verify');


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
 */
function Server(options) {
  var self = this;
  options = options || {};
  EventEmitter.call(this);

  options.authorize_endpoint = options.authorize_endpoint || '/oauth2/authorize';
  options.token_endpoint = options.token_endpoint || '/oauth2/access_token';
  options.login_endpoint = options.login_endpoint || '/login';

  this.options = options;
  this.serializer = serializer.createSecureSerializer(options.crypt_secret, options.sign_secret);

  this.router = exports.router = express.router(function (app) {
    app.get(options.authorize_endpoint, self.authorizeGET.bind(self));
    app.get(options.login_endpoint, self.loginEndpoint.bind(self));
    app.post(options.authorize_endpoint, self.authorizePOST.bind(self));/*
    app.get(options.token_endpoint, self..bind(self));
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

Server.prototype.setupRequest = function(req) {
  req.a2 = req.a2 || {};
}
