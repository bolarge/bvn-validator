/**
 * Created by temi on 11/07/2016.
 */

"use strict";

const AccountValidationCache = require('../models/AccountValidationCache'),
  CPoSAccountValidation = require('../services/CPoSClient'),
  Utils = require('../services/Utils'),
  u_ = require('utility-belt');


const validateRequest = function (data, requiredFields) {

  const validate = Utils.validateRequest(data, requiredFields);

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

const doNameMatch = (request, cachedData) => {
  const specifiedNames =  `${request.firstName} ${request.lastName}`;
  const sourceNames = `${cachedData.firstName} ${cachedData.lastName}`;

  const {matches, totalScore} = u_.doNameMatch(specifiedNames, sourceNames);
  return matches >= 2;
};

const doBvnMatch = (request, cachedData) => {
  return request.bvn === cachedData.bvn;
};

const performAccountValidation = function (request) {

  console.log('Checking if the request is cached');
  return AccountValidationCache.getCachedResult(request)
    .then(function (result) {
      if (result && doNameMatch(request, result.data) && doBvnMatch(request, result.data)) {
        console.log('Result cached, returning cached result: ', result.data.bvn, '-', result.data.accountNumber, '-', result.data.bankCode);
        return [result, null];
      }

      console.log('Calling service...');
      return CPoSAccountValidation.accountValidation(request)
        .then(function (result) {
          if (!result) {
            throw new Error('RECORD_NOT_FOUND');
          }

          if (result.systemError) {
            throw new Error('Account Validation System Error!');
          }

          if (result.valid) {
            console.log('Caching valid result');
            AccountValidationCache.saveResult(request, result)
              .then(function () {
                console.log('Result has been saved.');
              });
          }


          return [result, null];
        });
    });
};

module.exports.validateAccount = function (req, res) {
  console.log("Starting account validation...");

  const userData = req.body;
  const requiredFields = ['bvn', 'bankCode', 'accountNumber', 'firstName', 'lastName'];
  const validRequest = validateRequest(userData, requiredFields);

  if (!validRequest.status) {
    return res.status(400).json(Utils.generateResponse(false, {}, validRequest.message));
  }

  return performAccountValidation(validRequest.data)
    .spread(function (result, message) {

      if (message) {
        return res.status(200).json(Utils.generateResponse(false, {}, message));
      }

      return res.status(200).json(result);

    })
    .catch(function (err) {
      return res.status(500).json(Utils.generateResponse(false, {}, err.message));
    });
};

