/**
 * Created by temi on 12/07/2016.
 */

"use strict";

var mongoose = require('mongoose'),
    _ = require('lodash'),
    objectHash = require('object-hash'),
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
        type: String
    },
    accountNumber: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});


var AccountValidationCache = mongoose.model('AccountValidationCache', storeSchema);

var preprocess = function (request) {
    var out = {};
    for (var i in request) {
        if (i == 'bankCode' || i == 'accountNumber') {
            out[i] = _.isString(request[i]) ? _.upperCase(request[i]) : request[i];
        }
    }

    return out;
};

module.exports = AccountValidationCache;

module.exports.getCachedResult = function (request) {
    request = preprocess(request);
    var hash = objectHash(request);

    var deferred = q.defer();

    AccountValidationCache.findOne({hash: hash}, function (err, cached) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(cached ? cached.result : null);
        }
    });

    return deferred.promise;
};


module.exports.saveResult = function (request, result) {
    var processedRequest = preprocess(request);
    var hash = objectHash(processedRequest);
    var deferred = q.defer();
    var resultCaching = new AccountValidationCache({
        hash: hash,
        bankCode: request.bankCode,
        accountNumber: request.accountNumber,
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


