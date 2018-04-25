/**
 * Created by nonami on 25/04/2018.
 */

"use strict";

const mongoose = require('../services/connection').mongoose,
  debug = require('debug')('db'),
  config = require('../../config');


let storeSchema = mongoose.Schema({
  nin: {
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
  maidenName: {
    type: String
  },
  dob: {
    type: String,
    required: true
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

module.exports.getCachedResult = function (nin) {
  return NinCache.findOne({nin})
};


module.exports.saveResult = function (result) {
  return NinCache.findOneAndUpdate({nin: result.nin}, {$set: result}, {upsert: true})
    .then((r) => {
      return r;
    })
    .catch((err) => {
      console.error(err);
    });
};
