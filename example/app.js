
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , oauth2 = require('../lib');

var app = module.exports = express.createServer();

var redisstore = new oauth2.store.RedisStore();
var server = oauth2.createServer({sign_secret:"kissa",crypt_secret:"koira"});



var authentication = new oauth2.Authentication(server,{store: redisstore});

/**
 * We need to give the authentication service the function to render our login form. We also need to handle it our self.
 */
authentication.loginForm(function(req, res) {
  res.render('login',{layout:false});
});



// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'super secret session stuff' }));
  app.use(server.router);
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', routes.index);

app.listen(3113);

/* csrf token */
app.dynamicHelpers({
  token: function (req, res) {
    return req.session._csrf;
  }
});

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
