/**
 * Created by taiwo on 6/7/16.
 */

var Q = require("q"),
  soap = require('soap'),
  ssm = require("../lib/ssm"),
  js2Xml = require("js2xmlparser"),
  debug = require("debug")("bvn"),
  parseString = require('xml2js').parseString,
  config = require('../../config'),
  ResultCache = require('../models/ResultCache'),
  _ = require('lodash')
  ;


function callBvnService(inputDataObject) {
  var args = {
    requestXML: '',
    organisationCode: config.nibss.organisationCode
  };


  var deferred = Q.defer();

  var xmlRequest = js2Xml("ValidationRequest", inputDataObject);

  ssm.encrypt(xmlRequest, config.ssm.nibssKeyPath)
    .then(function (res) {
      args.requestXML = res;
      var options = {
        ignoredNamespaces: {
          namespaces: ['xsi'],
          override: true
        },
        timeout: 15000
      };

      //uncomment to test locally
      // setTimeout(function () {
      //   deferred.resolve({
      //     valid: true,
      //     status: 'yes'
      //   });
      // }, 3000);
      //
      // return;

      soap.createClient(config.nibss.wsdlUrl, options, function (err, soapClient) {

        if (err) {
          return deferred.reject(err)
        }

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
    valid: resp && resp.RequestStatus == "00" && validity && validity === 'VALID',
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