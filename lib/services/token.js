/*!
 * a2 suite
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */


function TokenService(server) {
  this.server = server;
  this.sserializer = server.sserializer;
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