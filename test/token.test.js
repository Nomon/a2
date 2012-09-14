suite('a2 token service', function() {
  var server, service, storage;
  setup(function() {
    server = new oauth2.Server({crypt_secret: "asd", sign_secret:"asd"});
  });
  test('Token service can create, find and decrypt tokens', function(done) {
    var userId = 1;
    var clientId = 1;
    var extra = {extra:'data'};
    var expires = Date.now();
    server.tokenService.createOrFind(userId, clientId, extra, function(error, token) {
      assert.isNull(error);
      assert.isString(token);
      server.tokenService.createOrFind(userId, clientId, extra, function(error, token2) {
        assert.equal(token, token2);
        server.tokenService.load(token, function(err, data) {
          assert.isNull(err);
          assert.equal(data.client_id, clientId);
          assert.equal(data.user_id, userId);
          assert.deepEqual(extra, data.extra);
          done();
        });
      })
    });
  });

});