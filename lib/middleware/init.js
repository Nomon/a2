var url = require('url')
  , errors = require('../errors')
  , authorize = require('./authorize')
  , token = require('./token')
  , verify = require('../verify');

function Init(server) {
  var clientService = server.clientService;
  var validScopes = server.scopes;
  var defaultScope = validScopes[0];

  return function(req, res, next) {
    var info, code, token, match;
    // initialize oauth2
    req.a2 = req.a2 || {};
    req.a2.server = server;

    // response_type is required.
    if(req.query && req.query.response_type) {
      if(!verify.responseType(req.query.response_type)) {
        return errors.unsupported_response_type(req, res);
      }
    } else {
      return errors.invalid_request(req,res);
    }


    /**
     * Check for some request level things not specific to routes here.
     */
    if(req.query) {
      token = req.query.access_token;
      if(req.headers && req.headers.authorization) {
        match = req.headers.authorization.match(/Bearer\s+(.*)/);
        if(token && match) {
          // You are allowed to supply token in query string OR header, not both.
          return errors.invalid_request(req, res);
        } else if(match) {
          token = match[1].replace('Bearer', '').trim();
        }
      }
      if(token) {
        req.a2.info = server.tokenService.load(token);
      }
    }
/*
    if(info && req.method === "GET" && info.pathname === server.options.authorize_endpoint) {
      return authorize(req, res, next);
    } else if(info && req.method == "POST" && info.pathname === server.options.authorize_endpoint) {

    }
*/
    next();
  }
}

module.exports = Init;