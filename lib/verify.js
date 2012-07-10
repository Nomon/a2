

/**
 * Verifies that client redirect uri is present and if one is provided with the request checks that it matches.
 */
exports.redirectUri = function(client, redirectUri) {
  var uris = [];
  if(!client) return false;
  if(!client.redirect_uri) return false;

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

  for(var i = 0; i<uris.length; i++) {
    var uri = uris[i];
    if(uri === redirectUri) {
       return true;
    }
  }
  return false;
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
  var all = scopes.split(' ').every(function(scope) {
    return validScopes.indexOf(scope) != -1;
  });
  return all;
};