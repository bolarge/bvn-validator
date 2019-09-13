/**
 * Created by nonami on 12/09/2019.
 */
const DLCache = require('../models/DlCache');
const NIBSS = require('./BVNProvider/nibss');
const S3ImageService = require('../services/S3ImageService');
const LockService = require('../services/LockService');

const _ = require('lodash');
const DL_SEARCH_LOCK_TIMEOUT = 45000;


module.exports.fetchDlData = async (idNumber, forceReload = false) => {
    let lock, lockKey = `dl-${idNumber}`;

    try {
        lock = await LockService.acquireLock(lockKey, DL_SEARCH_LOCK_TIMEOUT, DL_SEARCH_LOCK_TIMEOUT);
        console.log('Lock acquired:', lockKey);

        if (!forceReload) {
            const cachedData = await DLCache.getCachedResult(idNumber);
            if (cachedData) {
                return retrieveImageForCache(cachedData);
            }
        }

        const startTime = Date.now();
        const dlData = await NIBSS.fetchDlData(idNumber);
        console.log("DL_RESOLUTION_TIME  = " + (Date.now() - startTime) / 1000.0);
        if (dlData) {
            await saveProviderImageToS3(dlData, false).then(() => console.log('...Saved DL image to S3'));
        }

        return dlData;
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
        // Return existing result if S3 pull fails so it's still useable to caller
        return result;
    }

}

async function saveProviderImageToS3(result, isBvn = false) {
    try {
        result = _.cloneDeep(result);
        let s3Response = await S3ImageService.saveToS3(result.img, result.idNumber);
        if (s3Response) {
            result.imgPath = s3Response.key;
            result.img = null;
            await DLCache.saveResult(result);
            return s3Response;
        }
    } catch (err) {
        console.log(err);
    }
}
