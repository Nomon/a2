global.oauth2 = process.env.EXPRESS_COV ? require('../lib-cov/') : require('../lib/');
global.store = process.env.EXPRESS_COV ? require('../lib-cov/store') : require('../lib/store');
global.assert = require('assert');



/**
 * The only thing we needs to mock for a2.connect browser library is html5 local storage
 */

var storage = {}
localStorage = {
    setItem: function(item, value) {
      storage[item] = value;
    },
    getItem: function(name) {
      return storage[name];
    },
    removeItem: function(name) {
      delete storage[name];
    }
};

process.env.EXPRESS_COV ? require('../lib-cov/browser/a2.connect.js') : require('../lib/browser/a2.connect.js');