/**
 * Created by temi on 11/07/2016.
 */

"use strict";

const AccountValidationCache = require('../models/AccountValidationCache'),
    CPoSAccountValidation = require('../services/CPoSClient'),
    Utils = require('../services/Utils'),
    u_ = require('utility-belt'),
    objectHash = require('object-hash'),
    _ = require('lodash'),
    MIN_NAME_MATCHES = 2
;

const BVNService = require("../services/BVNService");


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
    return u_.doNameMatch(specifiedNames, sourceNames).matches >= MIN_NAME_MATCHES;
};

const doBvnMatch = (request, cachedData) => {
    return request.bvn === cachedData.bvn;
};

const cacheResult = (request, data) => {
    return AccountValidationCache.saveResult(request, data)
        .then(function (save) {
            console.log(request.bankCode, '-', request.accountNumber, 'Result has been saved.', save._id);
        });
};

const performAccountValidation = async function (request, forceReload = false) {

    const tag = `${request.bankCode} - ${request.accountNumber}`;

    let data = null;
    if (!forceReload) {
        console.log(tag, 'Checking if the request is cached');
        data = await AccountValidationCache.getCachedResult(request);
    }


    if (!data) {
        console.log(tag, 'Fetching details of account from service');
        let result = await CPoSAccountValidation.accountValidation(request);
        if (result.systemError) {
            //system error, e.g bank not available
            let statusCode = result.data && result.data.status;
            throw new Error('Account Validation System Error - ' + statusCode);
        } else if (!result.data || (typeof result.data) !== 'object') {
            //highly unlikely, but nice to have
            throw new Error('Empty account data returned');
        } else if (result.data.status !== '00') {
            //definitely a validation error if account is not available
            return result;
        } else {
            //cache in background
            cacheResult(request, result.data);
            //success or name validation failed
            if (result.valid || (result.error && result.error === 'NAME_MISMATCH')) {
                return result;
            }
        }

        //now we do offline.
        data = result.data;
        console.log(tag, 'Server-side error returned :: ', result.error.code);
    } else {
        console.log(tag, 'Cached result found');
    }

    //begin offline checks
    let currentDataHash = objectHash(data);
    if (!doNameMatch(request, data)) {
        return Utils.generateResponse(false, data, 'NAME_MISMATCH');
    }

    if (data.bvn) {
        if (!doBvnMatch(request, data)) {
            return Utils.generateResponse(false, data, 'BVN_MISMATCH');
        }
    } else {
        console.log(tag, 'BVN not returned, performing resolution');
        let bvnData = await BVNService.resolve(request.bvn);
        if (!bvnData) {
            return Utils.generateResponse(false, data, 'BVN_NOT_FOUND');
        }

        if (!validateWithBvnData(bvnData, data)) {
            return Utils.generateResponse(false, data, 'BVN_MISMATCH');
        }

        data.bvn = request.bvn;
    }

    let hashAfter = objectHash(data);
    if (currentDataHash !== hashAfter) {
        console.log(tag, `Data hash has changed, caching result`);
        cacheResult(request, data);
    }

    return Utils.generateResponse(true, data, null);
};

const validateWithBvnData = (bvnData, neData) => {
    let bvnDataNames = [bvnData.firstName, bvnData.middleName, bvnData.lastName].filter((n) => !!n).join(' ');
    let bankNames = `${neData.otherNames} ${neData.lastName}`;
    return u_.doNameMatch(bankNames, bvnDataNames).matches >= MIN_NAME_MATCHES;
};

module.exports.validateAccount = function (req, res) {
    console.log("Starting account validation...");

    const userData = req.body;
    const requiredFields = ['bvn', 'bankCode', 'accountNumber', 'firstName', 'lastName'];
    const validRequest = validateRequest(userData, requiredFields);

    if (!validRequest.status) {
        return res.status(400).json(Utils.generateResponse(false, {}, validRequest.message));
    }

    return performAccountValidation(validRequest.data, req.query.forceReload === '1')
        .then((result) => res.status(200).json(result))
        .catch(function (err) {
            console.error(err.message);
            console.error(err.stack);
            let response = Utils.generateResponse(false, {}, err.message);
            response.systemError = true;
            return res.status(500).json(response);
        });
};

