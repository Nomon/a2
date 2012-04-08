
suite('OAUTH2 Server', function() {
  test('Server can be created', function() {
    var opt = {sign_secret:"testSign",crypt_secret:"testCrypt"};
    var server = new oauth2.Server();
    console.log(server);
  });
});