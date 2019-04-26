/**
 * Created by nonami on 25/04/2018.
 */

const BvnCache = require('../models/BvnCache');
const NinCache = require('../models/NinCache');
const NIBSS = require('./BVNProvider/nibss');
const S3ImageService = require('../services/S3ImageService');
const LockService = require('../services/LockService');
const NIMC_SEARCH_LOCK_TIMEOUT = 45000;

module.exports.fetchNimcData = async (nin, idType, forceReload = false) => {
  let lock, lockKey = `nimc-${idType}-${nin}`;

  try {
    console.log('Lock acquired:', lockKey);
    lock = await LockService.acquireLock(lockKey, NIMC_SEARCH_LOCK_TIMEOUT, NIMC_SEARCH_LOCK_TIMEOUT);

    if (!forceReload) {
      const cachedNin = await NinCache.getCachedResult(nin);
      if (cachedNin) {
        if (cachedNin.imgPath) {
          return retrieveImageForCache(cachedNin);
        } else {
          //no need to wait, we're only updating legacy record.
          saveProviderImageToS3(cachedNin, true).then(() => console.log('...Saved to S3'));
          return cachedNin;
        }
      }

      if (idType === 'nin') {
        const cachedBvn = await BvnCache.findOne({nin});
        if (cachedBvn) {
          if (cachedBvn.imgPath) {
            return retrieveImageForCache(cachedBvn).then(() => console.log('...Saved NIN Image to S3'));
          } else {
            //no need to wait.
            saveProviderImageToS3(cachedBvn, true).then(() => console.log('...Saved to S3'));
            return cachedBvn;
          }
        }
      }

    }

    const ninData = await NIBSS.fetchNimcData(nin, idType);
    if (ninData) {
      //we need to wait now, to prevent concurrency issues.
      //so to ensure data is saved before new requests come in.
      await saveProviderImageToS3(ninData, false).then(() => console.log('...Saved NIN image to S3'));
      return ninData;
    }

    return ninData;
  } finally {
    if (lock) {
      LockService.releaseLock(lockKey);
    }
  }
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

async function saveProviderImageToS3(result, isBvn = false) {
  try {
    let s3Response = await S3ImageService.saveToS3(result.img, result.idNumber);
    if (s3Response) {
      result.imgPath = s3Response.key;
      result.img = null;
      await saveToDatabase(result, isBvn);
      return s3Response;
    }
  } catch (err) {
    console.log(err);
  }
}

async function saveToDatabase(result, isBvn) {
  try {
    if (isBvn) {
      return BvnCache.saveResult(result);
    } else {
      return NinCache.saveResult(result);
    }
  } catch (err) {
    console.log(err);
  }
}