/*!
 * a2 suite
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */


function TokenService(server) {
  this.server = server;
  this.sserializer = server.serializer;
  this.store = server.store.namespace('token');
}

/**
 * expose server
 * @type {TokenService}
 */
module.exports = TokenService;

TokenService.prototype.load = function(token, callback) {
  var obj, info =  this.sserializer.parse(token);
  if(!info) {
    return callback(null, null);
  }

  obj = {
      user_id: data[0]
    , client_id: data[1]
    , expires: data[2]
    , extra: data[3]
  };
  if(callback) {
    return callback(null, obj);
  }
  return obj;
};

TokenService.prototype.createOrFind = function(userId, clientId, extra, callback) {
  var self = this;
  if(callback === undefined) {
    callback = extra;
    extra = {};
  }
  var data = [userId, clientId, Date.now()+9999999, extra];
  this.store.get(clientId+':'+userId, function(err, token) {
    if(!token) {
      token = self.sserializer.stringify(data);
      self.store.set(clientId+':'+userId, token, function(err, done) {
        return callback(null, token);
      });
    } else {
      return callback(null, token);
    }
  });
};