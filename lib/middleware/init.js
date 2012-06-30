var url = require('url')
  , errors = require('../errors')
  , authorize = require('./authorize')
  , token = require('./token');

function Init(server) {
  var clientService = server.clientService;

  return function(req, res, next) {
    req.a2 = {};
    var info;

    info = url.parse(req.url, true);

    if(info && req.method === "GET" && info.pathname === server.options.authorize_endpoint) {
      if(!req.query || !req.query.client_id || !req.query.response_type) {
         return errors.invalid_request(req, res);
      }
      return authorize(req, res, next);
    } else if(info && req.method == "POST" && info.pathname === server.options.authorize_endpoint) {

    }

    next();
  }
}

module.exports = Init;