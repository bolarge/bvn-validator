/**
 * Created by temi on 14/12/2016.
 */

"use strict";

const request = require('request'),
    config = require('../../config/index'),
    q = require('q'),
    AUTH = {
        username: config.cpos.username,
        password: config.cpos.password
    };


module.exports.accountValidation = function (data) {

    const deferred = q.defer();
    let response = {};

    const options = {
        url: config.cpos.baseURL + '/api/nip/accountValidation',
        headers: {
            'content-type': 'application/json'
        },
        auth: AUTH,
        json: {
            "bankCode": data.bankCode,
            "accountNumber": data.accountNumber,
            "bvn": data.bvn,
            "lastName": data.lastName,
            "otherNames": data.firstName
        }
    };

    request.post(options, function (err, result) {
        if (err) {
            deferred.reject(err);
        } else {
            response = result.body;
            deferred.resolve(response);
        }
    });

    return deferred.promise;

};


module.exports.payoutImport = (payload) => {
    const deferred = q.defer();
    let response = {};

    const options = {
        url: config.cpos.baseURL + '/api/payout/import',
        auth: AUTH,
        json: payload
    };

    request.post(options, function (err, response) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve([response.statusCode, response.body]);
        }
    });

    return deferred.promise;

};
