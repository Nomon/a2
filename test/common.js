global.oauth2 = process.env.EXPRESS_COV ? require('../lib-cov/') : require('../lib/');
global.store = process.env.EXPRESS_COV ? require('../lib-cov/store') : require('../lib/store');

global.assert = require('assert');