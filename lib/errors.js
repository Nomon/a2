/*!
 * oauth2 server
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */
var url = require('url');

/**
 * Module Dependencies
 */
var querystring = require('querystring')
  , url = require('url');


/**
 * setAuthenticationChallenge
 *
 * Builds Authorization header challenge, 'WWW-Authenticate' for 'Authorization' header.
 *
 * @param req {Object}
 * @param res {Object}
 * @param error {Object}
 * @api public
 */
function setAuthenticateChallenge (req, res, error) {
  var responseHeader;
  if(error) {
    responseHeader = "Bearer realm=\"a2\", error=\""+error.error+"\", error_description=\""+error.error_description+"\"";
    if(req.a2 && req.a2.scope) {
      responseHeader +=  ", scopes=\"" + req.a2.scope.join(" ");
      responseHeader += "\"";
    }
  } else {
    responseHeader = "Bearer realm=\”a2\"";
  }

  /**
   * If the protected resource request does not include authentication credentials or does not contain an access token
   * that enables access to the protected resource, the resource server MUST include the HTTP WWW-Authenticate response
   * header field; it MAY include it in response to other conditions as well. The WWW-Authenticate header field uses the
   * framework defined by HTTP/1.1 [RFC2617].
   */
  if((error && req.headers['authorization']) || !req.headers['authorization']) {
    res.set('WWW-Authenticate', responseHeader);
  }
  return responseHeader;
}

/**
 * addErrorToQuery
 *
 * Adds error object fields to query as query components.
 *
 * @param req {Object} express.js HTTP request.
 * @param redirectionUri {String} the original redirection uri
 * @param responseType {String} code or token, token response appends stuff after #, code after ?
 * @param error {Object} error object with error + optional error_descriptiuon.
 * @return {*}
 */
function addErrorToQuery(redirectionUri, responseType, state, error) {
  var redirectionUrl, hash = '#', oauthState;

  if(error === undefined) {
    error = state;
    state = undefined;
  }

  if(typeof redirectionUri == "string") {
    redirectionUrl = url.parse(redirectionUri, true);
  } else {
    redirectionUrl = redirectionUri;
  }

  if(responseType == "code") {
    Object.keys(error).forEach(function(key) {
      redirectionUrl.query[key] = error[key];
    });
    if(state) {
      redirectionUrl.query.state = state;
    }
  } else {
    hash += Object.keys(error).map(function(key) {
      return "key="+encodeURIComponent(error[key]);
    }).join('&');
    if(state) {
      hash += "state="+encodeURIComponent(state);
    }
    redirectionUrl.hash = hash;
  }

  return url.format(redirectionUrl);
};

/**
 * Token endpoint responses
 */
exports.token = {};

/**
 * token endpoint errors
 * http://tools.ietf.org/html/rfc6749#section-5.2
 */
exports.token.invalid_request = function(req, res) {
  var error = {
    error: "invalid_request",
    error_description: "The request is missing a required parameter, includes an " +
                        "unsupported parameter value (other than grant type), " +
                        "repeats a parameter, includes multiple credentials, " +
                        "utilizes more than one mechanism for authenticating the " +
                        "client, or is otherwise malformed."};
  console.error(error.error, req.url);
  return res.send(400, error);
};

exports.token.invalid_client = function(req, res) {
  var error = {
    error: "invalid_client",
    error_description:
      "Client authentication failed (e.g., unknown client, no " +
      "client authentication included, or unsupported" +
      "authentication method)."
  };
  console.error(error.error, req.url);
  setAuthenticateChallenge(req, res, error);
  if(req.headers['authorization']) {
    return res.send(401, error);
  } else {
    return res.send(400, error);
  }
};

exports.token.invalid_grant = function(req, res) {
  var error = {
    error: "invalid_grant",
    error_description:
      "The provided authorization grant (e.g., authorization " +
      "code, resource owner credentials) or refresh token is " +
      "invalid, expired, revoked, does not match the redirection " +
      "URI used in the authorization request, or was issued to " +
      "another client."
  };
  console.error(error.error, req.url);
  return res.send(400, error);
};

exports.token.unauthorized_client = function(req, res) {
  var error = {
    error: "unauthorized_client",
    error_description:
      "The authenticated client is not authorized to use this" +
      "authorization grant type."
  };
  console.error(error.error, req.url);
  return res.send(400, error);
};

