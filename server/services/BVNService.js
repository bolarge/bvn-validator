/**
 * Created by nonami on 23/04/2018.
 */
const BvnCache = require('../models/BvnCache');
const Paystack = require('./BVNProvider/Paystack');
const NIBSS = require('./BVNProvider/nibss');
const cfg = require('../../config');
const S3ImageService = require('../services/S3ImageService');
const LockService = require('../services/LockService');
const BVN_TTL_LOCK = 30000; //45 seconds is a long time though


const getProvider = () => {
  const pList = [Paystack, NIBSS].filter((p) => p.name === cfg.activeBvnProvider);
  if (pList.length > 0) {
    return pList[0];
  }
  return NIBSS;
};

const getBvnInfo = async (bvn) => {
  const response = await getProvider().resolveBvn(bvn);
  if (response) {
    //now we have to wait to ensure that we don't query provider twice for concurrent requests
    await saveProviderImageToS3(response).then(() => console.log('Image saved to S3'));
  }

  return response;
};

module.exports.resolve = async (bvn, forceReload = false) => {

  let lock = null, lockKey = `bvn-check-${bvn}`;
  try {
    lock = await LockService.acquireLock(lockKey, BVN_TTL_LOCK, BVN_TTL_LOCK);
    let result = null;
    if (!forceReload) {
      result = await BvnCache.getCachedResult(bvn);
    } else {
      console.log(bvn, 'FORCE_RELOAD specified at: ', new Date());
    }

    if (result) {
      console.log(bvn, 'HIT, returning cached data');
      if (result.imgPath) {
        return retrieveImageForCache(result);
      } else {
        //we don't have to block here, since this is an update of existing record
        saveProviderImageToS3(result).then(() => console.log('Image saved to S3'));
        return result;
      }
    }

    console.log(bvn, 'MISS, requery sent to provider');
    //this method needs to complete before releasing lock
    //returning as promise will cause lock to be released before promise is completed
    return await getBvnInfo(bvn);
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

async function saveProviderImageToS3(result) {
  try {
    console.log('Saving image to S3');
    let s3Response = await S3ImageService.saveToS3(result.img, result.bvn);
    if (s3Response) {
      console.log('Image saved to S3');
      result.imgPath = s3Response.key;
      result.img = null;
      await saveToDatabase(result);
    }
    return s3Response;
  } catch (err) {
    console.log(err);
  }
}

async function saveToDatabase(result) {
  try {
    return await BvnCache.saveResult(result);
  } catch (err) {
    console.log(err);
  }
}

