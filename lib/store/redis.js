/*!
 * oauth2 server
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */

/**
 * Module Dependencies
 */
var util = require('util')
  , BaseStore = require('../').BaseStore
  , redis = require('redis');

var RedisStore = function(options) {
  this.client = redis.createClient(options.redis_port, options.redis_host);
};

RedisStore.prototype.getClient = function(id, callback) {
  this.client.hgetall('client:'+id, function(err, res) {
    callback(err, res);
  });
};