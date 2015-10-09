'use strict';

var http = require('http');
var path = require('path');
var express = require('express');
var Q = require("q");
var soap = require('soap');
var ssm = require("nibssSSM");
var js2xml = require("js2xmlparser");
var debug = require("debug")("tracker");
var checker = require("debug")("xml");
var config = { 
                host: "http://196.6.103.58:8080/BVNValidationBooleanMatch/bvnValidation?wsdl"
           };

var inputDataObject = {
  BVN : "33333333333",
  FirstName : "Damilola",
  LastName : "Foo",
  PhoneNumber : "08098776765",
  DateOfBirth : "29-OCT-1977"
};

var args = {
                requestXML : '',
                organisationCode : "002002"
         };

var username = "nimbss4real";
var password = "great55&&31L990";


var base = path.resolve(__dirname,"../","../") + "/node_modules/nibssSSM/keys/public.key";

var nibss =  path.resolve(__dirname,"../","../") + "/node_modules/nibssSSM/keys/nibss.key";

 var wsdlOptions = {
  attribut: 'verifySingleBVN',
  valueKey: 'http://bmatch.bvn.nibss.com/',
  xmlKey: 'verifySingleBVN'
};


/**
 * * Simply generate the keys to be used
 * */
module.exports.generateKey = function(username,password){
  var deferred = Q.defer();
  ssm.generateKey(username, password)
  .then(function(res){
    deferred.resolve(res);
  });

  return deferred.promise;
};


module.exports.validateBVN = function(inputDataObject){

  var deferred = Q.defer();

  var thexml = js2xml("ValidationRequest",inputDataObject);

  ssm.encrypt(thexml, nibss)
  .then(function(res){ args.requestXML = res; })
  .then(function(res){
    var options = {
       ignoredNamespaces: {
         namespaces: ['xsi'],
         override: true
       }
     };

    soap.createClient(config.host,options, function(err, soapClient) {

      if(err)  deferred.reject(err);

      soapClient.verifySingleBVN(args,  function(err, soapResp){

        if(err)  deferred.reject(err);

        ssm.decrypt(soapResp.ValidationResponse, password, base)
        .then(function(res){

        parseString(res, function (err, result) {
            deferred.resolve(result);
        });

        },function(err){
          debug(err);
        });

      });

    });
  });

  return deferred.promise;
};

module.exports = function(Nimbss, app, auth, database) {};
