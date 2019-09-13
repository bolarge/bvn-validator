/**
 * Created by nonami on 12/09/2019.
 */

"use strict";

const mongoose = require('mongoose'),
    connection = require('./connection'),
    debug = require('debug')('db'),
    config = require('../../config');


let storeSchema = mongoose.Schema({
    idNumber: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    sex: {
        type: String,
        required: true
    },
    stateOfIssue: {
        type: String
    },
    issueDate: {
        type: String
    },
    expiryDate: {
        type: String
    },
    dob: {
        type: String,
        required: true
    },
    img: {
        type: String
    },
    imgPath: {
        type: String
    },
    extra: {type: Object},
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

let DlCache = connection.model('DriverLicenceCache', storeSchema);


module.exports = DlCache;

module.exports.getCachedResult = function (idNumber) {
    return DlCache.findOne({idNumber})
};


module.exports.saveResult = function (result) {
    if (typeof result.toObject === 'function') {
        result = result.toObject();
    }
    delete result.__v;
    return DlCache.findOneAndUpdate({idNumber: result.idNumber}, {$set: result}, {
        upsert: true,
        setDefaultsOnInsert: true
    })
        .then((r) => {
            return r;
        })
        .catch((err) => {
            console.error(err);
        });
};
