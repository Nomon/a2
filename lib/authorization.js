/*!
 * oauth2 server
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */

/**
 * Module Dependencies
 */
var store = require('./store')
  , serializer = require('serializer');

/**
 * Authorization
 *
 * @param server  `Server` instance
 * @param options
 *
 * Options:
 *  `scope`   Array of valid scopes. defaults to ['non-expiring']
 *  `store`   The to be used, see store dir. defalts to local store.
 *
 */
function Authorization(server, options) {
  options = options || {};
  if(options.store) {
    this.store = options.store.namespace("authorization");
  } else {
    this.store = new store.LocalStore({namespace:"authorization"});
  }
  this.scopes = options.scopes || ['non-expiring'];

  this.secureSerializer = server.serializer;
  server.on('check_scope', this.checkScope.bind(this));
}

Authorization.prototype.checkScope = function(user, client, scope, callback) {
  var self = this;
  // get stored authorization for this client/user pair.
  if(!Array.isArray(scope)) {
    scope = scope.split(',');
  }

  this.store.get(user.id +":"+client.id, function(err, res) {
    if(err) return callback(err);
    var unauthorized =  [];
    var authorized = [];
    if(res.scopes) {
      authorized = res.scopes.split(',');
    }
    // filter away invalid scopes.
    scope.filter(function(s) {
      return self.scopes.indexOf(s) != -1;
    });
    scope.forEach(function(s) {
      if(authorized.indexOf(s) != -1) {
        unauthorized.push(s);
      }
    });
    // need to authorize some scopes.
    return callback(null, unauthorized);
  });
};

module.exports = Authorization;