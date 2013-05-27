# WIP

WARNING This is work in progress and is NOT secure, tested, complete work, production ready etc.

## a2 OAuth2 suite

a2 aims to be express.js compatible oauth2 draft-30 confirming authentication suite.

# Setting up the a2 server.

```javascript
var server = new a2.createServer({sign_secret:"token signing secret",
                                  crypt_secret:"encryption key used"});

```

Server options:
    token_endpoint: Set and enable token endpoint in server.router
    authorize_endpoint: Set and enable authorize endpoint in server.router
    sign_secret: The token signing secret
    crypt_secret: The token encryption key
    login_endpoint: Set and enable login endpoint redirection

## Using the Authentication / Authorization server and endpoints.

Setting up the authorize endpoint with browser client and redis storage for users & clients.

express 3.0.0+

```javascript
var store = new a2.store.RedisStore();

var userStore = store.namespace("users");
userStore.set(1,{"username":"Nomon","id":1,"password":"abc"});

var clientStore = store.namespace("clients");
clientStore.set(1, {"application_name":"Test app","id":1,"client_secret":"ABC"});

var server = new a2.createServer({sign_secret:"secret",
                                  crypt_secret:"encryption secret",
                                  authorize_endpoint: '/oauth2/authorize',
                                  login_endpoint: '/login'
                                  store: store
                                  });

var server = express();


app.configure(function () {
    app.use(server.static); // browser client
    app.use(server.router); // authorize and login route.
    app.use(app.router);
});
```


## Securing routes

Access policy can be adjusted with these options:

require_client:
Request has to have an valid client_id, default: true, sets req.a2.client.

require_token:
Request has to provide an valid access_token, sets req.a2.token.

require_authorization:
Requires an active authorization for the the client to access the users resources.

require_scopes:
Array of required scopes in the authorization to access the resource.

if both the require_token and require_client are set the provided client_id is verified against the issued token.

```javascript
var basic = new a2.middleware({ require_token:true
                              , require_client: true
                              , require_authorization: true
                              , require_scopes: ['basic'] });

var public = new a2.middleware({require_client:true});

app.get('/me', secure, function(req, res, next) {
    console.log(req.a2.client.id,"requested /me for user", req.a2.user.id," authorized by ",req.a2.token);
    res.send(req.a2.user);
});

app.get('/profile/:id', public, function(req, res, next) {
    console.log(req.a2.client.id,"requested profile", req.params.id);
    Profiles.find(req.params.id, function(error, profile) {
      if(error) {
        return next(error);
       }
       return res.send(profile);
    });
});
```

```javascript

var authentication = new oauth2.Authentication(server);
var authorization = new oauth2.Authentication(server);

authentication.loginForm(function(req, res) {
  res.render('login');
});


authorization.authorizeForm(function(req, res, scopes) {
  res.render('authorize');
});
```

# Client usage

```javascript
<script src="/a2/a2.connect.js"></script>
<script>
  var client = a2.initialize({client_id:1,scope:"user"});
  client.connect(function(token) {
    console.log("Got access_token ",token);
  });
</script>
```

# req.a2

```javascript
req.a2 = {
  user: {
    id: ''
  },
  client: {
    id: ''
  },
  token: {
      client_id: ''
    , user_id: ''
    , expires: ''
    , extra: {}
  },
  server: a2.Server
}
```

# Middlewares

a2 provides several different middlewares to be used with express.

a2.secure(options):
Secures a route (see code for options).

a2.router:
An express.js router with the configured authorization and/or token endpoint.

a2.static:
Static middleware configured for lib/browser for implicit web flow.

# Example
The example directory contains on example with facebook login, user/password login and using the identity
to access api and sharing the identity outside with oauth2.

## License

(The MIT License)

Copyright (c) 2012 Matti Savolainen &lt;matti@applifier.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
