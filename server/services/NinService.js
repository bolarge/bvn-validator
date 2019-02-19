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
    if (cachedNin) {

      if (cachedNin.imgPath) {
        return retrieveImageForCache(cachedNin);
      } else {
        saveProviderImageToS3(cachedNin);
        return cachedNin;
      }
    }

    if (idType === 'nin') {
      const cachedBvn = await BvnCache.findOne({nin});
      if (cachedBvn) {
        if (cachedBvn.imgPath) {
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


async function retrieveImageForCache(result) {
  try {
    let s3Response = await S3ImageService.retrieveImageFromS3(result);
    if (s3Response) {
      result.img = s3Response.response;
      return result;
    }
  } catch (err) {
    console.log(err);
    return null;
  }
}

async function saveProviderImageToS3(result) {

  try {
    let s3Response = await S3ImageService.saveToS3(result.img, result.idNumber);
    if (s3Response) {
      result.imgPath = s3Response.key;
      result.img = null;
      await saveToDatabase(result);
    }
  } catch (err) {
    console.log(err);
  }
}

async function saveToDatabase(result) {
  try {
    return NinCache.saveResult(result);
  } catch (err) {
    console.log(err);
  }
}