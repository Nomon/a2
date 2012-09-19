/**
 * Module dependencies
 */
var errors = require('../errors');


/**
 * Secures a route requiring a valid access_token.
 * optionally also laods the client and/or user reflected by the token.
 *
 * If a token is present the client_id and user_id are placed in req.a2
 *
 * Options:
 *  `server`        Required, the server that is used for decrypting tokens and loading clients/users.
 *  `require_client`   Load the client reflected by client_id, default: false
 *  `require_user`     Loads the user reflected by user_id
 *  `store`         The to be used, see store dir. defalts to server's store.
 *
 * @param options
 *
 */
function secure(options) {
  var server = options.server;
  var loadClient = options.require_client || false;
  var loadUser = options.require_user || false;
  var required = options.required || true;

  return function(req, res, next) {
    var token, match;
    req.a2 = req.a2 || {};
    req.a2.client = req.a2.client || {};
    req.a2.user = req.a2.user || {};
    /**
     * Check for some request level things not specific to routes here.
     */
    if (req.query) {
      token = req.query.access_token;
      if (req.headers && req.headers.authorization) {
        match = req.headers.authorization.match(/Bearer\s+(.*)/);
        if (token && match) {
          // You are allowed to supply token in query string OR header, not both.
          return errors.invalid_request(req, res);
        } else if (match) {
          token = match[1].replace('Bearer', '').trim();
        }
      }
      if (token) {
        server.tokenService.load(token, function (err, tokenData) {
          if(err || !tokenData) {
            return errors.access_denied(req, res);
          }
          req.a2.client.id = tokenData.client_id;
          req.a2.user.id = tokenData.user_id;
          var loadedClient, loadedUser;
          function complete() {
            var completed = true;
            if((loadClient && !loadedClient) || (loadUser && !loadedUser)) {
              completed = false;
            }
            if(completed) {
              return next();
            }
          }
          if(loadClient || loadUser) {
            if(loadClient) {
              server.clientService.load(req.a2.client.id, function(err, client) {
                if(err) {
                  return next(err);
                }
                if(client) {
                  console.log("client loaded",client);
                  req.a2.client = loadedClient = client;
                }
                if(!client) {
                  return errors.invalid_client(req, res);
                }
                return complete();
              });
            }
            if(loadUser) {
              server.userService.load(req.a2.user.id, function(err, user) {
                if(err) {
                  return next(err);
                }
                if(user) {
                  console.log("user loaded",user);
                  req.a2.user = loadedUser = user;
                } else {
                  return errors.invalid_client(req, res);
                }
                return complete();
              });
            }
          } else {
            return complete();
          }
        });
      } else {
        if(loadUser) {
          return errors.access_denied(req, res);
        }
        next();
      }
    }
  }
}

/**
 * expose middleware
 */
module.exports = secure;