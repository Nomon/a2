/*!
 * oauth2 server
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */

/**
 * expose server
 */
exports.Server = require('./server');
exports.Authentication = require('./services/authentication');
exports.Authorization = require('./services/authorization');
exports.ClientService = require('./services/client');
exports.UserService = require('./services/user');
exports.errors = require('./errors');
exports.verify = require('./verify');
exports.store = require('./store');
exports.init = require('./middleware/init');

/**
 * creates a new Server instance and returns it.
 * @param options Object options
 */
exports.createServer = function(options) {
  return new exports.Server(options);
};