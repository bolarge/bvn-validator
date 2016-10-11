/**
 * Created by temi on 11/07/2016.
 */

"use strict";

var _ = require('lodash'),
  AccountValidationCache = require('../models/AccountValidationCache'),
  NIPAccountValidation = require('../services/NIPAccountValidation'),
  ErrorList = require('../models/ErrorList'),
  Utils = require('../services/Utils'),
  q = require('q');

const STATUS_SUCCESS = NIPAccountValidation.STATUS_SUCCESS;
const STATUS_RECORD_NOT_FOUND = NIPAccountValidation.STATUS_RECORD_NOT_FOUND;


var validateRequest = function (data, requiredFields) {

  var validate = Utils.validateRequest(data, requiredFields);

  if (!validate.status) {
    return validate;
  }

  if (!data.accountNumber.match(/^\d{10}$/)) {
    return {status: false, message: 'INVALID_ACCOUNT_NUMBER'};
  }

  if (!data.bvn.match(/^\d{11}$/)) {
    return {status: false, message: 'INVALID_BVN'};
  }

  if (!data.hasOwnProperty('skipCache')) {
    data.skipCache = false;
  }

  return {status: true, data: data};
};

var splitNames = function (names) {

  var nameArray = [];
  names.forEach(function (name) {
    if (name && name !== "") {
      nameArray = nameArray.concat(_.toLower(name.trim()).split(/\s+/));
    }
  });

  return nameArray;

};

var checkBvnMatch = function (requestBvn, responseBvn) {
  return _.trim(responseBvn) == _.trim(requestBvn);
};

var checkNameMatch = function (requestDetails, responseDetails) {

  var namesMatched = 0;

  var responseNames = splitNames([responseDetails.otherNames, responseDetails.surname]);
  var requestNames = splitNames([requestDetails.firstName, requestDetails.lastName]);

  for (var i = 0; i < requestNames.length; i++) {
    if (responseNames.indexOf(requestNames[i]) > -1) {
      namesMatched++;
    }
  }

  console.log("Names matched: ", namesMatched);
  return (namesMatched > 1);
};

var performAccountValidation = function (request) {

  console.log('Checking if the request is cached');
  return AccountValidationCache.getCachedResult(request)
    .then(function (result) {
      if (result) {
        console.log('Result cached, returning cached result: ', result.bvn, '-', result.accountNumber, '-', result.bankCode);

        //BVN hack
        if (_.trim(result.bvn) !== _.trim(request.bvn) && result.status !== STATUS_SUCCESS) {
          //if stored result's BVN doesn't match the request BVN
          //and the previous stored wasn't successful
          //if it were, then the new BVN is invalid and will be caught by mismatch check.
          result = null;
        } else {
          var error = result.status === STATUS_RECORD_NOT_FOUND ? 'RECORD_NOT_FOUND' : null;
          return [result, error];
        }
      }

      console.log('Calling service...');
      return NIPAccountValidation.nipAccountService(request)
        .then(function (result) {
          if (!result) {
            throw new Error('RESULT_NOT_FOUND');
          }


          if (result.status != STATUS_SUCCESS && result.status != STATUS_RECORD_NOT_FOUND) {
            throw new Error('INVALID_RESULT');
          }

          console.log('Caching returned result');
          result.bvn = request.bvn;
          AccountValidationCache.saveResult(request, result)
            .then(function () {
              console.log('Result has been saved.');
            });

          if (result.status == STATUS_RECORD_NOT_FOUND) {
            return [result, 'RECORD_NOT_FOUND'];
          }

          return [result, null];
        });
    });
};

module.exports.validateAccount = function (req, res) {
  console.log("Starting account validation...");

  var userData = req.body;
  var requiredFields = ['bvn', 'bankCode', 'accountNumber', 'firstName', 'lastName'];
  var validRequest = validateRequest(userData, requiredFields);

  if (!validRequest.status) {
    return res.status(400).json(Utils.generateResponse(false, {}, validRequest.message));
  }

  return performAccountValidation(validRequest.data)
    .spread(function (result, message) {

      if (message) {
        return res.status(200).json(Utils.generateResponse(false, {}, message));
      }

      if (!checkBvnMatch(validRequest.data.bvn, result.bvn)) {
        return res.status(200).json(Utils.generateResponse(false, result, 'BVN_MISMATCH'));
      }

      if (!checkNameMatch(validRequest.data, result)) {
        return res.status(200).json(Utils.generateResponse(false, result, 'NAME_MISMATCH'));
      }

      return res.status(200).json(Utils.generateResponse(true, result));

    })
    .catch(function (err) {
      return res.status(500).json(Utils.generateResponse(false, {}, err.message));
    });
};

