"use strict";

var path = require('path');
var java = require("java");
var debug = require("debug")('worker');
var Q = require("q");


setInterval(function () {
  debug('Waiting...');
}, 1000);
// JAVA Stuff

debug('Loading java libs');
java.classpath.push(path.resolve(__dirname, 'lib') + "/pgplib-2.5.jar");
java.classpath.push(path.resolve(__dirname, 'lib') + "/bcprov-ext-jdk14-145.jar");
java.classpath.push(path.resolve(__dirname, 'lib') + "/bcpg-jdk14-145.jar");
java.classpath.push(path.resolve(__dirname, 'lib') + "/SSecurityModule.jar");
debug('Done with loading java libs');

debug('Importing nfp.ssm.core.SSMLib package');
var SSMLib = java.import('nfp.ssm.core.SSMLib');

// Generate Key Pairs
module.exports.generateKey = function (username, password, publicKey, privateKey) {
  var deferred = Q.defer();
  debug('Generating key pairs');
  debug('Getting an instance of SSMLib');
  publicKey = publicKey || path.resolve(__dirname, 'keys') + "/public.key";
  privateKey = privateKey || path.resolve(__dirname, 'keys') + "/private.key";

  var SSMLibInstance = new SSMLib(publicKey, privateKey);

  SSMLibInstance.generateKeyPair(username, password, function (err, result) {
    if (err) {
      debug(err);
      deferred.reject(err);
    } else {
      debug('Key generation complete');
      deferred.resolve(result);
    }

  });
  return deferred.promise;
};

// Encrypt Request
module.exports.encrypt = function (data, theirPublicKey) {
  var deferred = Q.defer();
  debug('Encrypting Request');
  debug('Getting an instance of SSMLib');
  var SSMLibInstance = new SSMLib(theirPublicKey, "");

  SSMLibInstance.encryptMessage(data, function (err, result) {
    if (err) {
      debug(err);
      deferred.reject(err);
    } else {
      debug('Encryption Complete');
      deferred.resolve(result);
    }
  });
  return deferred.promise;
};

// Decrypt Request
module.exports.decrypt = function (data, password, ourPrivateKey) {
  var deferred = Q.defer();
  debug('Decrypting Request');
  debug('Getting an instance of SSMLib');
  var SSMLibInstance = new SSMLib("", ourPrivateKey);

  SSMLibInstance.decryptFile(data, password, function (err, result) {
    if (err) {
      debug(err);
      deferred.reject(err);
    } else {
      debug('Decryption Complete');
      deferred.resolve(result);
    }
  });
  return deferred.promise;
};