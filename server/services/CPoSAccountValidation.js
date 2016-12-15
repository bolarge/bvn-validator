/**
 * Created by temi on 14/12/2016.
 */

"use strict";

var request = require('request'),
    config = require('../../config/index'),
    q = require('q');


module.exports.accountValidation = function (data) {

  var deferred = q.defer();
  var response = {};

  var options = {
    url: config.cpos.baseURL + '/api/nip/accountValidation',
    headers: {
      'content-type': 'application/json'
    },
    auth: {
      username: config.cpos.username,
      password: config.cpos.password
    },
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
