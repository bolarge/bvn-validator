/**
 * Created by temi on 11/07/2016.
 */

"use strict";

var Agent = require("socks5-https-client/lib/Agent"),
    request = require('request'),
    config =  require('../../config'),
    _ = require('lodash'),
    AccountValidationCache = require('../models/AccountValidationCache'),
    ErrorList = require('../models/ErrorList'),
    q = require('q');


var validateRequest = function (data, requiredFields) {

    for (var i = 0; i < requiredFields.length; i++) {
        if (!data.hasOwnProperty(requiredFields[i]) || !data[requiredFields[i]]) {
            return {status : false, message: ErrorList.MISSING_FIELDS};
        }
    }

    if (!data.accountNumber.match(/^\d{10}$/)) {
        return {status: false, message: ErrorList.INVALID_ACCOUNT_NUMBER};
    }

    if (!data.bvn.match(/^\d{11}$/)) {
        return {status: false, message: ErrorList.INVALID_BVN};
    }

    return {status: true};
};

var splitNames = function (names) {

    var nameArray = [];
    if (names.length == 1) {
        nameArray = _.toLower(names[0]).split(' ');
    } else if (names.length > 1) {
        for (var i = 0; i < names.length; i++) {
            var splitNames = _.toLower(names[i]).split(' ');
            nameArray = nameArray.concat(splitNames);
        }
    }

    return nameArray;
};

var checkBvnMatch = function (requestBvn, responseBvn) {
    if (responseBvn != requestBvn) {
        return false;
    }
    return true;
};

var checkNameMatch = function (requestDetails, responseDetails) {

    var namesMatched = 0;

    var responseNames = splitNames([responseDetails.otherNames, responseDetails.surname]);
    var requestNames = splitNames([requestDetails.firstName, requestDetails.lastName]);

    for (var i = 0; i < requestNames.length; i++) {
        if (responseNames.includes(requestNames[i])) {
            namesMatched++;
        }
    }

    console.log("Names matched: ", namesMatched);
    return (namesMatched > 1);
};

var generateResponse = function (valid, data, errorMessage) {

    var response = {
        valid: valid,
        data: data,
        error: {
            message: errorMessage
        }
    }

    return response;
};

var performAccountValidation = function (request) {
    console.log('Checking if the request is cached');
    return AccountValidationCache.getCachedResult(request)
        .then(function (result) {
            if (result) {
                console.log('Result cached, returning cached result: ', result);
                return result;
            }

            console.log('No cached result, calling service');

            return accountService(request)
                .then(function (result) {
                    if (!result) {
                        throw new Error(ErrorList.RESULT_NOT_FOUND);
                    }

                    if (result.status != "00") {
                        throw new Error(ErrorList.INVALID_RESULT);
                    }
                    console.log('Caching returned result');
                    AccountValidationCache.saveResult(request, result)
                        .then(function () {
                            console.log('Result has been cached.');
                        });
                    return result;
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
                "accountNumber": data.accountNumber
            }
        ],
        json: true,
        timeout: config.account.accountValidationTimeout,
        strictSSL: false
    };

    if (process.env.USE_SOCKS5) {
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
        res.status(400).json(generateResponse(false, {}, validRequest.message));
    }

    return performAccountValidation(userData)
        .then(function (result) {

            var bvnMatches = checkBvnMatch(userData.bvn, result.bvn);
            if(!bvnMatches) {
                res.status(400).json(generateResponse(false, result, ErrorList.BVN_MISMATCH));
            }

            var nameMatch = checkNameMatch(userData, result);
            if(!nameMatch) {
                res.status(400).json(generateResponse(false, result, ErrorList.NAME_MISMATCH));
            }

            res.status(200).json(generateResponse(true, result));

        }, function (err) {
            res.status(500).json(generateResponse(false, {}, err.message));
        });

};