exports.token.unsupported_grant_type = function(req, res) {
  var error = {
    error: "unsupported_grant_type",
    error_description:
      "The authorization grant type is not supported by the " +
      "authorization server."
  };
  console.error(error.error, req.url);
  return res.send(400, error);
};

exports.token.invalid_scope = function(req, res) {
  var error = {
    error: "invalid_scope",
    error_description:
      "The requested scope is invalid, unknown, malformed, or " +
      "exceeds the scope granted by the resource owner."

  };
  console.error(error.error, req.url);
  return res.send(400, error);
};

exports.token.server_error = function(req, res) {
  var error = {
    "error":"server_error",
    "error_description": "The authorization server encountered an unexpected " +
      "condition that prevented it from fulfilling the request."
  };
  console.error(error.error, req.url);
  res.send(500, error);
};

/**
 * Resource owner errors in response to Authorization: header.
 */
exports.resource = {};
exports.resource.invalid_token = function(req, res) {
  var error = {
    "error":"invalid_token",
    "error_description": "The access token provided is expired, revoked, malformed, or invalid for other reasons."
  };
  setAuthenticateChallenge(req, res, error);
  res.send(401, error);
  console.error(error.error, req.url);
  return error;
};

exports.resource.invalid_request = function(req, res, next) {
  var error = {
    "error":"invalid_request",
    "error_description": "The request is missing a required parameter, includes an unsupported parameter or parameter value, "+
                         "repeats the same parameter, uses more than one method for including an access token, or is otherwise malformed."
  };
  console.error(error.error, req.url);
  setAuthenticateChallenge(req, res, error);
  res.send(400, error);
  return error;
};

exports.resource.insufficient_scope = function(req, res) {
  var error = {
    "error":"insufficient_scope",
    "error_description": "The request requires higher privileges than provided by the access token."
  };
  console.error(error.error, req.url);
  setAuthenticateChallenge(req, res, error);
  res.send(403, error);
  return error;
};

exports.resource.access_denied = function(req, res) {
  var error = {
    "error":"access_denied",
    "error_description": "The resource owner or authorization server denied the " +
                         "request."
  };
  console.error(error.error, req.url);
  res.send(400, error);
}

/**
 * Authorization endpoint responses for code and implicit token flows.
 *
 * http://tools.ietf.org/html/rfc6749#section-4.1.2.1
 * http://tools.ietf.org/html/rfc6749#section-4.2.2.1
 */


exports.code = {};

/**
 * Special case errors,
 *
 * if redirect uri mismatches we will not be redirecting with errors.
 * if client_id is invalid or missing in implicit flow no redirects either.
 */
exports.code.invalid_redirect_uri = function(req, res) {
  var error = {
    "error":"invalid_request",
    "error_description": "The request is missing a required parameter, includes an " +
      "invalid parameter value, includes a parameter more than " +
      "once, or is otherwise malformed."
  };
  console.error(error.error, req.url);
  res.send(500, error);
};

exports.code.invalid_client_id = function(req, res) {
  var error = {
    "error":"invalid_request",
    "error_description": "The request is missing a required parameter, includes an " +
      "invalid parameter value, includes a parameter more than " +
      "once, or is otherwise malformed."
  };
  console.error(error.error, req.url);
  res.send(500, error);
};


exports.code.invalid_request = function(req, res) {
  var error = {
    "error":"invalid_request",
    "error_description": "The request is missing a required parameter, includes an " +
                         "invalid parameter value, includes a parameter more than " +
                         "once, or is otherwise malformed."
  };
  console.error(error.error, req.url);
  var redirectUri = addErrorToQuery(req.a2.redirect_uri, req.a2.response_type, req.a2.state, error);
  return res.writeHead(302, {'location':redirectUri});
};

exports.code.unauthorized_client = function(req, res) {
  var error = {
    "error":"unauthorized_client",
    "error_description": "The client is not authorized to request an authorization " +
                         "code using this method."
  };
  console.error(error.error, req.url);
  var redirectUri = addErrorToQuery(req.a2.redirect_uri, req.a2.response_type, req.a2.state, error);
  return res.writeHead(302, {'location':redirectUri});
};

