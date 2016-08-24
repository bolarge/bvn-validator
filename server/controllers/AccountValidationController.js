/**
 * Created by temi on 11/07/2016.
 */

"use strict";

var Agent = require("socks5-https-client/lib/Agent"),
  request = require('request'),
  config = require('../../config'),
  _ = require('lodash'),
  AccountValidationCache = require('../models/AccountValidationCache'),
  ErrorList = require('../models/ErrorList'),
  q = require('q');

const STATUS_SUCCESS = "00";
const STATUS_RECORD_NOT_FOUND = "02";


var validateRequest = function (data, requiredFields) {

  for (var i = 0; i < requiredFields.length; i++) {
    if (!data.hasOwnProperty(requiredFields[i]) || !data[requiredFields[i]]) {
      return {status: false, message: 'REQUIRED FIELDS MISSING: ' + requiredFields[i]};
    }
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

var generateResponse = function (valid, data, errorCode) {

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
};

var performAccountValidation = function (request) {

  console.log('Checking if the request is cached');
  return AccountValidationCache.getCachedResult(request)
    .then(function (result) {
      if (result) {
        console.log('Result cached, returning cached result: ', result.bvn, '-', result.accountNumber, '-', result.bankCode);

        //BVN hack
        if (_.trim(result.bvn) !== _.trim(request.bvn) && result.status !== '00') {
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
      return accountService(request)
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

var accountService = function (data) {

  var deferred = q.defer();
  var response = {};

  var options = {
    url: config.account.accountValidationURL,
    headers: {
      'content-type': 'application/json',
      'Accept': 'application/json',
      'apiKey': config.account.apiKey
    },
    body: [
      {
        "bankCode": data.bankCode,
        "accountNumber": data.accountNumber,
        "bvn": data.bvn
      }
    ],
    json: true,
    timeout: config.account.accountValidationTimeout,
    strictSSL: false
  };

  if (process.env.SOCKS_PORT) {
    console.log("Adding SOCKS5 parameters...");
    options.agentClass = Agent;
    options.agentOptions = {
      socksHost: 'localhost',
      socksPort: config.account.socksPort
    };
  }

  request.post(options, function (err, result) {
    if (err) {
      deferred.reject(err);
    } else {
      response = result.body[0];
      deferred.resolve(response);
    }
  });

  return deferred.promise;

};


module.exports.validateAccount = function (req, res) {
  console.log("Starting account validation...");

  var userData = req.body;
  var requiredFields = ['bvn', 'bankCode', 'accountNumber', 'firstName', 'lastName'];
  var validRequest = validateRequest(userData, requiredFields);

  if (!validRequest.status) {
    return res.status(400).json(generateResponse(false, {}, validRequest.message));
  }

  return performAccountValidation(validRequest.data)
    .spread(function (result, message) {

      if (message) {
        return res.status(200).json(generateResponse(false, {}, message));
      }

      if (!checkBvnMatch(validRequest.data.bvn, result.bvn)) {
        return res.status(200).json(generateResponse(false, result, 'BVN_MISMATCH'));
      }

      if (!checkNameMatch(validRequest.data, result)) {
        return res.status(200).json(generateResponse(false, result, 'NAME_MISMATCH'));
      }

      return res.status(200).json(generateResponse(true, result));

    })
    .catch(function (err) {
      return res.status(500).json(generateResponse(false, {}, err.message));
    })
    ;

};
