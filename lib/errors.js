/*!
 * oauth2 server
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */
var url = require('url');

/**
 * Module Dependencies
 */
var querystring = require('querystring');

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
  res.writeHead(401, {"Content-type": "application/json;charset=UTF-8"});
  return res.end(JSON.stringify(error));
};

exports.invalid_grant = function (req, res) {
  var error = {
    error: "invalid_grant", error_description: "The request is missing a required parameter, includes an invalid parameter value, " +
      "or is otherwise malformed."
  };
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

