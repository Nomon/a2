/*!
 * oauth2 server
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */

/**
 * Module Dependencies
 */
var util = require('util')
  , BaseStore = require('../').BaseStore;

var RedisStore = function(options) {
  // avoid redis requirement if you dont use this store
  var redis = require('redis');
  this.client = redis.createClient(options.redis_port, options.redis_host);
};

RedisStore.prototype.get = function(id, callback) {
  this.client.hgetall('client:'+id, function(err, res) {
    callback(err, res);
  });
};