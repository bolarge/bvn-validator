'use strict';

var http = require('http');
var path = require('path');
var express = require('express');
var Q = require("q");
var soap = require('soap');
var ssm = require("../lib/ssm");
var js2Xml = require("js2xmlparser");
var debug = require("debug")("tracker");
var parseString = require('xml2js').parseString,
  passport = require('passport'),
  config = require('../../config')
  ;

var args = {
  requestXML: '',
  organisationCode: config.nibss.organisationCode
};


function validateBVN(inputDataObject) {

  var deferred = Q.defer();

  var xmlRequest = js2Xml("ValidationRequest", inputDataObject);

  ssm.encrypt(xmlRequest, config.ssm.nibssKeyPath)
    .then(function (res) {
      args.requestXML = res;
      var options = {
        ignoredNamespaces: {
          namespaces: ['xsi'],
          override: true
        }
      };

      soap.createClient(config.nibss.wsdlUrl, options, function (err, soapClient) {

        if (err)  deferred.reject(err);

        soapClient.verifySingleBVN(args, function (err, soapResp) {

          if (err)  deferred.reject(err);
          ssm.decrypt(soapResp.ValidationResponse, config.ssm.password, config.ssm.privateKeyPath)
            .then(function (res) {
              //console.log(res);
              parseString(res, function (err, result) {
                deferred.resolve(result);
              });
            }, function (err) {
              debug(err);
            });
        });

      });
    });

  return deferred.promise;
}

module.exports = function (app) {


  app.post("/oapi/bvnValidation",
    passport.authenticate('basic', {session: false}),
    function (req, res) {

      var inputDataObject = req.body.inputDataObject;

      validateBVN(inputDataObject)
        .then(function (re) {
          res.send(re);
        }, function (err) {
          res.status(500).send(err);
        });
    });
};
