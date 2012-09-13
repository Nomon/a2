
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , oauth2 = require('../lib')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy;

var app = module.exports = express.createServer();

var redisstore = new oauth2.store.RedisStore();

var userStore = new oauth2.store.LocalStore({namespace:"user"});
userStore.set('example',{id:1,password: "example",username:"example"});
var clientStore = new oauth2.store.LocalStore({namespace:"clients"});
clientStore.set('1',{client_id:1,redirect_uri:['http://127.0.0.1/callback'],name: "example client"});

/**
 * the oauth2 server,
 */
var server = oauth2.createServer({sign_secret:"kissa",crypt_secret:"koira"});

server.on('load_client', function(id, callback) {
  var client = clientStore.get(id);
  if(client) {
    callback(null, client);
  } else {
    callback(new Error("client not found"));
  }
});
/**
 * authentication server
 */
var authentication = new oauth2.Authentication(server,{store: redisstore});
/**
 * We need to give the authentication service the function to render our login form. We also need to handle it our self.
 */
authentication.loginForm(function(req, res) {
  res.render('login',{layout:false});
});

var allowedScopes = {
    '': "Read your basic information"
  , "user": "Modify your information"
  , "game": "Read and modify your games"
}

var authorization = new oauth2.Authorization(server,{scopes:allowedScopes});
/**
 * We need to give the authorization service the function to render our authorize form. We also need to handle it our self.
 */
authorization.authorizeForm(function(req, res, scope) {
  res.render('authorize',{layout:false, scope:scope,a2:req.a2});
});



// Passport user&pass login simply get user from the store above and check pass.
passport.use(new LocalStrategy(
  function(username, password, done) {
    var user = userStore.get(username);
    if(user) {
      if(password === user.password) {
        console.log("logged in")
        return done(null, user);
      } else {
        return done(null, false, {message:"Invalid username or password"});
      }
    } else {
      return done(null, false, {message:"Invalid username or password"});
    }
  }
));

/* Passport session support. */
passport.serializeUser(function(user, done) {
  console.log("Serialize ",user.username);
  done(null, user.username);
});

passport.deserializeUser(function(id, done) {
  console.log("deserialize",id);
  var user = userStore.get(id);
  console.log(user);
  if(user) {
    done(null, user);
  } else {
    done(new Error("user not found"), null);
  }
});

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'super secret session stuff' }));
  app.use(express.csrf());
  app.use(passport.initialize());
  app.use(passport.session());
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

app.get('/dumpsession', function(req, res) {
  res.send(req.session)
});

/**
  * Auth stuff. login, fblogin
  */
app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true })
);

app.listen(3113);

/* csrf token */
app.dynamicHelpers({
  token: function (req, res) {
    return req.session._csrf;
  },
  username: function(req, res) {
    if(req.user) {
    return req.user.username;
    } else {
      return "";
    }
  }
});

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
