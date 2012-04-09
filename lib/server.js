/*!
 * oauth2 server
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
 * Expose Server
 */
exports = module.exports = Server;

/**
 * OAuth2 Authorization server
 * @param options
 *
 * Options:
 *  `crypt_secret`        Key used for token encryption
 *  `sign_secret`         Key used for signing tokens
 *  `authorize_endpoint`  Relative url to authorize endpoint, defaults to '/oauth2/authorize'
 *  `token_endpoint`      Relative url to token endpoint, defaults to '/oauth2/access_token'
 *
 */
function Server(options) {
  var self = this;
  options = options || {};
  EventEmitter.call(this);

  options.authorize_endpoint = options.authorize_endpoint || '/oauth2/authorize';
  options.token_endpoint = options.token_endpoint || '/oauth2/access_token';
  this.serializer = serializer.createSecureSerializer(options.crypt_secret, options.sign_secret);


  this.router = exports.router = express.router(function (app) {
    app.get(options.authorize_endpoint, self.authorizeEndpoint.bind(self));
    /*app.post(options.authorize_endpoint, self..bind(self));
    app.get(options.token_endpoint, self..bind(self));
    app.post(options.authorize_endpoint, self..bind(self));*/
  });
}

util.inherits(Server, EventEmitter);

/**
 * Authorization  endpoint, handles GET requests to authorization end point.
 * @param req http request
 * @param res http response
 * @param next callback for next middleware.
 */
Server.prototype.authorizeEndpoint = function(req, res, next) {

  var self = this;
  var query = req.query || {};
  if(!query.client_id || !query.response_type) {
    return errors.invalid_request(req, res);
  }
  this.lookupClient(query.client_id, function(err, client) {
    if(err) return errors.invalid_request(req, res);

    var validRedirect = verify.redirectUri(client, query.redirect_uri);
    if(!validRedirect) return errors.invalid_request(req, res);

    var validResponseType = verify.responseType(query.response_type);
    if(!validResponseType) return errors.unsupported_response_type(req, res);

    // check_login event should return user or render the login form for the user.
    self.emit('check_login', req, function(err, user) {
      if(err) return self.emit('login_form');

      self.emit('check_scope', user, req, function(err, scopes) {
        if(err) return errors.invalid_scope(req, res);


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