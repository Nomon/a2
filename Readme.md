## a2 OAuth2 suite

draft-25 confirming oauth2 server suite with browser js client for implicit flow in browsers.

# Server usage, for more detailed example see example directory.
```
var server new a2.Server({sign_secret:"token signing secret",crypt_secret:"encryption key used"});
var authentication = new oauth2.Authentication(server);
var authorization = new oauth2.Authentication(server);

authentication.loginForm(function(req, res) {
  res.render('login');
});


authorixation.authorizeForm(function(req, res, scopes) {
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