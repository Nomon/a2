suite('OAUTH2 Server query parameter verifier', function() {
  test('only code and token response_type allowed', function() {
    assert(oauth2.verify.responseType("code"));
    assert(oauth2.verify.responseType("token"));
    assert(!oauth2.verify.responseType("kekkonen"));
  });
  test('redirect_uri must match', function() {
    var client = {
      redirect_uri: ["http://kissa.com/oauth/callback","http://kissa.com/oauth2/callback"]
    };
    var redirect_uri = "http://kissa.com/oauth/callback";
    assert(oauth2.verify.redirectUri(client,redirect_uri));
    assert(oauth2.verify.redirectUri(client));
    redirect_uri = "http://nonexisting.com/";
    assert(!oauth2.verify.redirectUri(client, redirect_uri));
    redirect_uri = "http://kissa.com/oauth2/callback";
    assert(oauth2.verify.redirectUri(client, redirect_uri));
    client.redirect_uri = "http://kissa.com/oauth2/callback";
    assert(oauth2.verify.redirectUri(client, redirect_uri));
  });
});