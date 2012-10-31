/*!
 * a2 suite
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */

var errors = require('../errors');

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

TokenService.prototype.exchangeGrantForToken = function(grant, responseType, callback) {
  var self = this;
  if(grant.used == true && responseType == "code") {
    return callback(new Error('Authorization grant already used for token.'), null);
  }

  self.createAccessToken(grant, function(err, grant) {
    return callback(err, grant);
  });
};

/**
 * generateAccessToken
 *
 * Encrypts client_id, user_id, ttl and scopes into the token.
 *
 * @param grant {Object}  the grant object with client_id, user_id and scopes.
 * @param ttl {Integer} Token time to live in seconds.
 * @api public
 * @return {Object} access_token object.
 */
TokenService.prototype.generateAccessToken = function(grant, ttl) {
  var self = this;
  ttl = ttl || 3600;
  var data = [grant.user_id, grant.client_id, Date.now(), ttl, grant.scope, 'access_token'];
  var token = self.sserializer.stringify(data);
  return {
      created_at: Math.floor(Date.now()/1000)
    , access_token: token
    , expires_in: ttl
    , token_type: "Bearer"
  };
};

/**
 * generateRefreshToken
 *
 * Generates a verifiable refresh token with user_id, client_id, scopes and TTL
 *
 * @param grant {Object}  the grant object with client_id, user_id and scopes.
 * @param ttl {Integer} Time to live for the refresh token, 1 month by default.
 * @api public
 * @return {String} refresh token string
 */
TokenService.prototype.generateRefreshToken = function(grant, ttl) {
  var self = this;
  ttl = ttl || 3600*24*31;
  var data = [grant.user_id, grant.client_id, Date.now(), ttl, grant.scope, 'refresh_token'];
  var token = self.sserializer.stringify(data);
  return token;
};

/**
 * createAccessToken
 *
 *  creates an access token based on a grant
 *
 * @param grant {Object} the grant object with client_id, user_id and scopes.
 * @api public
 * @param callback {Function} the callback function, invoked with (err, tokenData)
 */
TokenService.prototype.createAccessToken = function(grant, callback) {
  var token, self = this;
  grant.access_token = self.generateAccessToken(grant);
  grant.refresh_token = self.generateRefreshToken(grant);
  var refreshTokenKey = 'refresh_token:'+grant.refresh_token;
  grant.used = 1;
  self.server.authorizationService.saveGrant(grant, function(err, grant) {
    // Save ref to the grant with the refresh_token and make it expire in 1 month.
    self.store.set(refreshTokenKey, grant.key, function(err, data) {
      return callback(err, grant);
    });
  });
};

TokenService.prototype.load = function(token, callback) {
  var obj, info =  this.sserializer.parse(token);
  if(!info) {
    return callback(null, null);
  }

  obj = {
      user_id: info[0]
    , client_id: info[1]
    , created_at: info[2]
    , ttl: info[3]
    , scope: info[4]
    , type: info[5]
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
  var token = self.sserializer.stringify(data);
  return callback(null, token);
};


TokenService.prototype.validateToken = function(token, type, scope, callback) {
  var self = this;
  if(callback == undefined) {
    callback =  scope;
    scope = undefined;
  }

  function validate(tokenData) {
    // cant use refresh_token as access_token
    if(tokenData.type && tokenData.type != type) {
      return callback(null, false);
    }
    var now = Math.floor(Date.now()/1000);
    var expiresAt = Number(tokenData.created_at) + Number(tokenData.ttl);
    // is it expired.
   // TODO: enable later.
   /* if(now > expiresAt) {
      return callback(null, false);
    }*/
    return callback(null, true);
  }

  if(typeof token == 'string') {
    self.load(token, function(err, tokenData) {
      if(err || !tokenData) {
        return callback(err, tokenData);
      }
      return validate(tokenData);
    });
  } else {
    return validate(token);
  }
};