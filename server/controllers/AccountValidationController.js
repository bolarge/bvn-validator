/**
 * Created by temi on 11/07/2016.
 */

"use strict";

const AccountValidationCache = require('../models/AccountValidationCache'),
  CPoSAccountValidation = require('../services/CPoSClient'),
  Utils = require('../services/Utils'),
  u_ = require('utility-belt'),
  _ = require('lodash')
;


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
  const specifiedNames = `${request.firstName} ${request.lastName}`;
  const sourceNames = `${cachedData.otherNames} ${cachedData.lastName}`;

  const {matches, totalScore} = u_.doNameMatch(specifiedNames, sourceNames);
  return matches >= 2;
};

const doBvnMatch = (request, cachedData) => {
  return request.bvn === cachedData.bvn;
};

const performAccountValidation = async function (request) {

  console.log('Checking if the request is cached');
  let data = await AccountValidationCache.getCachedResult(request);
  if (data) {
    console.log('Cached result found');
    if (!doBvnMatch(request, data)) {
      return Utils.generateResponse(false, data, 'BVN_MISMATCH');
    }

    if (!doNameMatch(request, data)) {
      return Utils.generateResponse(false, data, 'NAME_MISMATCH');
    }

    console.log('Result cached, returning cached result: ', request.accountNumber, '-', request.bankCode);
    return Utils.generateResponse(true, data, null);
  } else {
    console.log('No cached result, calling service...');
    let result = await CPoSAccountValidation.accountValidation(request);
    if (result.systemError) {
      throw new Error('Account Validation System Error!');
    }

    if (result.data && result.data.status === '00') {
      console.log('Caching result returned');
      AccountValidationCache.saveResult(request, result.data)
        .then(function (save) {
          console.log('Result has been saved.', save._id);
        });
    }

    return result;
  }
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
    .then((result) => res.status(200).json(result))
    .catch(function (err) {
      console.error(err.message);
      console.error(err.stack);
      let response = Utils.generateResponse(false, {}, err.message);
      response.systemError = true;
      return res.status(500).json(response);
    });
};

