/**
 * Created by temi on 11/10/2016.
 */

"use strict";

var soap = require('soap'),
  moment = require('moment'),
  ssm = require('../lib/ssm/index'),
  js2Xml = require('js2xmlparser'),
  parseString = require('xml2js').parseString,
  request = require('request'),
  config = require('../../config/index'),
  AccountValidationCache = require('../models/AccountValidationCache'),
  Utils = require('./Utils'),
  ErrorList = require('../models/ErrorList'),
  q = require('q');



module.exports.fundTransfer = function (data, soapClient) {

  var args = {};

  var request = {
    SessionID: config.nibss.nip.schemeCode + moment().format('YYMMDDHHmmss') + Utils.randomString(12, '0123456789'),
    DestinationInstitutionCode: data.DestinationInstitutionCode,
    ChannelCode: config.nibss.nip.channelCode,
    BeneficiaryAccountName: data.BeneficiaryAccountName,
    BeneficiaryAccountNumber: data.BeneficiaryAccountNumber,
    BeneficiaryBankVerificationNumber: data.BeneficiaryBankVerificationNumber,
    OriginatorAccountName: data.OriginatorAccountName,
    OriginatorAccountNumber: data.OriginatorAccountNumber,
    OriginatorBankVerificationNumber: data.OriginatorBankVerificationNumber,
    Amount: data.Amount
  };

  var deferred = q.defer();

  var xmlRequest = js2Xml("FTSingleCreditRequest", request);

  if (!soapClient) {
    throw new Error('Soap client is still initializing');
  }

  console.log('Encrypting request...');
  ssm.encrypt(xmlRequest, config.ssm.nibssKeyPath)
    .then(function (response) {
      args.request = response;
      console.log('Request has been encrypted');

      var timeStart = Date.now();
      console.log('Starting verify request...');
      soapClient.fundtransfersingleitem_dc(args, function (err, soapResp) {
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

              deferred.resolve(result);
            });
          }, function (err) {
            debug(err);
          });
      });
    });

  return deferred.promise;

};
