/**
 * Created by taiwo on 6/7/16.
 */

"use strict";

var mongoose = require('mongoose'), debug = require('debug')('db'),
  bcrypt = require('bcrypt'),
  config = require('../../config'),
  _ = require('lodash'),
  objectHash = require('object-hash'),
  q = require('q')
  ;


var storeSchema = mongoose.Schema({
  hash: {
    type: String,
    unique: true,
    required: true
  },
  request: {
    type: Object
  },
  result: {
    type: Object
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


var ResultCache = mongoose.model('ResultCache', storeSchema);

var preprocess = function (request) {
  var out = {};
  for (var i in request) {
    if (request.hasOwnProperty(i)) {
      out[i] = _.isString(request[i]) ? _.upperCase(request[i]) : request[i];
    }
  }

  return out;
};

module.exports = ResultCache;

module.exports.getCachedResult = function (request) {
  request = preprocess(request);
  var hash = objectHash(request);

  var deferred = q.defer();

  ResultCache.findOne({hash: hash}, function (err, cached) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(cached ? cached.result : null);
    }
  });

  return deferred.promise;
};


module.exports.saveResult = function (request, result) {
  request = preprocess(request);
  var hash = objectHash(request);
  var deferred = q.defer();
  var resultCaching = new ResultCache({
    hash: hash,
    request: request,
    result: result
  });

  resultCaching.save(function (err) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(resultCaching);
    }
  });

  return deferred.promise;
};


