/**
 * Created by temi on 12/07/2016.
 */

"use strict";

const mongoose = require('mongoose'),
  objectHash = require('object-hash'),
  Utils = require('../services/Utils'),
  _ = require('lodash'),
  q = require('q'),
  u_ = require('utility-belt');


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


const AccountValidationCache = mongoose.model('AccountValidationCache', storeSchema);

const preprocess = function (request) {

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

const doNameMatch = (request, cachedData) => {
  const specifiedNames = request.names;
  const sourceNames = `${cachedData.firstName} ${cachedData.lastName}`;

  const {matches, totalScore} = u_.doNameMatch(specifiedNames, sourceNames);
  return matches >= 2;
};

const getRequestHash = (request) => {
  return objectHash(_.pick(request, ['accountNumber', 'bankCode']));
};

module.exports = AccountValidationCache;

module.exports.getCachedResult = function (request) {
  request = preprocess(request);
  const hash = getRequestHash(request);

  const deferred = q.defer();

  if (request.skipCache) {
    setTimeout(function () {
      deferred.resolve(null);
    }, 10);
  } else {
    AccountValidationCache.findOne({hash: hash}, function (err, cached) {
      if (err) {
        deferred.reject(err);
      } else {
        if (cached && cached.result && cached.result.data && doNameMatch(request, cached.result.data)) {
          deferred.resolve(cached.result);
        } else {
          deferred.resolve(null);
        }
      }
    });
  }

  return deferred.promise;
};

module.exports.saveResult = function (request, result) {

  request = preprocess(request);
  const hash = getRequestHash(request);

  const deferred = q.defer();

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
