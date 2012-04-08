/*!
 * oauth2 server
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */

var clientStorage = {};

function LocalStore(id) {

};

LocalStore.prototype.set = function(id, val, cb) {
  clientStorage[id] = val;
  if(cb) {
    cb(null,clientStorage[id]);
  }
  return clientStorage[id];
};

LocalStore.prototype.get = function(id, cb) {
  if(cb) {
    cb(null, clientStorage[id]);
  }
  return clientStorage[id];
};


exports = module.exports = LocalStore;