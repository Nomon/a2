/*!
 * a2 suite
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */


function UserService(server) {
  this.server = server;
  this.store = this.server.store.namespace("users");
}

/**
 * expose server
 * @type {ClientService}
 */
module.exports = UserService;

UserService.prototype.load = function(userId, callback) {
  this.store.get(userId, function(err, user) {
    if(err) {
      return callback(err);
    }
    if(!user) {
      return callback(null, null);
    }
    return callback(err, user);
  });
};
