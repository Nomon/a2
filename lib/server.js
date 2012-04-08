/*!
 * oauth2-server
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */

/**
 * Module Dependencies
 */
var util = require('util')
  , EventEmitter = require('events').EventEmitter
  , serializer = require('serializer');

/**
 * Expose Server
 */
exports = module.exports = Server;

/**
 * OAuth2 Authorization server
 * @param options
 */
function Server(options) {
  options = options || {};
  EventEmitter.call(this);
  this.serializer = serializer.createSecureSerializer(options.crypt_secret, options.sign_secret);
}

util.inherits(Server, EventEmitter);