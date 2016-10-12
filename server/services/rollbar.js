/**
 * Created by taiwo on 25/02/2016.
 */


//set up error reporting
var options = {
    exitOnUncaughtException: true,
    environment: (process.env.NODE_ENV || 'staging') + '-bvn-validator'
  }, rollbar = require('rollbar'),
  rollbarToken = process.env.ROLLBAR_TOKEN || '404dfd970e0e4b97bf24db346e278ab3'
  ;


if (process.env.hasOwnProperty('NODE_ENV') && process.env.NODE_ENV !== 'development') {
  rollbar.init(rollbarToken, options);
}

module.exports.instance = function () {
  return rollbar;
};

module.exports.errorHandler = function (app) {
  app.use(rollbar.errorHandler(rollbarToken, options));
};

