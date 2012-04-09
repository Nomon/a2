/*!
 * oauth2 server
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */

/**
 * Module Dependencies
 */
var store = require('./store');

/**
 * expose Authentication
 */
exports = module.exports = Authentication;
/**
 * Authentication
 *
 * @param server  `Server` instance
 * @param options
 *
 * Options:
 *  `store`               The to be used, see store.js. defalts to local store.
 *
 */
function Authentication(server, options) {
  options = options || {};
  this.store = options.store || new store.LocalStore();

  server.on('check_login',this.checkLogin.bind(this));
}

/**
 * checkLogin checks userId from session, if not present error will generated
 * @param req {http.Request} req Request Object
 * @param res {http.Response} res Response Object
 */
Authentication.prototype.checkLogin = function(req, res, callback) {
  console.log("checking login",req.session);
  var session = req.session;
  if(!session) {
    return callback(new Error("Not logged in"), null);
  }
  if(!session.user) {
    return callback(new Error("Not logged in"), null);
  }
  return callback(null, session.user);
};