/**
 * Created by temi on 11/10/2016.
 */

"use strict";

var soap = require('soap'),
  moment = require('moment'),
  request = require('request'),
  config = require('../../config/index'),
  TxnStatusQuery = require('../services/NIPTxnStatusQuery'),
  FundTransfer = require('../services/NIPFundTransfer'),
  Utils = require('../services/Utils'),
  q = require('q');

var soapClient;

if (process.env.TXN_QUERY === 'true') {
  console.log('Creating soap client for NIP services...');
  soap.createClient(config.nibss.nip.wsdl, {
    ignoredNamespaces: {
      namespaces: [],
      override: true
    }
  }, function (err, client) {

    if (err) {
      console.error('Could not initialize Soap Client for NIP services!');
      throw err;
    }
    console.log('Soap client for NIP services intialization completed!');
    soapClient = client;
  })
}


module.exports.transferStatus = function (req, res) {

  console.log("Starting transaction status query...");

  var txnData = req.body;
  var requiredFields = ['SourceInstitutionCode'];
  var validRequest = Utils.validateRequest(txnData, requiredFields);

  if (!validRequest.status) {
    return res.status(400).json(Utils.generateResponse(false, {}, validRequest.message));
  }

  return TxnStatusQuery.getTxnStatus(req.body, soapClient)
    .then(function (result) {
      if (!result) {
        return res.status(400).json(Utils.generateResponse(false, {}, 'No response received!'));
      }
      return res.status(200).json(Utils.generateResponse(true, result));
    })
};


module.exports.fundTransfer = function (req, res) {

  console.log("Starting fund status request...");

  var transfer = req.body;
  var requiredFields = ['BeneficiaryAccountName', 'BeneficiaryAccountNumber', 'BeneficiaryBankVerificationNumber', 'OriginatorAccountName',
                        'OriginatorAccountNumber', 'OriginatorBankVerificationNumber', 'Amount'];
  var validRequest = Utils.validateRequest(transfer, requiredFields);

  if (!validRequest.status) {
    return res.status(400).json(Utils.generateResponse(false, {}, validRequest.message));
  }

  return FundTransfer.fundTransfer(req.body, soapClient)
    .then(function (result) {
      if (!result) {
        return res.status(400).json(Utils.generateResponse(false, {}, 'No response received!'));
      }
      return res.status(200).json(Utils.generateResponse(true, result));
    })
};

