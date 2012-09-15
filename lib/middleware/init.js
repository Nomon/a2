  var url = require('url')
  , errors = require('../errors')
  , authorize = require('./authorize')
  , token = require('./token')
  , verify = require('../verify');

function Init(server) {
  return function(req, res, next) {
    // initialize a2;
    req.a2 = req.a2 || {};
    req.a2.server = server;
    next();
  }
}

module.exports = Init;