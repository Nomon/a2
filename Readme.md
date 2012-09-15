# WIP

This is work in progress and not fully functional yet.

## a2 OAuth2 suite

Complete draft-25 confirming oauth2 suite, fully tested, easily extensible, configurable, secure & scalable.

# Server usage, for more detailed example see example directory.
```
var server new a2.Server({sign_secret:"token signing secret",crypt_secret:"encryption key used"});
```
# Server events


```
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
```
<script src="/a2/a2.connect.js"></script>
<script>
  var client = a2.initialize({client_id:1,scope:"user"});
  client.connect(function(token) {
    console.log("Got access_token ",token);
  });
</script>
```

# req.a2
```
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