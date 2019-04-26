/**
 * Created by taiwo on 02/09/2016.
 */


const mongoose = require('mongoose'),
  dbConfig = require('../../config').db,
  Rollbar = require('../services/rollbar'),
  LOGGER = require('log4js').getLogger('db-factory');



mongoose.Promise = require('bluebird');

module.exports.create = function (name, config) {
  if (!config && !dbConfig.hasOwnProperty(name)) {
    throw new Error(`Database [${name}] connection configuration is missing`);
  }

  config = config || dbConfig[name];

  const connection = mongoose.createConnection(config.url, config.options || {});

  let hasConnected = false, isOnline = false;

  connection.on('error', function (err) {
    LOGGER.error('Connection could not be established, error: ', err);
    Rollbar.instance().handleError(err);
    if (!hasConnected) {
      LOGGER.error('Could not connect to DB, exiting.');
      process.exit(1);
    }
  });

  connection.on('connecting', function () {
    LOGGER.info(`DB (${name}) attempting to connect...`);
  });

  connection.on('reconnected', function () {
    isOnline = true;
    LOGGER.warn(`DB (${name}) connection has been re-established.`);
  });

  connection.on('disconnected', function () {
    isOnline = false;
    LOGGER.error(`DB (${name}) connection was lost.`);
  });

  connection.on('open', function () {
    LOGGER.info(`DB (${name}) connection has been established.`);
    isOnline = hasConnected = true;
  });

  connection.isOnline = function () {
    return isOnline;
  };

  return connection;
};