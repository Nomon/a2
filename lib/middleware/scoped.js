var errors = require('../errors');

module.exports = function(scopes, required) {
  var requiredScopes;
  if(typeof scopes == "string") {
    requiredScopes = scopes.split(" ");
  }

  return function(req, res, next) {
    if((req.a2 && req.a2.access_token) || required) {
      var authorized = requiredScopes.every(function(scope) {
        return req.a2.access_token.scope.indexOf(scope) != -1;
      });
      if(authorized) {
        return next();
      } else {
        return errors.resource.insufficient_scope(req, res);
      }
    } else {
      return next();
    }
  };
}