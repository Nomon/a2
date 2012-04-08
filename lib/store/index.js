/*!
 * oauth2 server
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */

var oauth2 = require('../');

var BaseStore = function() {

}

BaseStore.prototype.getClient = function() {
  throw new Error("Store has to implement getClient()");
};

BaseStore.prototype.getGrant = function() {
  throw new Error("Store has to implement getClient()");
};

exports.BaseStore = BaseStore;