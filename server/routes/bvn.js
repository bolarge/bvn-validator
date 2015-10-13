'use strict';

var http = require('http');
var path = require('path');
var express = require('express');
var Q = require("q");
var soap = require('soap');
var ssm = require("nibssSSM");
var js2xml = require("js2xmlparser");
var debug = require("debug")("tracker");
var parseString = require('xml2js').parseString;
var checker = require("debug")("xml");


var config = { 
     /*           host: "http://196.6.103.58:8080/BVNValidationBooleanMatch/bvnValidation?wsdl"
 */
host : "http://196.6.103.100/BVNValidationBooleanMatch/bvnValidation?wsdl"
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
 function generateKey(username,password){
  var deferred = Q.defer();
  ssm.generateKey(username,password)
  .then(function(res){
    deferred.resolve(res);
  });

  return deferred.promise;
}


 function validateBVN(inputDataObject){

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
      
        //console.log(res);    
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
}

module.exports = function(Nimbss, app, auth, database, passport) {
  

   app.post("/oapi/bvnValidation", 
    passport.authenticate('basic', { session: false }),
    function(req, res, next){
      
      inputDataObject = req.body.inputDataObject;

      validateBVN(inputDataObject)
       .then(function(re){ res.send(re);});

   });


    app.post("/oapi/generateKeys", 
      passport.authenticate('basic', { session: false }),
      function(req, res, next){
                                   
      password = req.body.password;

      generateKey(req.body.username, req.body.password)
           .then(function(re){ res.send(re);});

   });
};
