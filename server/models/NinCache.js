/**
 * Created by nonami on 25/04/2018.
 */

"use strict";

const mongoose = require('mongoose'),
  debug = require('debug')('db'),
  config = require('../../config');


let storeSchema = mongoose.Schema({
  idNumber: {
    type: String,
    unique: true,
    required: true
  },
  idType:{
    type: String,
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
  maidenName: {
    type: String
  },
  dob: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String
  },
  gender: {
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


let NinCache = mongoose.model('NinCache', storeSchema);


module.exports = NinCache;

module.exports.getCachedResult = function (idNumber) {
  return NinCache.findOne({idNumber})
};


module.exports.saveResult = function (result) {
  return NinCache.findOneAndUpdate({idNumber: result.idNumber}, {$set: result}, {upsert: true})
    .then((r) => {
      return r;
    })
    .catch((err) => {
      console.error(err);
    });
};
