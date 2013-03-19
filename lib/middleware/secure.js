/**
 * Module dependencies
 */
var errors = require('../errors')
  , utils = require('../utils');


/**
 * Secures a route requiring a valid access_token.
 * optionally also laods the client and/or user reflected by the token.
 *
 * If a token is present the client_id and user_id are placed in req.a2
 *
 * Options:
 *  `server`            Required, the server that is used for decrypting tokens and loading clients/users.
 *  `load_client`       Load the client reflected by client_id and validates the client_id, default: false
 *  `load_user`         Loads the user reflected by user_id in access_token. Enables require_token., default: false
 *  `require_token`     Requires a valid access_token
 *  `store`             The to be used, see store dir. defalts to server's store.
 *
 * @param options {Object}
 *
 */
function secure(options) {
  var server = options.server;
  var loadClient = options.load_client || options.require_client || false;
  var loadUser = options.load_user || options.require_user || false;
  var requireToken = options.require_token || false;
  if(loadUser) {
    requireToken = true;
  }

  return function(req, res, next) {
    req.a2 = req.a2 || {};
    req.a2.server = server || req.app.a2.server;
    var self = this;
    if(req.query.client_id) {
      req.a2.client_id = req.query.client_id;
    }

    if(req.query.state || (req.body && req.body.state)) {
      req.a2.state = req.query.state;
    }
    if(req.query.response_type) {
      req.a2.response_type = req.query.response_type;
    }

    utils.getTokenFromRequest(req, res, function(err, tokenData) {
      if(err) {
        console.error("invalid token");
        return errors.resource.invalid_token(req, res);
      } else if((!err && !tokenData) && requireToken) {
        // No access_token was present, loadUser impossible.
        console.error("no token data available.");
        return errors.resource.access_denied(req, res);
      }
      
      if(tokenData) {
        server.tokenService.validateToken(tokenData, 'access_token', function(err, valid) {
          if(err || !valid) {
            console.error(err, valid);
            return errors.resource.invalid_token(req, res);
          }
          req.a2.access_token = tokenData;
          req.a2.user_id = tokenData.user_id;
          req.a2.client_id = tokenData.client_id;
          var clientId = tokenData.client_id;
          var userId = tokenData.user_id;

          if(loadClient) {
            server.clientService.load(clientId, function(err, client) {
              if(err) {
                return next(err);
              }
              if(!client) {
                return errors.resource.invalid_token(req, res);
              }
              req.a2.client = client;
              if(!loadUser || (loadUser && req.a2.user)) {
                return next();
              }
            });
          }

          if(loadUser) {
            server.userService.load(tokenData.user_id, function(err, user) {
              if(err) {
                return next(err);
              }
              if(!user) {
                return errors.resource.invalid_token(req, res);
              }
              req.a2.user = user;
              if(!loadClient || (loadClient && req.a2.client)) {
                return next();
              }
            });
          }

          if(!loadClient && !loadUser) {
            return next();
          }
        });
      } else {
        if(loadClient && req.query.client_id) {
          server.clientService.load(req.query.client_id, function(err, client) {
            if(err || !client) {
              return errors.resource.access_denied(req, res);
            }
            req.a2.client = client;
            return next();
          });
        } else if(loadClient && !req.query.client_id) {
          return errors.resource.access_denied(req, res);
        } else if(requireToken || (loadClient && !req.query.client_id)) {
          console.log("need token but no token or need client and no client_id");
          return errors.resource.access_denied(req, res);
        } else {
          if(loadClient && !req.query.client_id) {
            console.log("loadClient without client_id");
            return errors.resource.access_denied(req, res);
          }
          return next();
        }
      }
    });
  }
}

/**
 * expose middleware
 */
module.exports = secure;