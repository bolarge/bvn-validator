/**
 * Created by temi on 12/07/2016.
 */

"use strict";

var mongoose = require('mongoose'),
    objectHash = require('object-hash'),
    Utils = require('../services/Utils'),
    _ = require('lodash'),
    q = require('q');


var storeSchema = mongoose.Schema({
  hash: {
    type: String,
    unique: true,
    required: true
  },
  result: {
    type: Object
  },
  bankCode: {
    type: String,
    required: true
  },
  accountNumber: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date
  }
});


var AccountValidationCache = mongoose.model('AccountValidationCache', storeSchema);

var preprocess = function (request) {

  var splitNames = Utils.splitNames([request.firstName, request.lastName]);
  var reqObj = {
    bankCode: request.bankCode,
    accountNumber: request.accountNumber,
    bvn: request.bvn,
    names: splitNames.sort().join()
  };

  var out = {};
  for (var i in reqObj) {
    if (reqObj.hasOwnProperty(i)) {
      out[i] = _.isString(reqObj[i]) ? _.upperCase(reqObj[i]) : reqObj[i];
    }
  }

  return out;
};


module.exports = AccountValidationCache;

module.exports.getCachedResult = function (request) {
  request = preprocess(request);
  var hash = objectHash(request);

  var deferred = q.defer();

  if (request.skipCache) {
    setTimeout(function () {
      deferred.resolve(null);
    }, 10);
  } else {
    AccountValidationCache.findOne({hash: hash}, function (err, cached) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(cached && cached.result ? cached.result : null);
      }
    });
  }

  return deferred.promise;
};

module.exports.saveResult = function (request, result) {

  request = preprocess(request);
  var hash = objectHash(request);

  var deferred = q.defer();

  AccountValidationCache.findOneAndUpdate({hash: hash}, {
    bankCode: request.bankCode,
    accountNumber: request.accountNumber,
    result: result,
    createdAt: Date.now()
  }, {
    upsert: true
  }, function (err, updated) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(updated);
    }
  });
  return deferred.promise;
};
