var errors = require('./errors')
  , url = require('url')
  , qs = require('querystring');

/**
 * Gets access token data from request
 *
 * @param req {Object}
 * @param res {Object}
 * @param callback {Function}
 * @api public
 * @return {*}
 */
exports.getTokenFromRequest = function(req, res, callback) {
  var a2, token,match, server;
  a2 = req.a2;
  server = a2.server;
  token = req.query.access_token;
  if (req.headers && req.headers.authorization) {
    match = req.headers.authorization.match(/(?:Bearer|OAuth)\s+(.*)/);
    if (token && match) {
      // You are allowed to supply token in query string OR header, not both.
      return errors.resource.invalid_request(req, res);
    } else if (match) {
      token = match[1].replace('Bearer', '').replace('OAuth','').trim();
    }
  }
  if(token) {
    server.tokenService.load(token, function(err, tokenData) {
      return callback(err, tokenData);
    });
  } else {
    return callback(null, null);
  }
};


/**
 * createRedirectionUrlForCode
 *
 * creates a redirectUrl string for code flow.
 *
 * @param a2 {Object} a2
 * @param code {String} token
 * @param error {Object} error
 * @api private
 * @return {Object|ServerResponse}
 */
exports.createRedirectionUrlForCode = function(a2, code, error) {
  var client, redirectUrl;
  redirectUrl = url.parse(a2.redirect_uri, true);

  if(error) {
    Object.keys(error).forEach(function(key) {
      redirectUrl.query[key] = error[key];
    });
  } else {
    redirectUrl.query.code = code;
  }

  if(a2.state) {
    redirectUrl.query.state = a2.state;
  }
  if(a2.scope) {
    redirectUrl.query.scope = a2.scope.join(' ');
  }
  return url.format(redirectUrl);
};


/**
 * createRedirectionUrlForToken
 *
 * creates a redirectUrl string for implicit token from authorize endpoint
 *
 * @param a2 {Object} a2
 * @param grant {Object} grant
 * @param error {Object} error
 * @api private
 * @return {Object|ServerResponse}
 */
exports.createRedirectionUrlForToken = function(a2, grant, error) {
  var query, redirectUrl;
  var accessToken, scope;
  console.log("redirect url for grant",grant);
  if(typeof grant === "object" && grant.access_token && grant.access_token.access_token) {
    accessToken = grant.access_token.access_token;
    scope = grant.scope;
  } else {
    accessToken = grant;
    scope = ["basic"];
  }
  redirectUrl = url.parse(a2.redirect_uri, true);
  query = {};
  if(a2.state) {
    query.state = a2.state;
  }
  if(scope) {
    query.scope = scope.join(' ');
  }
  if(error) {
    query = error;
    if(a2.state) {
      query.state = a2.state;
    }
    redirectUrl.hash = '#'+qs.stringify(query);
  } else {
    query.access_token = accessToken;
    redirectUrl.hash = '#'+qs.stringify(query);
  }
  return url.format(redirectUrl);
};
