/**
 * Created by temi on 12/07/2016.
 */

"use strict";

var mongoose = require('mongoose'),
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
        type: Date
    }
});

storeSchema.index({bankCode: 1, accountNumber: 1}, {unique: true});


var AccountValidationCache = mongoose.model('AccountValidationCache', storeSchema);


module.exports = AccountValidationCache;

module.exports.getCachedResult = function (request) {
    var deferred = q.defer();

    if (!request.useCache) {
        deferred.resolve(null);
    }

    AccountValidationCache.findOne({
        bankCode: request.bankCode,
        accountNumber: request.accountNumber
    }, function (err, cached) {
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

    AccountValidationCache.findOneAndUpdate({bankCode: request.bankCode, accountNumber: request.accountNumber
    }, {result: result, createdAt: Date.now()}, {upsert: true}, function (err, updated) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(updated);
        }
    });
    return deferred.promise;
};

