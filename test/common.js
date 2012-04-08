oauth2 = process.env.EXPRESS_COV ? require('../lib-cov/') : require('../lib/');
store = process.env.EXPRESS_COV ? require('../lib-cov/store') : require('../lib/store');
assert = require('assert');