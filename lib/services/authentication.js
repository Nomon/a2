/*!
 * a2 suite
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */


/**
 * Module Dependencies
 */
var store = require('../store')
  , errors = require('../errors');


/**
 * Authentication
 *
 * @param server  `Server` instance
 * @param options
 *
 * Options:
 *  `store` The to be used, see store.js. defalts to local store.
 *
 */
function Authentication(server, options) {
  options = options || {};
  this.server = server;
  this.store = server.store.namespace("users");
  if(options.login_endpoint) {
    server.options.login_endpoint = options.login_endpoint;
  }
  //server.on('check_login',this.checkLogin.bind(this));
  server.on('login_form', this.renderLoginForm.bind(this));
}

/**
 * expose Authentication
 */
module.exports = Authentication;

/**
 * login checks userId from session, if not present error will generated
 * note
 * @param req {http.Request} req Request Object
 * @param res {http.Response} res Response Object
 */
Authentication.prototype.login = function(req, res, callback) {
  var user, session = req.session;
  if(!session) {
    console.log("No session");
    return errors.session_missing(req, res);
  }
  if(!session.user && !req.user) {
    return callback(new Error("Not logged in"), null);
  }
  return callback(null, session.user || req.user);
};

/**
 * User supplied login form function. If not specified will use default one.
 * @param callback
 */
Authentication.prototype.loginForm = function(callback) {
  this.server.removeAllListeners('login_form');
  this.server.on('login_form', callback.bind(this));
};

/**
 * Default login form, throws as loginForm has to be implemented.
 * @param req {http.Request} req Request Object
 * @param res {http.Response} res Response Object
 */
Authentication.prototype.renderLoginForm = function(req, res) {
  throw new Error('Set your login rendering function with loginForm()!');
};
