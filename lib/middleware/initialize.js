module.exports = function(server) {
  return function(req, res, next) {
    req.a2 = req.a2 || {};
    req.a2.server = server;
    return next();
  }
}