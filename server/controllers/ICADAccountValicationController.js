/**
 * Created by temi on 11/07/2016.
 */

"use strict";

var Agent = require('socks5-https-client/lib/Agent'),
  request = require('request'),
  config = require('../../config'),
  q = require('q');

exports.STATUS_SUCCESS = "00";
exports.STATUS_RECORD_NOT_FOUND = "02";


module.exports.accountService = function (data) {

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
