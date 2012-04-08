/*!
 * oauth2 server
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */

var clientStorage = {};

exports.getClient = function(id) {
  return clientStorage[id];
}