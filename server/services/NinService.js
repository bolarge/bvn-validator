/**
 * Created by nonami on 25/04/2018.
 */

const BvnCache = require('../models/BvnCache');
const NinCache = require('../models/NinCache');
const NIBSS = require('./BVNProvider/nibss');

module.exports.fetchNimcData = async (nin, idType, forceReload = false) => {
  if (!forceReload) {
    const cachedNin = await NinCache.getCachedResult(nin);
    if (!!cachedNin) {

      if (cachedNin.isS3img) {
        return retrieveImageForCache(cachedNin);
      } else {
        return processImageFromProvider(cachedNin);
      }
    }

    if (idType === 'nin') {
      const cachedBvn = await BvnCache.findOne({nin});
      if (!!cachedBvn) {

        if (cachedBvn.isS3img) {
          return retrieveImageForCache(cachedBvn);
        } else {
          return processImageFromProvider(cachedBvn);
        }

      }
    }

  }

  const ninData = await NIBSS.fetchNimcData(nin, idType);
  if (!!ninData) {
    processImageFromProvider(ninData);
  }

  return ninData;
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
  ClientImageService.validateImage(result.img, result.idNumber, 'NIN', result)
    .then((s3Response) => {
      result.isS3img = true;
      result.img = s3Response.key;
      return NinCache.saveResult(result);
    }).catch((err) => {
      console.log(err);
    });
  return result;
}