/**
 * Created by taiwo on 6/7/16.
 */

"use strict";

var Q = require("q"),
  soap = require('soap'),
  ssm = require("../lib/ssm"),
  js2Xml = require("js2xmlparser"),
  debug = require("debug")("bvn"),
  parseString = require('xml2js').parseString,
  config = require('../../config'),
  ResultCache = require('../models/ResultCache'),
  _ = require('lodash');

const BVNService = require('../services/BVNService');

var soapClient,
  options = {
    ignoredNamespaces: {
      namespaces: ['xsi'],
      override: true
    }
  };

debug('Creating soap client...');
if (!process.env.SIMULATE_RESPONSE) {
  soap.createClient(config.nibss.wsdlUrl, options, function (err, client) {

    if (err) {
      console.error('Could not initialize Soap Client!');
      throw err;
    }
    debug('Soap client intialization completed!');
    soapClient = client;
  });
}


function callBvnService(inputDataObject) {
  var args = {
    requestXML: '',
    organisationCode: config.nibss.organisationCode
  };


  var deferred = Q.defer();

  var xmlRequest = js2Xml("ValidationRequest", inputDataObject);

  if (!soapClient) {
    throw new Error('Soap client is still initializing');
  }

  debug('Encrypting request...');
  ssm.encrypt(xmlRequest, config.ssm.nibssKeyPath)
    .then(function (res) {
      args.requestXML = res;
      debug('Request has been encrypted');

      if (process.env.SIMULATE_RESPONSE) {
        setTimeout(function () {
          var dummy = {
            ValidationResponse: {
              RequestStatus: ['00'],
              BVN: [inputDataObject.BVN],
              Validity: [Math.floor(Math.random() * 3000) % 2 ? 'INVALID' : 'VALID']
            }
          };

          deferred.resolve(dummy);
        }, 3000);

        return;
      }

      var timeStart = Date.now();
      debug('Starting verify request...');
      soapClient.verifySingleBVN(args, function (err, soapResp) {
        debug('Verify request completed after:' + (Date.now() - timeStart) + "ms");

        if (err) {
          return deferred.reject(err);
        }

        if (!soapResp) {
          return deferred.reject(new Error("Empty response returned from Validation request."));
        }

        debug('Decrypting response');
        ssm.decrypt(soapResp.ValidationResponse, config.ssm.password, config.ssm.privateKeyPath)
          .then(function (res) {
            debug('Response decrypted successfully. Parsing...');
            //console.log(res);
            parseString(res, function (err, result) {
              deferred.resolve(result);
            });
          }, function (err) {
            debug(err);
          });
      });
    });

  return deferred.promise;
}


var performBvnMatch = function (request) {
  debug('Checking if the request is cached');
  return ResultCache.getCachedResult(request)
    .then(function (result) {
      if (result) {
        debug('Result cached, returning cached result: ', result);
        return result;
      }

      debug('No cached result, calling BVN service');

      return callBvnService(request)
        .then(function (result) {
          if (!result) {
            throw new Error("No valid result returned.");
          }

          if (!result.ValidationResponse || !result.ValidationResponse.RequestStatus || !["00", "01"].includes(result.ValidationResponse.RequestStatus[0])) {
            throw new Error("BVN Result is not valid: " + JSON.stringify(result));
          }

          debug('Caching returned result');
          ResultCache.saveResult(request, result)
            .then(function () {
              debug('Result has been cached.');
            });
          return result;
        });
    });

};


var validateRequest = function (request) {
  if (!request.BVN) {
    return "BVN is missing";
  }

  if (!request.FirstName
    && !request.LastName
    && !request.DateOfBirth
    && !request.PhoneNumber) {
    return "At least one of LastName, FirstName, DateOfBirth, or PhoneNumber must be specified";
  }

  return true;
};


var parseResult = function (res) {
  var resp = res.ValidationResponse,
    validity = resp && Array.isArray(resp.Validity) && resp.Validity.length > 0 ? resp.Validity[0] : null;

  var reason = "BVN ";
  reason += (validity || " check failed");

  return {
    valid: resp && Array.isArray(resp.RequestStatus)
      && resp.RequestStatus[0] === "00"
      && validity === 'VALID',
    reason: reason
  };
};

module.exports.validate = function (req, res) {

  var inputDataObject = req.body.inputDataObject || {};
  var validate = validateRequest(inputDataObject);
  if (validate !== true) {
    return res.status(400)
      .json({
        "error": validate
      })
  }

  performBvnMatch(inputDataObject)
    .then(function (re) {
      res.send(re);
    }, function (err) {
      res.status(500)
        .send(err);
    });
};


module.exports.validateBoolean = function (req, res) {
  var input = _.merge({}, req.query, req.body || {});

  var validate = validateRequest(input);

  if (validate !== true) {
    return res.status(400)
      .json({
        "error": validate
      })
  }

  performBvnMatch(input)
    .then(function (result) {
      res.json(parseResult(result))
    }, function (err) {
      res.status(500)
        .send(err);
    });

};


module.exports.resolveBvn = function (req, res) {
  if (!req.params.bvn) {
    return res.status(400).send("No BVN to resolve.");
  }
  const forceReload = req.query.forceReload === '1';
  BVNService.resolve(req.params.bvn, forceReload)
    .then(function(result) {
      if (!result) {
        return res.status(404).json({message: "BVN not found"})
      }
      res.json(result)
    })
    .catch(function(err) {
      res.status(500).json(err);
    })

};