/*!
 * a2 authentication & authorization suite
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */

/**
 * expose server & services.
 */
exports.Server = require('./server');
exports.Authentication = require('./services/authentication');
exports.Authorization = require('./services/authorization');
exports.ClientService = require('./services/client');
exports.UserService = require('./services/user');

/**
 * Expose internals
 */
exports.errors = require('./errors');
exports.verify = require('./verify');
exports.store = require('./store');
exports.utils = require('./utils');

/**
 * Expose middlewares. init, secure.
 */
exports.middleware = require('./middleware');

/**
 * creates a new Server instance and returns it.
 * @param options Object options
 */
exports.createServer = function(options) {
  return new exports.Server(options);
};