exports.code.access_denied = function(req, res) {
  var error = {
    "error":"access_denied",
    "error_description": "The resource owner or authorization server denied the " +
                         "request."
  };
  console.error(error.error, req.url);
  var redirectUri = addErrorToQuery(req.a2.redirect_uri, req.a2.response_type, req.a2.state, error);
  return res.writeHead(302, {'location':redirectUri});
};

exports.code.unsupported_response_type = function(req, res) {
  var error = {
    "error":"unsupported_response_type",
    "error_description": "The authorization server does not support obtaining an " +
                         "authorization code using this method."
  };
  console.error(error.error, req.url);
  var redirectUri = addErrorToQuery(req.a2.redirect_uri, req.a2.response_type, req.a2.state, error);
  return res.writeHead(302, {'location':redirectUri});
};

exports.code.invalid_scope = function(req, res) {
  var error = {
    "error":"invalid_scope",
    "error_description": "The requested scope is invalid, unknown, or malformed."
  };
  console.error(error.error, req.url);
  var redirectUri = addErrorToQuery(req.a2.redirect_uri, req.a2.response_type, req.a2.state, error);
  return res.writeHead(302, {'location':redirectUri});
};

exports.code.server_error = function(req, res) {
  var error = {
    "error":"server_error",
    "error_description": "The authorization server encountered an unexpected " +
                          "condition that prevented it from fulfilling the request."
  };
  console.error(error.error, req.url);
  var redirectUri = addErrorToQuery(req.a2.redirect_uri, req.a2.response_type, req.a2.state, error);
  return res.writeHead(302, {'location':redirectUri});
};

exports.code.temporarily_unavailable = function(req, res) {
  var error = {
    "error":"temporarily_unavailable",
    "error_description": "The authorization server is currently unable to handle " +
                         "the request due to a temporary overloading or maintenance" +
                         "of the server."
  };
  console.error(error.error, req.url);
  var redirectUri = addErrorToQuery(req.a2.redirect_uri, req.a2.response_type, req.a2.state, error);
  return res.writeHead(302, {'location':redirectUri});
};




/**
 * Application level errors, login failed etc
 */
exports.login_failed = function (req, res) {
  var error = {
    error: "access_denied", error_description: "The resource owner or authorization server denied the request"  };
  res.writeHead(400);
  res.end(error);
};

/**
 *
 * @param req
 * @param res
 * @return {*}
 */
exports.session_missing = function(req, res, next) {
  var server = req.a2.server;
  var login_endpoint = server.options.login_endpoint;
  var nextUrl = encodeURIComponent(querystring.stringify(req.query));
  res.writeHead(302, {'location':login_endpoint+'?next='+nextUrl});
};



/**
 * Currently supporting errors from draft-30
 */
exports.invalid_redirect_uri = function(req, res, next) {
  /**
   * Draft 30 4.1.2.1.:
   * If the request fails due to a missing, invalid, or mismatching
   * redirection URI, or if the client identifier is missing or invalid,
   * the authorization server SHOULD inform the resource owner of the
   * error, and MUST NOT automatically redirect the user-agent to the
   * invalid redirection URI.
   */
  var error = {
      error: "invalid_request"
    , error_description: "The request is missing a required parameter, includes an invalid parameter value, or is otherwise malformed."
  };
  return res.send(400, error);
};

exports.invalid_client = function (req, res) {
  var error = {
    error: "invalid_client",
    error_description: "The client is not authorized to request an authorization code using this method."
  };

  return res.send(401, error);
};

exports.invalid_grant = function (req, res) {
  var error = {
    error: "invalid_grant", error_description: "The request is missing a required parameter, includes an invalid parameter value, " +
      "or is otherwise malformed."
  };
  return res.send(400, error);
};

exports.unauthorized_client = function (req, res) {
  var error = {
    error: "unauthorized_client",
    error_description: "The client is not authorized to request an authorization code using this method."
  };
  var redirectUrl = url.parse(req.a2.client.redirect_uri, true);
  // implicit or code.
  if(req.a2.response_type == "token") {
    // fragment part;
    redirectUrl.hash = "#error"+encodeURIComponent(error.error)+'&'+encodeURIComponent(error.error_description);
  } else {
    redirectUrl.query.error = error.error;
    redirectUrl.query.error_description = error.error_description;
  }
  return req.redirect(302, url.format(redirectUrl));
};

