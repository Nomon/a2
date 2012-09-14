suite('a2 Authentication', function() {
  var auth, server;
  setup(function() {
    server = new oauth2.Server();
    auth = new oauth2.Authentication(server,{login_endpoint: '/login'});
  });
  test('Users can authenticate with session', function(done) {
    var req = {session: {"user":{"username":"mock"}}};
    auth.login(req, {}, function(error, user) {
      assert.deepEqual(user, req.session.user);
      assert.equal(error, null);
      req = {user:{"username":"mock"}};
      done();

    });
  });

  test('Authentication should require session', function(done) {
    var req = {a2:{server:server}};
    // No session should 302 to login endpoint.
    var res = {
      writeHead: function(status) {
        assert.equal(status, 302);
        done();
      }
    };
    auth.login(req, res, function(error, user) {
      assert(); // should go through error.session_missing and not callback.
    });
  });
  test('Authentication should require user', function(done) {
    var req = {a2:{server:server},session:{}};
    // No session should 302 to login endpoint.
    var res = {
      writeHead: function(status) {
        assert.equal(status, 302);
      }
    };
    auth.login(req, res, function(error, user) {
      assert.isNotNull(error); // No user in session.
      assert.isNull(user);
      done();
    });
  });
});