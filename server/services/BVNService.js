/**
 * Created by nonami on 23/04/2018.
 */
const ResultCache = require('../models/ResultCache');
const Paystack = require('./BVNProvider/Paystack');
const NIBSS  = require('./BVNProvider/NIBSS');

module.exports.resolve = (bvn) => {
  return ResultCache.getCachedResult({bvn})
    .then(function(result) {
      if (result) {
        return result;
      }
      return NIBSS.resolve(bvn)
        .then((response) => {
          if (response) {
            ResultCache.saveResult({bvn}, response);
          }
          return response;
        });
    })
};


module.exports.fetchNin = (bvn) => {
  return ResultCache.getCachedResult({bvn})
    .then(function(result) {
      if (result && result.nin) {
        return result;
      }
      return NIBSS.resolve(bvn)
        .then((response) => {
          if (response) {
            ResultCache.saveResult({bvn}, response);
          }
          return response;
        });
    })
};