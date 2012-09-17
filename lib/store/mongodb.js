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




function MongoDBStore(options) {
  options = options || {};
  if(options.namespace) {
    this.namespace = options.namespace;
  }
  // Avoid redis hard req.
  var Db = require('mongodb').Db,
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server;

  this.client =  new Db(options.database || 'a2',  new Server(options.host, options.port, {}), {native_parser:true});
  this.client = this.client.open(function(err, db) {

  });

  this.options = options;
}

module.exports = MongoDBStore;

MongoDBStore.prototype.get = function(id, callback) {
  var namespace = this.namespace ? this.namespace +":" : "";
  this.client.hgetall(namespace+id, function(err, res) {
    callback(err, res);
  });
};

MongoDBStore.prototype.set = function(id, value, callback) {
  var namespace = this.namespace ? this.namespace +":" : "";
  this.client.hmset(namespace+id, value, function(err, res) {
    callback(err, res);
  });
};

MongoDBStore.prototype.namespace = function(namespace) {
  var opt = {};
  for(var i in this.options) {
    opt[i] = this.options[i];
  }
  opt.namespace = namespace;
  return new MongoDBStore(opt);
};