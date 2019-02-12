/**
 * Created by nonami on 23/04/2018.
 */
const BvnCache = require('../models/BvnCache');
const Paystack = require('./BVNProvider/Paystack');
const NIBSS  = require('./BVNProvider/nibss');
const cfg = require('../../config');
const ClientImageService = require('../services/ClientImageService');



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
        processImageFromProvider(response);
        
      }
      return response;
    })
};

module.exports.resolve = (bvn, forceReload = false) => {

  if (forceReload) {
    return getBvnInfo(bvn);
  }

    return BvnCache.getCachedResult(bvn)
    .then(function (result) {
      if(result!='undefined'){

        if (result.isS3img) {
          return retrieveImageForCache(result);
        } else {
          return processImageFromProvider(result);
        }
      }else
      {
        return getBvnInfo(bvn);
      }

  }).catch((err) =>{
    console.log(err);

});
};


function retrieveImageForCache(result) {
  return ClientImageService.retrieveImageFromAmazon(result)
    .then((s3Response) => {
      result.img = s3Response.response;
      return result;
    }).catch((err) => {
      console.log(err);
    });
}

function processImageFromProvider(result) {
  ClientImageService.validateImage(result.img, result.bvn, 'BVN', result)
    .then((s3Response) => {
      result.isS3img = true;
      result.img = s3Response.key;
      return BvnCache.saveResult(result);
    }).catch((err) => {
      console.log(err);
    });
  return result;
}

