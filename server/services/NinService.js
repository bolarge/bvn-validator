/**
 * Created by nonami on 25/04/2018.
 */

const BvnCache = require('../models/BvnCache');
const NinCache = require('../models/NinCache');
const NIBSS = require('./BVNProvider/nibss');
const S3ImageService = require('../services/S3ImageService');

module.exports.fetchNimcData = async (nin, idType, forceReload = false) => {
  if (!forceReload) {
    const cachedNin = await NinCache.getCachedResult(nin);
    if (!!cachedNin) {

      if (cachedNin.isS3img) {
        return retrieveImageForCache(cachedNin);
      } else {
        return saveProviderImageToS3(cachedNin);
      }
    }

    if (idType === 'nin') {
      const cachedBvn = await BvnCache.findOne({nin});
      if (cachedBvn) {
        if (cachedBvn.isS3img) {
          return retrieveImageForCache(cachedBvn);
        } else {
          saveProviderImageToS3(cachedBvn);
          return cachedBvn;
        }
      }
    }

  }

  const ninData = await NIBSS.fetchNimcData(nin, idType);
  if (ninData) {
    saveProviderImageToS3(ninData);
    return ninData;
  }

  return ninData;
};


function retrieveImageForCache(result) {
  return S3ImageService.retrieveImageFromAmazon(result)
    .then((s3Response) => {
      result.img = s3Response.response;
      return result;
    }).catch((err) => {
      console.log(err);
    });
}


function saveProviderImageToS3(result) {
  return S3ImageService.saveToS3(result.img, result.idNumber, 'NIN', result)
    .then((s3Response) => {
      result.isS3img = true;
      result.img = s3Response.key;
      return NinCache.saveResult(result);
    }).catch((err) => {
      console.log(err);
    });
   
}