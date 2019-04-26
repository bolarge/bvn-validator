/**
 * Created by taiwo on 6/7/16.
 */

"use strict";

const mongoose = require('mongoose'),
  connection = require('./connection'),
  _ = require('lodash'),
  objectHash = require('object-hash'),
  q = require('q')
;


const storeSchema = mongoose.Schema({
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


const ResultCache = connection.model('ResultCache', storeSchema);

const preprocess = function (request) {
  const out = {};
  for (let i in request) {
    if (request.hasOwnProperty(i)) {
      out[i] = _.isString(request[i]) ? _.upperCase(request[i]) : request[i];
    }
  }

  return out;
};

module.exports = ResultCache;

module.exports.getCachedResult = function (request) {
  request = preprocess(request);
  const hash = objectHash(request);

  const deferred = q.defer();

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
  const hash = objectHash(request);
  const deferred = q.defer();
  const resultCaching = new ResultCache({
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


