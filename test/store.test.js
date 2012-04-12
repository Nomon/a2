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
  test('local storage can be namespaced', function() {
    var s1 = new store.LocalStore();
    var s2 = s1.namespace("kissa");
    var s3 = new store.LocalStore({namespace:"kissa"});
    s1.set("test",{"test":"object"});
    assert.equal(s2.get("test"), undefined);
    s2.set("test2",{"test":"object"});
    assert.deepEqual(s3.get("test2"),{"test":"object"});
    assert.equal(s1.get("test2"), null);
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
  test('redis storage can be namespaced', function(t) {
    var s1 = new store.RedisStore();
    var s2 = s1.namespace("kissa");
    var s3 = new store.RedisStore({namespace:"kissa"});
    s1.set("test",{"test":"object"}, function(err, res) {
      assert.equal(err, null);
      s2.set("test2",{"test":"object"}, function(err, res) {
        assert.equal(err, null);
        s3.get("test2", function(err, res) {
          assert.deepEqual(res,{"test":"object"});
          s1.get("test2", function(err, res) {
            assert.deepEqual(res, {});
            t();
          });
        })
      });
    });



  });
});