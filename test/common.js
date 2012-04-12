
global.assert = require('assert');



/**
 * The only thing we needs to mock for a2.connect browser library is html5 local storage
 */

var storage = {};

global.localStorage = {
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

/**
 * if EXPRESS_COV use instrumented for coverage
 */
if(process.env.EXPRESS_COV) {
  require('../lib-cov/browser/a2.connect.js');
  global.oauth2 = require('../lib-cov/');
  global.store = require('../lib-cov/store') ;
} else {
  require('../lib/browser/a2.connect.js');
  global.oauth2 = require('../lib/');
  global.store =  require('../lib/store');
}

