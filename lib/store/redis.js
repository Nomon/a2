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



var RedisStore = function(options) {
  options = options || {};
  // avoid redis requirement if you dont use this store
  var redis = require('redis');
  this.client = redis.createClient(options.redis_port, options.redis_host);
};

exports = module.exports = RedisStore;

RedisStore.prototype.get = function(id, callback) {
  this.client.hgetall(id, function(err, res) {
    callback(err, res);
  });
};

RedisStore.prototype.set = function(id, value, callback) {
  this.client.hmset(id, value, function(err, res) {
    callback(err, res);
  });
};

