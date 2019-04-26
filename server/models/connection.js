const dbConfig = require('../../config').db;

module.exports = require('../lib/connection-factory').create('Main', dbConfig);