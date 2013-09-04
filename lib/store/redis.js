/*!
 * oauth2 server
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */

/**
 * Module Dependencies
 */
var util = require('util')
  , BaseStore = require('./index').BaseStore;




function RedisStore(options) {
  options = options || {};
  if(options.namespace) {
    this.namespace = options.namespace;
  }
  // Avoid redis hard req.
  if(options.client) {
    this.client = options.client;
  } else {
    var redis = require('redis');
    this.client = redis.createClient(options.redis_port, options.redis_host);
  }
  if(options.redis_database) {
    this.client.select(options.redis_database);
  }
  this.options = options;
}

module.exports = RedisStore;

RedisStore.prototype.get = function(id, callback) {
  var namespace = this.namespace ? this.namespace +":" : "";
  this.client.get(namespace+id, function(err, res) {
    callback(err, res);
  });
};

RedisStore.prototype.set = function(id, value, callback) {
  var namespace = this.namespace ? this.namespace +":" : "";
  console.log("Set",namespace+id, "to",value);
  this.client.set(namespace+id, value, function(err, res) {
    callback(err, res);
  });
};

RedisStore.prototype.namespace = function(namespace) {
  var opt = {};
  for(var i in this.options) {
    opt[i] = this.options[i];
  }
  opt.namespace = namespace;
  return new RedisStore(opt);
};

RedisStore.prototype.expire = function(key, seconds, callback) {
  var namespace = this.namespace ? this.namespace +":" : "";
  return this.client.expire(namespace+key, seconds, callback);
};

RedisStore.prototype.del = function(key, cb) {
  var namespace = this.namespace ? this.namespace +":" : "";
  return this.client.del(namespace+key, cb);
};
