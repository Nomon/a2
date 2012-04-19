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
  this.scopes = options.scopes || {'': "Read your basic info"};
  this.server = server;
  this.secureSerializer = server.serializer;
  server.on('check_scope', this.checkScope.bind(this));
  server.on('authorize_form', this.renderAuthorizeForm.bind(this));
}

Authorization.prototype.checkScope = function(user, client, scope, callback) {
  var self = this;
  console.log("client", client, "scope", scope);
  // get stored authorization for this client/user pair.
  if(!Array.isArray(scope)) {
    scope = scope.split(',');
  }

  this.store.get(user.id +":"+client.id, function(err, res) {
    if(err) return callback(err);
    var unauthorized =  [];
    var authorized = [];
    console.log(err, res);
    if(res && res.scope) {
      authorized = res.scope.split(',');
    }
    // filter away invalid scopes.
    scope.filter(function(s) {
      return self.scopes[s] === undefined;
    });

    scope.forEach(function(s) {
      if(authorized.indexOf(s) == -1) {
        unauthorized.push(s);
      }
    });
    var scopeObj = {};
    for(var i in unauthorized) {
      if(unauthorized.hasOwnProperty(i)) {
        scopeObj[unauthorized[i]] = self.scopes[unauthorized[i]];
      }
    }
    // need to authorize some scopes.
    return callback(null, scopeObj);
  });
};

/**
 * User supplied login form function. If not specified will use default one.
 * @param callback
 */
Authorization.prototype.authorizeForm = function(callback) {
  this.server.removeAllListeners('authorize_form');
  this.server.on('authorize_form', callback.bind(this));
};

/**
 * Default login form, throws as authorizeForm has to be implemented.
 */
Authorization.prototype.renderAuthorizeForm = function(req, res) {
  throw new Error('Set your authorize rendering function with authorizeForm()!');
};


module.exports = Authorization;