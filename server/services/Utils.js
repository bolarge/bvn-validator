/**
 * Created by temi on 10/10/2016.
 */

"use strict";

var ErrorList = require('../models/ErrorList');

module.exports = {
  randomString: function (length, chars) {
    if (!chars) {
      chars = '0123456789ABCDEFGHJKLMNOPQRSTUVWXYZ';
    }

    var result = '';

    for (var i = length; i > 0; --i) {
      result += chars[Math.round(Math.random() *
        (chars.length - 1))];
    }

    return result;
  },

  validateRequest: function (data, requiredFields) {

    for (var i = 0; i < requiredFields.length; i++) {
      if (!data.hasOwnProperty(requiredFields[i]) || !data[requiredFields[i]]) {
        return {status: false, message: 'REQUIRED FIELDS MISSING: ' + requiredFields[i]};
      }
    }

    return {status: true, data: data};
  },

  generateResponse: function (valid, data, errorCode) {

    var response = {
      valid: valid,
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
  }

};



