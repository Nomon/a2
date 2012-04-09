/***
 * In browser window is global, exports window.A2
 */
(function(exports, global) {
  var A2 = exports;
  var options = {
      site : "https://local.host:3113"
    , state : +new Date()+""+Math.floor(Math.random() * 999999)
    , handle : "a2auth"
  };

  function accessToken(token) {
    var storage = global.localStorage;
    if (token === null) {
      return storage.removeItem("A2.accessToken");
    } else if (token === undefined) {
      return storage.getItem("A2.accessToken");
    } else {
      return storage.setItem("A2.accessToken", token);
    }
  }

  /**
   * dialog window for oauth.
   */
  var dialog = null;
  var token = accessToken();

  A2.initialize = function(cfg) {
    if(!cfg.client_id) {
     throw new Error("client_id is required!");
    }
    options.client_id = cfg.client_id;
    options.display = cfg.display || "popup";
    options.scope = cfg.scope || "basic";
    options.response_type = cfg.response_type || "token";
    options.redirect_uri = cfg.redirect_uri;
    options.width = cfg.width;
    options.height = cfg.height;
    console.log(document.location.search + document.location.hash);
    var url = new A2.URL(document.location.search + document.location.hash);
    var params = url.parseParameters();
    if(params.access_token) {
      accessToken(params.access_token);
      document.location.href = document.location.search;
    }
  };

  var auth = A2.auth = null;
  A2.token = accessToken;
  var connectCallbacks = {
      success: function(token) {
        accessToken(token);
      }
    , error: function(error) {
      console.log(error);
    }
    , general: function(what) {
      console.log(what);
    }
    , disconnect: function() {
      accessToken(null);
    }
  };



  function URL(string) {
    this.url = string;
  }

  URL.prototype.mergeParams = function (url, params) {
    if(!params) {
      params = url;
      url = undefined;
    }
    if(!url) {
      url = this.url;
    }
    var baseURL = url.split("?")[0];
    var newParams = this.parseParameters(url.toString());
    params = params || {};
    for (var key in params) {
      if (params.hasOwnProperty(key)) {
        newParams[key] = params[key];
      }
    }
    var queryString = this.buildQueryString(newParams);
    if (queryString.length > 0) {
      queryString = "?" + queryString;
    }
    this.url = baseURL + queryString;
    return this.url;
  };

  URL.prototype.isRelative = function (url) {
    return url === undefined ? (this.url[0] === '/') : (url[0] === "/");
  };

  URL.prototype.buildQueryString = function (params) {
    var queryStringArray = [];
    for (var name in params) {
      if (params.hasOwnProperty(name)) {
        queryStringArray.push(encodeURIComponent(name) + "=" + encodeURIComponent(params[name]));
      }
    }
    return queryStringArray.join("&");
  };

  URL.prototype.open = function(opt, url) {
    url = url || this.url;
    opt = opt || options;
    var left = global.screenX + (global.outerWidth - opt.width) / 2;
    var top = global.screenY + (global.outerHeight - opt.height) / 2;
    var openstr = "location=1, width=" + opt.width + ", height=" + opt.height + ", top=" + top + ", left=" + left + ", toolbar=no,scrollbars=yes";
    this.w = global.open(url, opt.handle || options.handle, openstr);
    return this.w;
  };

  URL.prototype.navigate = function(url) {
    document.location.href = url || this.url;
  };

  URL.prototype.parseParameters = function (uri) {
    if(!uri) {
      uri = this.url;
    }
    var splitted = uri.split(/[&?#]/);
    if (splitted[0].match(/^http/)) {
      splitted.shift();
    }

    var obj = {};
    for (var i in splitted) {
      if (splitted.hasOwnProperty(i)) {
        var kv = splitted[i].split("=");
        if (kv[0]) {
          obj[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
        }
      }
    }
    return obj;
  };

  URL.prototype.get = function() {
    return this.url;
  };

  URL.prototype.secure = function(secure, url) {
    if(!url) {
      url = this.url;
    }
    if(secure === undefined) {
      return url.search(/^https:\/\//) !== -1;
    }
    if(secure === true) {
      url = url.replace(/^http:\/\//,"https://");
    }  else if (secure === false) {
      url = url.replace(/^https:\/\//,"http://");
    }
    return (this.url = url).search(/^https:\/\//) !==-1;
  };

  function Auth(opt) {
    this.token = opt.access_token || options.access_token || accessToken();
    this.client_id = opt.client_id || options.client_id;
    this.response_type = opt.response_type || options.response_type;
    if(options.redirect_uri || opt.redirect_uri) {
      this.redirect_uri = opt.redirect_uri || options.redirect_uri;
    }
    this.scope = opt.scope || options.scope;
    this.state = opt.state || options.state;
  }

  Auth.prototype.connectCallback = function() {
    var popup = A2.auth.handle;
    if(!popup) {
      popup = window;
    }
    var url = new URL(popup.location.search + popup.location.hash);
    var params = url.parseParameters();
    popup.close();

    if (params.error) {
      throw Error("OAuth2 error "+params.error.error_description || params.error.error);
    } else {
      if(this.callback) {
        return this.callback(decodeURIComponent(params.access_token));
      } else {
        return connectCallbacks.success(decodeURIComponent(params.access_token));
      }
    }
    connectCallbacks.general(params.error);
  };

  Auth.prototype.connect = function(callback) {
    connectCallbacks.success = callback;
    if(!this.client_id ) {
      throw new Error("Missing client_id!");
    }
    var url = this.url = new URL(options.site+"/oauth2/authorize");
    var params = {
        client_id:this.client_id
      , response_type:this.response_type
      , display: options.display
      , scope: this.scope
    };
    if(this.redirect_uri) {
      params.redirect_uri = this.redirect_uri;
    }

    url.mergeParams(params);

    this.callback = callback;
    if(params.display === "popup" && params.response_type === "token") {
      this.handle = url.open({
          width:640
        , height: 510
      });
    } else if(!params.display || params.display !== "popup") {
      document.location.href = url.get();
     }
  };

  /**
   * connects, ie gets access token if there is none and fetches player object.
   */
  A2.connect = function(callback) {
    var token = accessToken();
    if(token != null) {
      return callback(token);
    }
    if(!auth) {
      A2.auth = new Auth({});
    }

    A2.auth.connect(function(token) {
      accessToken(token);
      return callback(token);
    });
  }

  global.A2 = A2;
  global.A2.URL = URL;
})('object' === typeof module ? module.exports : (this.A2 = {}), "undefined" === typeof global ? window : global);