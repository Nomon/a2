/*!
 * oauth2 server
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */


var BaseStore = function() {

};

BaseStore.prototype.set = function() {
  throw new Error("Store has to implement set()");
};

BaseStore.prototype.get = function() {
  throw new Error("Store has to implement get()");
};

exports.BaseStore = BaseStore;


exports.LocalStore = require('./local');
exports.RedisStore = require('./redis');