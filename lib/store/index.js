/*!
 * oauth2 server
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */


var BaseStore = function(namespace) {

};

BaseStore.prototype.set = function() {
  throw new Error("Store has to implement set()");
};

BaseStore.prototype.get = function() {
  throw new Error("Store has to implement get()");
};

BaseStore.prototype.expire = function(key, seconds, callback) {
  throw new Error("Store has to implement expire()");
};

BaseStore.prototype.del = function(key, callback) {
  throw new Error("Store has to implement del()");
};

exports.BaseStore = BaseStore;


exports.LocalStore = require('./local');
exports.RedisStore = require('./redis');