/*!
 * a2 suite
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */

/**
 * Module Dependencies
 */
var store = require('../store')
  , serializer = require('serializer')
  , errors = require('../errors')
  , verify = require('../verify');

/**
 * constants
 */

/**
 * http://tools.ietf.org/html/rfc6749#section-4.1.2
 * A maximum authorization code lifetime of 10 minutes is RECOMMENDED
 */
var AUTHORIZATION_CODE_TTL = 600;

/**
 * Authorization
 *
 * @param server  `Server` instance
 * @param options
 *
 * Options:
 *  `scope`   Array of valid scopes. defaults to ['basic']
 *  `store`   The store to be used, see store dir.
 *
 */
function Authorization(server, options) {
  options = options || {};
  this.store = server.store.namespace("authorization");
  this.sserializer = server.serializer;
  this.scopes = options.scopes || {'': "Read your basic info","basic": "Read and write your information"};
  this.server = server;
  this.validScopes = Object.keys(this.scopes);
  this.secureSerializer = server.serializer;
  server.on('check_scope', this.checkScope.bind(this));
  server.on('authorize_form', this.renderAuthorizeForm.bind(this));
}

/**
 * revokeTokensForCode
 *
 * revokes refresh tokens and access tokens issued with the code.
 *
 * @param code
 * @param callback
 */
Authorization.prototype.revokeTokensForCode = function(grant, callback) {
  var self = this;
  delete grant.access_token;
  var refreshTokenKey = 'refresh_token:'+grant.refresh_token;
  delete grant.refresh_token;
  delete grant.code;
  delete grant.used;
  self.store.del(refreshTokenKey, function(err) {
    if(err) {
      return callback(err, null);
    }
    self.saveGrant(grant, callback);
  });
};



/**
 * refreshCode
 *
 * Each authorization request gets it own code, even if a grant exists a new one will be generated and .used removed.
 *
 * @param grant
 * @param callback
 */
Authorization.prototype.refreshCode = function(grant, callback) {
  var self = this;
  self.createCode(grant.user_id, grant.client_id, grant.redirect_uri, grant.scope,  function(err, code) {
    if(err) {
      return errors.code.server_error(req, res);
    }
    grant.used = false;
    grant.code = code;
    self.saveGrant(grant, callback);
  });
};

/**
 * Checks that the requested scopes are valid and if new scopes are provided permissions are asked.
 *
 * @param user
 * @param client
 * @param scope
 * @param callback
 * @return {*}
 */
