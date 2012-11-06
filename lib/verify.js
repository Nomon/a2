var errors = require('./errors')
  , url = require('url');

/**
 * Verifies that client redirect uri is present and if one is provided with the request checks that it matches.
 */
exports.redirectUri = function(client, redirectUri) {
  var uris = [];
  if(!client) return false;
  if(!client.redirect_uri) return false;

  /**
   * as redirect_uri is optional, we still need to verify that it confirms to RFC.
   */


  if(Array.isArray(client.redirect_uri)) {
    uris = client.redirect_uri;
  } else {
    uris = [client.redirect_uri];
  }
  /**
   * if no uri is provided the first uri of client is used. if not it will be checked for presence.
   */
  if(!redirectUri) {
    return true;
  }


  var redirectUrl = url.parse(redirectUri);

  /*
   The redirection endpoint URI MUST be an absolute URI as defined by
   [RFC3986] Section 4.3.  The endpoint URI MAY include an
   "application/x-www-form-urlencoded" formatted (per Appendix B) query
   component ([RFC3986] Section 3.4), which MUST be retained when adding
   additional query parameters.  The endpoint URI MUST NOT include a
   fragment component.
   */
  if(redirectUrl.hash) {
    return false;
  }

  return uris.indexOf(redirectUri) != -1;
};

var validResponseTypes = ['code','token'];

exports.responseType = function(type) {
  for(var i in validResponseTypes) {
    if(type === validResponseTypes[i]) {
      return true;
    }
  }
  return false;
};

exports.scope = function(scopes, validScopes) {
  if(typeof scopes == "string") {
    scopes = scopes.split(' ');
  }
  var all = scopes.every(function(scope) {
    return validScopes.indexOf(scope) != -1;
  });
  return all;
};

var validGrantTypesForTokenPOST = ['password', 'authorization_code', 'client_credentials', 'refresh_token'];

exports.verifyTokenPOSTRequest = function(req, res) {
  req.a2 = req.a2 || {};
  if(!req.body.grant_type || !~validGrantTypesForTokenPOST.indexOf(req.body.grant_type)) {
    return errors.invalid_request(req, res);
  }
  req.a2.grant_type = req.body.grant_type;

  // 4.1.3.  Access Token Request
  if(req.a2.grant_type == "authorization_code") {
    if(!req.body.code) {
      return errors.token.invalid_request(req, res);
    }
    req.a2.code = req.body.code;
    if(!req.body.redirect_uri) {
      return errors.token.invalid_request(req, res);
    }
    req.a2.redirect_uri = req.body.redirect_uri;

    if(!req.body.client_id) {
      return errors.token.invalid_request(req, res);
    }
    req.a2.client_id = req.body.client_id;
    // 6.  Refreshing an Access Token
  } else if(req.a2.grant_type == "refresh_token") {
    if(!req.body.refresh_token) {
      return errors.token.invalid_request(req, res);
    }
    req.a2.refresh_token = req.body.refresh_token;
    // optional but if present has to be valid.
    if(req.body.scope) {
      req.a2.scope = req.body.scope.split(' ');
      if(!exports.scope(req.a2.scope, req.a2.server.authorizationService.validScopes)) {
        return errors.token.invalid_scope(req, res);
      }
    }
  } else if(req.a2.grant_type == "client_credentials") {
    // TODO implement basic auth username/client_secret
    throw new Error('a2 does not yet support client_credentials grant type!');
  } else if(req.a2.grant_type == "password") {
    throw new Error('a2 does not yet support password grant type!');
  }
  if(req.body.client_secret) {
    req.a2.client_secret = req.body.client_secret;
  }
  req.a2.request = req.body;
};

/**
 * Verifies a GET request to authorize endpoint
 *
 * @param req {Object} express.js http request
 * @param res {Object} express.js http response
 * @return {*}
 */
exports.verifyAuthorizationGET = function(req, res) {

  if(req.query.client_id) {
    req.a2.client_id = req.query.client_id;
  }
  if(req.query.redirect_uri) {
    if(!exports.redirectUri(req.a2.client, req.query.redirect_uri)) {
      return errors.code.invalid_redirect_uri(req, res);
    }
    req.a2.redirect_uri = req.query.redirect_uri;
  } else {
    req.a2.redirect_uri = req.a2.client.redirect_uri;
  }

  if(req.query.response_type != "code" && req.query.response_type != "token") {
    return errors.code.unsupported_response_type(req, res);
  }
  req.a2.response_type = req.query.response_type;

  if(req.query.scope) {
    if(!exports.scope(req.query.scope, req.a2.server.authorizationService.validScopes)) {
      return errors.code.invalid_scope(req, res);
    }
    req.a2.scope = req.query.scope.split(' ');
  } else {
    req.a2.scope = [req.a2.server.authorizationService.validScopes[0]];
  }

  if(req.query.state) {
    req.a2.state = req.query.state;
  }
};