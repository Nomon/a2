var verify = require('../verify')
  , errors = require('../errors');

function Authorize(server) {

  return function(req, res, next) {
    var validResponseType = verify.responseType(req.query.response_type);
    if(!validResponseType) return errors.unsupported_response_type(req, res);

    server.clientService.load(req.query.client_id, function(err, client) {
      if(err) {
        next(new errors.server_error());
      }
      req.a2.client = client;
    });

  };
};

module.exports = Authorize;