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
  var redis = require('redis');
  this.client = redis.createClient(options.redis_port, options.redis_host);
  if(options.redis_database) {
    this.client.select(options.redis_database);
  }
  this.options = options;
}

module.exports = RedisStore;

RedisStore.prototype.get = function(id, callback) {
  var namespace = this.namespace ? this.namespace +":" : "";
  this.client.hgetall(namespace+id, function(err, res) {
    callback(err, res);
  });
};

RedisStore.prototype.set = function(id, value, callback) {
  var namespace = this.namespace ? this.namespace +":" : "";
  this.client.hmset(namespace+id, value, function(err, res) {
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