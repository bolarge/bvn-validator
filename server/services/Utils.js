/**
 * Created by temi on 10/10/2016.
 */

const ErrorList = require('../models/ErrorList'),
  _ = require('lodash'),
  u_ = require('utility-belt'),
  MIN_NAME_MATCHES = 2;

module.exports = {
  randomString: function (length, chars) {
    if (!chars) {
      chars = '0123456789ABCDEFGHJKLMNOPQRSTUVWXYZ';
    }

    let result = '';

    for (let i = length; i > 0; --i) {
      result += chars[Math.round(Math.random() *
        (chars.length - 1))];
    }

    return result;
  },

  validateRequest: function (data, requiredFields) {

    for (let i = 0; i < requiredFields.length; i++) {
      if (!data.hasOwnProperty(requiredFields[i]) || !data[requiredFields[i]]) {
        return {status: false, message: 'REQUIRED FIELDS MISSING: ' + requiredFields[i]};
      }
    }

    return {status: true, data: data};
  },

  generateResponse: function (valid, data, errorCode) {

    const response = {
      valid: valid,
      systemError: false,
      data: data,
      error: {}
    };

    if (ErrorList[errorCode]) {
      response.error.code = errorCode;
      response.error.message = ErrorList[errorCode];
    } else {
      response.error.message = errorCode;
    }

    return response;
  },

  splitNames: function (names) {
    let nameArray = [];
    names.forEach(function (name) {
      if (name && name !== "") {
        nameArray = nameArray.concat(_.toUpper(name.trim()).split(/\s+/));
      }
    });

    return nameArray;
  },

  doNameMatch: (specifiedNames, sourceNames) => {
    specifiedNames = specifiedNames.filter((a) => !!a).join(' ');
    sourceNames = sourceNames.filter((a) => !!a).join(' ');
    return u_.doNameMatch(specifiedNames, sourceNames, {
      similarityThreshold: 0.85,
      allowDuplicate: true
    }).matches >= MIN_NAME_MATCHES;
  }

};



