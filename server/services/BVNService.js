/**
 * Created by nonami on 23/04/2018.
 */
const BvnCache = require('../models/BvnCache');
const Paystack = require('./BVNProvider/Paystack');
const NIBSS  = require('./BVNProvider/nibss');
const cfg = require('../../config');


const getProvider = () => {
  const pList = [Paystack, NIBSS].filter((p) => p.name === cfg.activeBvnProvider);
  if (pList.length > 0) {
    return pList[0];
  }
  return NIBSS;
};

const getBvnInfo = (bvn) => {
  return getProvider().resolveBvn(bvn)
    .then((response) => {
      if (response) {
        BvnCache.saveResult(response);
      }
      return response;
    })
};

module.exports.resolve = (bvn, forceReload = false) => {

  if (forceReload) {
    return getBvnInfo(bvn);
  }

  return BvnCache.getCachedResult(bvn)
    .then(function(result) {
      if (result) {
        return result;
      }
      return getBvnInfo(bvn);
    })
};
