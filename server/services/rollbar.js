/**
 * Created by taiwo on 25/02/2016.
 */


//set up error reporting
var options = {
    exitOnUncaughtException: true,
    environment: (process.env.NODE_ENV || 'staging')
  }, rollbar = require('rollbar'),
  rollbarToken = process.env.ROLLBAR_TOKEN || 'afe87282f45a4585a7888a07f976d2e2'
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

