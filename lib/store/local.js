/*!
 * oauth2 server
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */

var clientStorage = {};

function LocalStore(options) {
  options = options || {};
  if(options.namespace) {
    this.namespace = options.namespace;
  }
}
/**
 * Expose LocalStorage
 * @type {Function}
 */
module.exports = LocalStore;

LocalStore.prototype.set = function(id, val, cb) {
  var storage = clientStorage;
  if(this.namespace) {
    if(!storage[this.namespace]) {
      storage[this.namespace] = {};
    }
  }
  if(this.namespace) {
    storage = clientStorage[this.namespace];
  }
  storage[id] = val;
  if(cb) {
    cb(null,storage[id]);
  }
  return storage[id];
};

LocalStore.prototype.get = function(id, cb) {
  var storage = clientStorage;
  if(this.namespace) {
    if(!storage[this.namespace]) {
      storage[this.namespace] = {};
    }
  }
  if(this.namespace) {
    storage = clientStorage[this.namespace];
  }
  if(cb) {
    cb(null, storage[id]);
  }
  return storage[id];
};

LocalStore.prototype.expire = function(key, seconds) {
  var self = this;
  setTimeout(function() {
    self.delete(key);
  },Number(seconds) * 1000);
};

LocalStore.prototype.del = function(key, cb) {
  delete clientStorage[key];
  cb(null, null);
};

/**
 * Allows simple namespacing of data, storage.namespace("authorizations").get(id) etc.
 * @param namespace the namespace to use, this will get reset after use and return to root but you can store it!
 */
LocalStore.prototype.namespace = function(namespace) {
  return new LocalStore({namespace:namespace});
};

