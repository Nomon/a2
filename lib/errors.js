/*!
 * oauth2 server
 * Copyright(c) 2012 Matti Savolainen <matti@applifier.com>
 * MIT Licensed
 */

/**
 * Module Dependencies
 */


/**
 * Application level errors, login failed etc
 */
exports.login_failed = function(req, res) {
  var error = {
      error: "access_denied"
    , error_description:"The resource owner or authorization server denied the request"  };
  res.writeHead(400);
  res.end(error);
};

/**
 * Currently supporting errors from draft-25
 */
exports.invalid_client = function(req, res) {
  var error = {
      error: "invalid_client"
    , error_description:"The client is not authorized to request an authorization code using this method."
  }
};

exports.invalid_grant = function(req, res) {
  var error = {
      error: "invalid_grant"
    , error_description:"The request is missing a required parameter, includes an invalid parameter value, " +
                        "or is otherwise malformed."
  }
};

exports.unauthorized_client = function(req, res) {
  var error = {
      error: "unauthorized_client"
    , error_description:"The request is missing a required parameter, includes an invalid parameter value, " +
                        "or is otherwise malformed."
  }
};

exports.unsupported_grant_type = function(req, res) {
  var error = {
      error: "unsupported_grant_type"
    , error_description:"The request is missing a required parameter, includes an invalid parameter value, " +
                        "or is otherwise malformed."
  }
};


exports.invalid_request = function(req, res, next) {
  var error = {
      error: "invalid_request"
    , error_description:"The request is missing a required parameter, includes an " +
                        "invalid parameter value, or is otherwise malformed."  }
    res.writeHead(400, {"Content-type": "application/json;charset=UTF-8"});
    return res.end(JSON.stringify(error));
};

exports.unauthorized_client = function() {
  var error = {
      error: "unauthorized_client"
    , error_description:"The client is not authorized to request an authorization " +
                        "code using this method"  }
};

exports.access_denied = function(req, res) {
  var error = {
      error: "access_denied"
    , error_description:"The resource owner or authorization server denied the request"  };
  res.writeHead(400);
  res.end(error);
};

exports.unsupported_response_type = function() {
  var error = {
      error: ""
    , error_description:"The authorization server does not support obtaining an " +
                        "authorization code using this method."  }
};

exports.invalid_scope = function() {
  var error = {
      error: ""
    , error_description:"The requested scope is invalid, unknown, or malformed."  }
};

exports.server_error = function() {
  var error = {
      error: ""
    , error_description:"The authorization server encountered an unexpected " +
                        "condition which prevented it from fulfilling the request."  }
};

exports.temporarily_unavailable = function() {
  var error = {
      error: ""
    , error_description:"The authorization server is currently unable to handle the request due " +
                         "to a temporary overloading or maintenance of the server."  }
};

