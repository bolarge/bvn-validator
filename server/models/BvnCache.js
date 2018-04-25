/**
 * Created by nonami on 25/04/2018.
 */

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
  bvn: {
    type: String,
    unique: true,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  otherNames: {
    type: String
  },
  nin: {
    type: String
  },
  dob: {
    type: String,
    required: true
  },
  registrationDate: {
    type: String
  },
  provider: {
    type: String,
    required: true
  },
  enrollmentBranch: {
    type: String
  },
  enrollmentInstitution: {
    type: String
  },
  img: {
    type: String
  },
  extra: {type: Object},
  createdAt: {
    type: Date,
    default: Date.now
  }
});


var BvnCache = mongoose.model('BvnCache', storeSchema);


module.exports = BvnCache;

module.exports.getCachedResult = function (bvn) {

  var deferred = q.defer();

  BvnCache.findOne({bvn: bvn}, function (err, cached) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(cached ? cached : null);
    }
  });

  return deferred.promise;
};


module.exports.saveResult = function (result) {
  var deferred = q.defer();
  var resultCaching = new BvnCache(result);

  resultCaching.save(function (err) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(resultCaching);
    }
  });

  return deferred.promise;
};



