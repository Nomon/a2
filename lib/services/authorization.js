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

  if(req.query && req.query.scope) {
    if(!verify.scope(req.query.scope, this.validScopes)) {
      return errors.invalid_scope(req, res);
    }
    a2.scope = req.query.scope.split(" ");
  } else {
    a2.scope = [''];
  }
  // get stored authorization for this client/user pair.
  if(!Array.isArray(scope)) {
    scope = scope.split(',');
  }
  console.log("Loading existing grant");
  this.loadGrantForUser(user, client, function(error, grant) {
    if(error) {
      return errors.server_error(req, res);
    }
    console.log("Grant found", grant);
    if(grant && grant.scopes != null) {
      authorized = grant.scopes.split(',');
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
Authorization.prototype.renderAuthorizeForm = function(req, res, scopes) {
  console.log(this.server.options);
  res.render(this.server.options.authorize_template, {
    authorize_endpoint: this.server.options.authorize_endpoint,
    state:req.query.state,
    scopes:scopes,
    redirect_uri: req.a2.client.redirect_uri,
    game: req.a2.client.name,
    response_type: req.query.response_type,
    client_id: req.a2.client.id
  });
};

Authorization.prototype.createCode = function(user, client, scopes, callback) {
  var code;
  var data = [client.id, user.id, scopes.join(','), Date.now()];
  code = this.sserializer.stringify(data);
  if(callback) {
    callback(null, code);
  }
  return code;
};

Authorization.prototype.loadCode = function(code, callback) {
  var obj, info =  this.sserializer.parse(code);
  if(!info) {
    return callback(null, null);
  }
  obj = {
      user_id: info[0]
    , client_id: info[1]
    , scopes: info[2]
    , created_at: info[3]
  };

  if(callback) {
    return callback(null, obj);
  }
  return obj;
};

Authorization.prototype.loadGrant = function(code, callback) {
  var self = this;
  this.store.get(code, function(err, key) {
    if(err || !key) {
      return callback(err, key);
    }
    self.store.get(key, function(err, grant) {
      if(err || !grant) {
        return callback(err, grant);
      }
      grant = JSON.parse(grant);
      return callback(null, grant);
    });
  });
};

Authorization.prototype.saveGrant = function(grant, callback) {
  var self = this;
  this.store.set(grant.client_id+':'+grant.user_id, JSON.stringify(grant), function(err, gra) {
    self.store.set(grant.code, grant.client_id+':'+grant.user_id, function(err, gra) { // index the grant with code also.
      return callback(err, grant);
    });
  });
};

Authorization.prototype.createGrant = function(user, client, scopes, callback) {
  var grant = {
      user_id: user.id
    , client_id: client.id
    , scopes: scopes.join(',')
    , code: this.createCode(user.id, client.id, scopes)
  };
  return callback(null, grant);
};

Authorization.prototype.loadGrantForUser = function(user, client, callback) {
  var self = this;
  self.store.get(client.id+':'+user.id, function(err, grant) {
    if(grant) {
      grant = JSON.parse(grant);
    }
    return callback(err, grant);
  });
};

Authorization.prototype.authorize = function(user, client, scopes, callback) {
  var self = this;
  console.log("Creating grant for scopes",scopes);
  this.loadGrantForUser(user, client, function(err, grant) {
    if(err) {
      return callback(err, null);
    }
    if(!grant) {
      console.log("No grant, creating one");
      self.createGrant(user, client, scopes, function(err, grant) {
        if(err) {
          return callback(err, null);
        }
        console.log("Grant created ", grant);
        self.saveGrant(grant, function(err, grant) {
          console.log("Grant saved", grant, err);
          return callback(err, grant);
        });

      });
    } else {
      console.log(grant);
      console.log("Exsiting grant found.");
      console.log(Object.keys(scopes).join(','), grant.scopes);
      if(Object.keys(scopes).join(',') != grant.scopes) {
        console.log("Exsiting grant found but missing scopes");
        grant.scopes = scopes;
        self.saveGrant(grant, function(err, d) {
          console.log(err, d);
          return callback(err, grant);
        });
      } else {
        return callback(null, grant);
      }
    }
  });
};

module.exports = Authorization;