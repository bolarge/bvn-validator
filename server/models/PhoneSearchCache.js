"use strict";

const mongoose = require('mongoose'),
    connection = require('./connection');


let storeSchema = mongoose.Schema({
    phoneNumber: {
        type: String,
        unique: true,
        required: true
    },
    provider: {
        type: String,
        required: true
    },
    providerMessage: {
        type: String
    },
    providerStatusCode: {
        type: String
    },
    matchedRecords: {
        type: Object
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

storeSchema.pre('update', function (next) {
    this.updatedAt = new Date();
    next();
});

let PhoneSearchCache = connection.model('PhoneSearchCache', storeSchema);


module.exports = PhoneSearchCache;

module.exports.getCachedResult = function (phoneNumber) {
    return PhoneSearchCache.findOne({phoneNumber})
};


module.exports.saveResult = function (result) {
    if (typeof result.toObject === 'function') {
        result = result.toObject();
    }
    delete result.__v;
    return PhoneSearchCache.findOneAndUpdate({phoneNumber: result.phoneNumber}, {$set: result}, {
        upsert: true,
        setDefaultsOnInsert: true
    })
        .then((r) => {
            return r;
        })
        .catch((err) => {
            console.error("PhoneSearchCache", err);
        });
};
