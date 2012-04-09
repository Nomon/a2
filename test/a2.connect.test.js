
suite('A2', function() {

  /* Some browser stuff mocked here */
  var resetUrl = "http://local.host:3000/oauth/authorize?client_id=123QQ332a&test_token=Q21&next=http%3A%2F%2Fnext.url%2F%3Fwith%3Dparams#access_token=AA234caasd_ASD";
  var url = null;
  global.document = {
     location:{
        href:""
      , search:"http://127.0.0.1:3113/callback.html"
      , hash:"#access_token=kissa"
      , protocol: "http"
   }
  };

    global.screenX = 238;
    global.outerWidth = 1222;
    global.screenY = 28;
    global.outerHeight = 767;
    global.document = typeof document === "undefined" ? {} : document;
    global.document.location = typeof document.location === "undefined" ? {} : document.location;

    global.document.location.hash = "#access_token=kissa";
    global.document.location.search = "http://127.0.0.1:3113/callback.html";
    A2.initialize({width:640,height:510,client_id:"123456"});

  setup(function() {

  });


  suite('A2.Auth', function() {
    test('connect should construct an url and call open on it', function(done) {
      var opens = 0;
      var closes = 0;
      var url = null;
      global.open = function(u, setup) {
        var obj = {
          params: {
              access_token: "testTokEN"
          },
          close: function() {
            closes++;
          },
          location: {
            search: "http://call.back/asd"
            , hash: "#access_token=testTokEN"
          }
        };
        opens++;
        url = u;
        setTimeout(A2.auth.connectCallback, 1);
        delete global.open;
        return obj;
      };

      A2.connect(function() {
        assert.equal(A2.token(), "testTokEN");
        done();
      });
    });
    test('access token should be found after connection', function() {
      assert.equal(A2.token(),"testTokEN");
    })
    test('init without client_id should THROW', function() {
      assert.throws(function() {
        A2.initialize({width:640,height:510})
      },Error);
    })
    test('access token get, put, delete', function() {
      A2.token("XYZ");
      assert.equal(A2.token(),"XYZ");
      A2.token(null);
      assert.equal(A2.token(), undefined);
      A2.token("testTokEN")
      assert.equal(A2.token(),"testTokEN");
    })
  })
})


suite('A2.URL', function() {
  /* Some browser stuff mocked here */
  var resetUrl = "http://local.host:3000/oauth/authorize?client_id=123QQ332a&test_token=Q21&next=http%3A%2F%2Fnext.url%2F%3Fwith%3Dparams#access_token=AA234caasd_ASD";
  var url;

  setup(function() {
    url = new A2.URL(resetUrl);
    if(typeof window === "undefined") {
      global.document.location.href = resetUrl;
    }
  });

  suite('#parseParameter', function(){
    test('separate parameters by ? & and #', function(){
      var params = url.parseParameters();
      assert.equal(params.client_id,"123QQ332a");
      assert.equal(params.test_token,"Q21")
    });
    test('automaticly decode encoded uris', function() {
      var params = url.parseParameters();
      assert.equal(params.next,"http://next.url/?with=params");
      assert.equal(encodeURIComponent(params.next),"http%3A%2F%2Fnext.url%2F%3Fwith%3Dparams");
    });
    test('# separated params', function() {
      var params = url.parseParameters();
      assert.equal(params.access_token,"AA234caasd_ASD");
    })
  })
  suite('#mergeParameters', function() {
    test('merge paramters', function() {
      var obj = {
          num:12345
        , str:"Kissa"
        , url :"http://next.url/?with=params"
      };
      url.mergeParams(obj);
      var params = url.parseParameters();
      assert.equal(params.str,"Kissa");
      assert.equal(params.url,"http://next.url/?with=params");
      assert.equal(url.get().search(/http\:\/\/next.url\/\?with=params"/),-1);
    })
  })
  suite('#isRelative', function() {
    test('differientiate /resource and http://', function() {
      assert.equal(url.isRelative(), false);
      var url2=new A2.URL('/resource/path?next='+encodeURIComponent(url.get()));
      assert.equal(url2.isRelative(), true);
    })
  })
  suite('#navigate', function() {
    test('should set document.location.href', function() {
      url.navigate();
      assert.equal(document.location.href, url.get());
    })
  })
  suite('#secure', function() {
    test('get set modify and force', function() {
      url.secure(true);
      assert.equal(url.secure(),true);
      assert.equal(url.get().search(/^http:\/\//),-1);
      url.secure(false);
      assert.equal(url.get().search(/^https:\/\//),-1);
      assert.equal(url.secure(),false);
    })
  })
})

