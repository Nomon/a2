/*!
 * a2 suite
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */


function ClientService(server) {
  this.server = server;
  this.store = this.server.store.namespace("clients");
}

/**
 * expose server
 * @type {ClientService}
 */
module.exports = ClientService;

ClientService.prototype.load = function(clientId, callback) {
  var client;
  this.store.get(clientId, function(err, client) {
    if(err) {
      return callback(err);
    }
    if(!client) {
      return callback(null, null);
    }
  });
};