Authorization.prototype.checkScope = function(req, res, user, client, scope, callback) {
  var self = this
    , unauthorized =  []
    , authorized = []
    , scopeObj = {};
  var a2 = req.a2;
  if(!scope) {
    scope = [''];
  }
  // get stored authorization for this client/user pair.
  if(!Array.isArray(scope)) {
    scope = scope.split(' ');
  }
  console.log("Loading existing grant");
  this.loadGrantForUser(user, client, function(error, grant) {
    if(error) {
      return errors.server_error(req, res);
    }
    console.log("Grant found", grant);
    if(grant && grant.scope != null) {
      authorized = grant.scope;
      scope.filter(function(s) {
        return self.scopes[s] === undefined;
      });

      scope.forEach(function(s) {
        if(authorized.indexOf(s) == -1) {
          unauthorized.push(s);
        }
      });

      for(var i in unauthorized) {
        if(unauthorized.hasOwnProperty(i)) {
          scopeObj[unauthorized[i]] = self.scopes[unauthorized[i]];
        }
      }
      return callback(null, scopeObj);
    } else {
      scope.forEach(function(s) {
        scopeObj[s] = self.scopes[s];
      });
      return callback(null, scopeObj);
    }
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
Authorization.prototype.renderAuthorizeForm = function(req, res, scope) {
  res.render(this.server.options.authorize_template, {
    authorize_endpoint: this.server.options.authorize_endpoint,
    state:req.a2.state,
    scope:scope,
    redirect_uri: req.a2.client.redirect_uri,
    game: req.a2.client.name,
    response_type: req.query.response_type,
    client_id: req.a2.client.client_id
  });
};

/**
 * createCode
 *
 * Creates a signed & verifiable authorization code.
 *
 * @param user {Object/String} user with .id or string id
 * @param client {Object/String} client with .id or string id
 * @param redirectUri {String} the redirect_uri
 * @param scopes {Array/String} Array of scopes or string separated by space.
 * @param callback {Function} the callback function to be invoked on completion.
 * @return {String} the authorization code.
 */
Authorization.prototype.createCode = function(user, client, redirectUri, scope, callback) {
  var code, clientId, userId;
  if(typeof user == "object") {
    userId = user.id;
  } else {
    userId = user;
  }

  if(typeof client == "object") {
    clientId = client.client_id;
  } else {
    clientId = client;
  }

  if(Array.isArray(scope)) {
    scope = scope.join(' ');
  }

  var data = [clientId, userId, redirectUri, scope, Math.floor(Date.now()/1000)];
  code = this.sserializer.stringify(data);
  if(callback) {
    callback(null, code);
  }
  return code;
};

/**
 * loadCode
 *
 * Loads user_id, client_id, scopes and creation time from a provided authorization code.
 *
 * @param code {String} the encrypted authorization code.
 * @param callback {Function} callback function
 * @return {Object} object containing user_id, client_id, scopes. created_at or null if invalid code.
 */
Authorization.prototype.loadCode = function(code, callback) {
  var obj, info =  this.sserializer.parse(code);
  if(!info) {
    return callback(null, null);
  }
  console.log(code, info);
  obj = {
      client_id: info[0]
    , user_id: info[1]
    , redirect_uri: info[2]
    , scope: info[3].split(' ')
    , created_at: info[4]
  };

  if(callback) {
    return callback(null, obj);
  }
  return obj;
};

/**
 * loadGrant
 *
 * loads a grant from database with the authorization code and verifies the data matches the code.
 *
 * @param code
 * @param callback
 */
Authorization.prototype.loadGrant = function(code, callback) {
  var self = this;
  self.loadCode(code, function(err, codeGrant) {
    console.log("code",code,"loaded as ",codeGrant);
    self.store.get(code, function(err, key) {
      if(err || !key) {
        return callback(err, key);
      }
      self.store.get(key, function(err, grant) {
        if(err || !grant) {
          return callback(err, grant);
        }
        grant = JSON.parse(grant);
        console.log("Grant is:",grant);
        if(grant.client_id == codeGrant.client_id && grant.user_id == codeGrant.user_id) {
          return callback(null, grant);
        } else {
          console.warn("Grant code and database missmatch!",grant, codeGrant);
          return callback(null, null);
        }
      });
    });
  });
};

/**
 * Saves a grant to the database with user_id:client_id and authorization:code
 * @param grant {Object} grant object
 * @param callback
 */
Authorization.prototype.saveGrant = function(grant, callback) {
  var self = this;
  if(!grant.key) {
    grant.key = 'Grant:'+grant.client_id + ':' + grant.user_id;
  }
  this.store.set(grant.key, JSON.stringify(grant), function(err, gra) {
    self.store.set(grant.code, grant.key, function(err, gra) { // index the grant with code also.
      // RFC says RECOMMENDED max lifetime for authorization code is 10 mins.
      self.store.expire(grant.code, 10*60, function(err) {
        return callback(err, grant);
      });
    });
  });
};

/**
 * createGrant
 *
 * creates a new grant and an authorization_code for the grant.
 *
 * @param user {Object} user object with atleast .id
 * @param client {Object} user object with atleast .id
 * @param scopes {Array} array of scopes.
 * @param callback
 * @return {*}
 */
Authorization.prototype.createGrant = function(user, client, redirectUri, scope, callback) {
  if(typeof client == "object") {
    client = client.client_id
  }
  if(typeof user == "object") {
    user = user.id;
  }


  var grant = {
      user_id: user
    , client_id: client
    , scope: scope
    , redirect_uri: redirectUri
    , code: this.createCode(user, client, redirectUri, scope)
  };
  return callback(null, grant);
};

/**
 * loadGrantForUser
 *
 * looks for an existing grant for client_id user_id pair.
 *
 * @param user {Object|String} user object/id
 * @param client {Object|String} client object/id
 * @param callback
 */
Authorization.prototype.loadGrantForUser = function(user, client, callback) {
  var self = this;
  if(typeof client == "object") {
    client = client.client_id;
  }
  if(typeof user == "object") {
    user = user.id;
  }

  self.store.get('Grant:'+client+':'+user, function(err, grant) {
    if(grant) {
      grant = JSON.parse(grant);
    }
    return callback(err, grant);
  });
};

/**
 * authorize
 *
 * Authorizes client to user with scope.
 *
 *
 * @param user {Object|String} user object/id
 * @param client {Object|String} client object/id
 * @param redirectUri {String} redirect_uri
 * @param scope {Array|String} Array or space delimetered string of scopes.
 * @param callback
 */
Authorization.prototype.authorize = function(user, client, redirectUri, scope, callback) {
  var self = this;
  if(!Array.isArray(scope)) {
    if(typeof scope == "object") {
      scope = Object.keys(scope);
    } else if(typeof scope == "string") {
      scope = scope.join(' ');
    } else {
      scope = scope || ['basic'];
    }
  }

  this.loadGrantForUser(user, client, function(err, grant) {
    if(err) {
      return callback(err, null);
    }
    if(!grant) {
      self.createGrant(user, client, redirectUri, scope, function(err, grant) {
        if(err) {
          return callback(err, null);
        }
        self.saveGrant(grant, function(err, grant) {
          return callback(err, grant);
        });
      });
    } else {
      if(typeof grant.scope == "string") {
        grant.scope = grant.scope.split(' ');
      }
      var allScopesAuthorized = scope.every(function(key) {
        return grant.scope.indexOf(key) != -1;
      });

      if(redirectUri != grant.redirect_uri) {
        grant.redirect_uri = redirectUri;
      }

      if(!allScopesAuthorized) {
        grant.scope = scope;
        self.saveGrant(grant, function(err, d) {
          return callback(err, grant);
        });
      } else {
        // Old grant but each authorization needs its own code as they are single use.
        self.refreshCode(grant, function(err, grant) {
          if(err) {
            return errors.code.server_error(req, res);
          }
          return callback(null, grant);
        });
      }
    }
  });
};


/**
 * validateCode
 *
 * verifies authorization_code, makes sure its not expired, that redirect_uri and client_id matches etc.
 *
 * @param code
 * @param user
 * @param client
 * @param redirectUri
 * @param callback
 */
Authorization.prototype.validateCode = function(code, client, redirectUri, user, callback) {
  var self = this;
  if(callback == undefined) {
    callback = user;
    user = undefined;
  }
  if(typeof client == "object") {
    client = client.client_id;
  }

  function validate(codeData) {
    var now, expiresAt;
    /**
     * The authorization code is bound to the client identifier and redirection URI.
     */
    if(redirectUri != codeData.redirect_uri) {
      console.error("redirect uri missmatch", redirectUri, codeData.redirect_uri);
      return callback(null, false);
    }
    if(client != codeData.client_id) {
      console.error("client_id  missmatch", client, codeData.client_id);
      return callback(null, false);
    }
    // optional check if user is not undefined
    if(user && user.id != codeData.user_id) {
      return callback(null, false);
    }

    now = Math.floor(Date.now()/1000);
    expiresAt = Number(codeData.created_at) + AUTHORIZATION_CODE_TTL;
    // is it expired.
    if(now > expiresAt) {
      return callback(null, false);
    }
    return callback(null, true);
  }

  if(typeof code == 'string') {
    self.loadCode(code, function(err, codeData) {
      if(err || !codeData) {
        return callback(err, codeData);
      }
      return validate(codeData);
    });
  } else {
    return validate(code);
  }
};

module.exports = Authorization;
