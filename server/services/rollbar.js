/**
 * Created by taiwo on 25/02/2016.
 */


//set up error reporting
const Rollbar = require('rollbar'),
  accessToken = process.env.ROLLBAR_TOKEN || 'afe87282f45a4585a7888a07f976d2e2';


let rollbar = new Rollbar({accessToken,
    captureUncaught: true,
    captureUnhandledRejections: true,
    environment: process.env.NODE_ENV || 'staging'});

module.exports.instance = function () {
  return rollbar;
};

module.exports.errorHandler = function (app) {
  app.use(rollbar.errorHandler());
};

global.Rollbar = module.exports;