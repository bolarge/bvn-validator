/**
 * Created by temi on 11/07/2016.
 */

"use strict";

var Agent = require('socks5-https-client/lib/Agent'),
  soap = require('soap'),
  moment = require('moment'),
  ssm = require('../lib/ssm'),
  js2Xml = require('js2xmlparser'),
  parseString = require('xml2js').parseString,
  request = require('request'),
  config = require('../../config'),
  _ = require('lodash'),
  AccountValidationCache = require('../models/AccountValidationCache'),
  AccountController = require('../controllers/AccountValidationController'),
  ErrorList = require('../models/ErrorList'),
  q = require('q');

exports.STATUS_SUCCESS = "00";
exports.STATUS_RECORD_NOT_FOUND = "25";

var soapClient;

debug('Creating NIP Account Validation soap client...');
if (!process.env.ICAD_VALIDATION) {
  soap.createClient(config.nibss.nip.wsdl, {
    ignoredNamespaces: {
      namespaces: [],
      override: true
    }
  }, function (err, client) {

    if (err) {
      console.error('Could not initialize Soap Client!');
      throw err;
    }
    console.log('Soap client intialization completed!');
    soapClient = client;
  })
};



module.exports.nipAccountService = function (data) {

  var args = {};

  var request = {
    SessionID: config.nibss.nip.schemeCode + moment().format('YYMMDDHHmmss') + AccountController.randomString(12, '0123456789'),
    DestinationInstitutionCode: data.bankCode,
    ChannelCode: config.nibss.nip.channelCode,
    AccountNumber: data.accountNumber
  };

  var deferred = q.defer();

  var xmlRequest = js2Xml("NESingleRequest", request);

  if (!soapClient) {
    throw new Error('Soap client is still initializing');
  }

  console.log(xmlRequest);

  console.log('Encrypting request...');
  ssm.encrypt(xmlRequest, config.ssm.nibssKeyPath)
    .then(function (response) {
      debug(response);
      args.request = response;
      console.log('Request has been encrypted');

      var timeStart = Date.now();
      console.log('Starting verify request...');
      soapClient.nameenquirysingleitem(args, function (err, soapResp) {
        console.log('Verify request completed after:' + (Date.now() - timeStart) + "ms");

        if (err) {
          return deferred.reject(err);
        }

        if (!soapResp) {
          return deferred.reject(new Error("Empty response returned from Validation request."));
        }

        console.log('Decrypting response');
        ssm.decrypt(soapResp.return, config.nibss.nip.password, config.nibss.nip.privateKeyPath)
          .then(function (res) {
            console.log('Response decrypted successfully. Parsing...');

            parseString(res, function (err, result) {

              var response = result.NESingleResponse;
              var obj = {
                bankCode: response.DestinationInstitutionCode[0],
                bvn: response.BankVerificationNumber[0],
                surname: "",
                otherNames: response.AccountName[0],
                accountNumber: response.AccountNumber[0],
                status: response.ResponseCode[0]
              };

              deferred.resolve(obj);
            });
          }, function (err) {
            debug(err);
          });
      });
    });

  return deferred.promise;

};
