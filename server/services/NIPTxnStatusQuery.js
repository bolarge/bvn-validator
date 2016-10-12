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
  debug = require('debug')('bvn'),
  rollbar = require('./rollbar.js').instance(),
  config = require('../../config/index'),
  AccountValidationCache = require('../models/AccountValidationCache'),
  Utils = require('./Utils'),
  ErrorList = require('../models/ErrorList'),
  q = require('q');



module.exports.getTxnStatus = function (data, soapClient) {

  var args = {};

  var request = {
    SessionID: data.SessionID,
    SourceInstitutionCode: config.nibss.nip.schemeCode,
    ChannelCode: config.nibss.nip.channelCode
  };

  var deferred = q.defer();

  var xmlRequest = js2Xml("TSQuerySingleRequest", request);

  if (!soapClient) {
    throw new Error('Soap client is still initializing');
  }

  debug(xmlRequest);
  console.log('Encrypting request...');
  ssm.encrypt(xmlRequest, config.nibss.nip.nibssKeyPath)
    .then(function (response) {
      args.request = response;
      console.log('Request has been encrypted');

      var timeStart = Date.now();
      console.log('Starting verify request...');
      soapClient.txnstatusquerysingleitem(args, function (err, soapResp) {
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
          })
          .catch(function (err) {
            if (typeof err !== 'string') {
              rollbar.handleError(err);
            }
            return deferred.reject(err);
          });
      });
    })
    .catch(function (err) {
      if (typeof err !== 'string') {
        rollbar.handleError(err);
      }
      return deferred.reject(err);
    });

  return deferred.promise;

};
