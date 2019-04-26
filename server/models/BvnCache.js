/**
 * Created by nonami on 25/04/2018.
 */

"use strict";

const mongoose = require('mongoose'),
  debug = require('debug')('db'),
  connection = require('./connection'),
  config = require('../../config');


let storeSchema = mongoose.Schema({
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
  middleName: {
    type: String
  },
  phoneNumber: {
    type: String
  },
  nin: {
    type: String,
    index: true
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

let BvnCache = connection.model('BvnCache', storeSchema);


module.exports = BvnCache;

module.exports.getCachedResult = function (bvn) {
  return BvnCache.findOne({bvn: bvn})
};

module.exports.saveResult = function (result) {
  return BvnCache.findOneAndUpdate({bvn: result.bvn}, {$set: result}, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  })
    .then((r) => {
      return r;
    })
    .catch((err) => {
      console.error(err);
    });

};