exports.unsupported_grant_type = function (req, res) {
  var error = {
    error: "unsupported_grant_type", error_description: "The request is missing a required parameter, includes an invalid parameter value, " +
      "or is otherwise malformed."
  };
};


exports.invalid_request = function (req, res, next) {
  var error = {
    error: "invalid_request", error_description: "The request is missing a required parameter, includes an " +
      "invalid parameter value, or is otherwise malformed."  };
  res.writeHead(400, {"Content-type": "application/json;charset=UTF-8"});
  return res.end(JSON.stringify(error));
};

exports.unauthorized_client = function () {
  var error = {
    error: "unauthorized_client", error_description: "The client is not authorized to request an authorization " +
      "code using this method"  };
};

exports.access_denied = function (req, res) {
  var error = {
      error: "access_denied"
    , error_description: "The resource owner or authorization server denied the request"  };

  if(req.a2.client && req.a2.client.redirect_uri) {
    var redirectUrl = url.parse(req.a2.client.redirect_uri, true);
    // implicit or code.
    if(req.a2.response_type == "token") {
      // fragment part;
      redirectUrl.hash = "#error"+encodeURIComponent(error.error)+'&'+encodeURIComponent(error.error_description);
    } else {
      redirectUrl.query.error = error.error;
      redirectUrl.query.error_description = error.error_description;
    }
    return res.redirect(302, url.format(redirectUrl));
  }
  res.send(400,error);
};

exports.unsupported_response_type = function (req, res) {
  var error = {
    error: "unsupported_response_type", error_description: "The authorization server does not support obtaining an " +
      "authorization code using this method."  };

  if(req.a2.client && req.a2.client.redirect_uri) {
    var redirectUrl = url.parse(req.a2.client.redirect_uri, true);
    // implicit or code.
    if(req.a2.response_type == "token") {
      // fragment part;
      redirectUrl.hash = "#error"+encodeURIComponent(error.error)+'&'+encodeURIComponent(error.error_description);
    } else {
      redirectUrl.query.error = error.error;
      redirectUrl.query.error_description = error.error_description;
    }
    return res.redirect(302, url.format(redirectUrl));
  }
  res.send(400,error);
};

exports.invalid_scope = function () {
  var error = {
    error: "", error_description: "The requested scope is invalid, unknown, or malformed."  };

  if(req.a2.client && req.a2.client.redirect_uri) {
    var redirectUrl = url.parse(req.a2.client.redirect_uri, true);
    // implicit or code.
    if(req.a2.response_type == "token") {
      // fragment part;
      redirectUrl.hash = "#error"+encodeURIComponent(error.error)+'&'+encodeURIComponent(error.error_description);
    } else {
      redirectUrl.query.error = error.error;
      redirectUrl.query.error_description = error.error_description;
    }
    return res.redirect(302, url.format(redirectUrl));
  }
  res.send(400,error);
};

exports.server_error = function (req, res) {
  var error = {
    error: "server_error", error_description: "The authorization server encountered an unexpected " +
      "condition which prevented it from fulfilling the request."  };

  if(req.a2.client && req.a2.client.redirect_uri) {
    var redirectUrl = url.parse(req.a2.client.redirect_uri, true);
    // implicit or code.
    if(req.a2.response_type == "token") {
      // fragment part;
      redirectUrl.hash = "#error"+encodeURIComponent(error.error)+'&'+encodeURIComponent(error.error_description);
    } else {
      redirectUrl.query.error = error.error;
      redirectUrl.query.error_description = error.error_description;
    }
    return res.redirect(302, url.format(redirectUrl));
  }
  res.send(500, error);
};

exports.temporarily_unavailable = function (req, res) {
  var error = {
    error: "", error_description: "The authorization server is currently unable to handle the request due " +
      "to a temporary overloading or maintenance of the server."  };
  if(req.a2.client && req.a2.client.redirect_uri) {
    var redirectUrl = url.parse(req.a2.client.redirect_uri, true);
    // implicit or code.
    if(req.a2.response_type == "token") {
      // fragment part;
      redirectUrl.hash = "#error"+encodeURIComponent(error.error)+'&'+encodeURIComponent(error.error_description);
    } else {
      redirectUrl.query.error = error.error;
      redirectUrl.query.error_description = error.error_description;
    }
    return res.redirect(302, url.format(redirectUrl));
  }
  res.send(500, error);
};

