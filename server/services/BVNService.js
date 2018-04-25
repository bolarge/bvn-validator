/**
 * Created by nonami on 23/04/2018.
 */
const BvnCache = require('../models/BvnCache');
const Paystack = require('./BVNProvider/Paystack');
const NIBSS  = require('./BVNProvider/NIBSS');
const cfg = require('../../config');


const getProvider = () => {
  const pList = [Paystack, NIBSS].filter((p) => p.name === cfg.activeBvnProvider);
  if (pList.length > 0) {
    return pList[0];
  }
  return NIBSS;
};

module.exports.resolve = (bvn) => {
  return BvnCache.getCachedResult({bvn})
    .then(function(result) {
      if (result) {
        return result;
      }
      return getProvider().resolve(bvn)
        .then((response) => {
          if (response) {
            BvnCache.saveResult({bvn}, response);
          }
          return response;
        });
    })
};
