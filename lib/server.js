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
  , connect = require('connect')
  , serializer = require('serializer');

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

  options.authorize_endpoint = options.authorize_endpoint || '/oauth2/authorize';
  options.token_endpoint = options.authorize_endpoint || '/oauth2/authorize';
  this.serializer = serializer.createSecureSerializer(options.crypt_secret, options.sign_secret);

  this.router = exports.router = connect.router(function (app) {
    app.get(options.authorize_endpoint, self.authorizeEndpoint.bind(self));
   /* app.post(options.authorize_endpoint, self..bind(self));
    app.get(options.token_endpoint, self..bind(self));
    app.post(options.authorize_endpoint, self..bind(self));*/
  });
}

Server.prototype.authorizeEndpoint = function(req, res, next) {
  var self = this;

}

util.inherits(Server, EventEmitter);
