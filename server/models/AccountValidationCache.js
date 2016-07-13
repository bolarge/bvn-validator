/**
 * Created by temi on 12/07/2016.
 */

"use strict";

var mongoose = require('mongoose'),
    _ = require('lodash'),
    q = require('q');


var storeSchema = mongoose.Schema({
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
        type: Date,
        default: Date.now
    }
});

storeSchema.index({bankCode: 1, accountNumber: 1}, {unique: true});


var AccountValidationCache = mongoose.model('AccountValidationCache', storeSchema);


module.exports = AccountValidationCache;

module.exports.getCachedResult = function (request) {
    var deferred = q.defer();

    AccountValidationCache.findOne({bankCode: request.bankCode, accountNumber: request.accountNumber}, function (err, cached) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(cached ? cached.result : null);
        }
    });

    return deferred.promise;
};


module.exports.saveResult = function (request, result) {
    var deferred = q.defer();
    var resultCaching = new AccountValidationCache({
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


