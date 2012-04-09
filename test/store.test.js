var util = require('util');

suite('OAUTH2 Server Store', function() {
  test('creating a store without implementing all methods throws on use', function(t) {
    function TestStore() {

    };
    util.inherits(TestStore, store.BaseStore);
    assert.throws(function() {
      var s = new TestStore();
      s.get(1, function() {});
    });
    assert.throws(function() {
      var s = new TestStore();
      s.set(1,{}, function() {});
    });
    t();
  });
  test('local storage can be queried', function(t) {
    var s = new store.LocalStore();
    var tv = {test:"value"};
    s.set('client:1', tv , function(err, res) {
      s.get('client:1', function(err, res) {
        assert.equal(res, tv);
        t();
      });
    });
  });
  test('redis storage can be queried', function(t) {
    var s = new store.RedisStore();
    var tv = {test:"value"};
    s.set('client:1', tv , function(err, res) {
      s.get('client:1', function(err, res) {
        assert.deepEqual(res, tv);
        t();
      });
    });
  });
});