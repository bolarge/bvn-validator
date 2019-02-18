/**
 * Created by nonami on 23/04/2018.
 */
const BvnCache = require('../models/BvnCache');
const Paystack = require('./BVNProvider/Paystack');
const NIBSS = require('./BVNProvider/nibss');
const cfg = require('../../config');
const S3ImageService = require('../services/S3ImageService');


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
                saveProviderImageToS3(response);
            }
            return response;
        })
};

module.exports.resolve = async (bvn, forceReload = false) => {

    if (forceReload) {
        return getBvnInfo(bvn);
    }

    try {
        let result = await BvnCache.getCachedResult(bvn);
        if (result) {

            if (result.imgPath) {
                return retrieveImageForCache(result);
            } else {
                saveProviderImageToS3(result);
                return result;
            }
        } else {
            return getBvnInfo(bvn);
        }


    } catch (err) {

        console.log(err);
        return err.message

    }
};


async function retrieveImageForCache(result) {
    try {
        let s3Response = await S3ImageService.retrieveImageFromS3(result);
        if (s3Response) {
            result.img = s3Response.response;
        }
    } catch (err) {
        console.log(err);

    }
    return result;
}

async function saveProviderImageToS3(result) {

    try {
        let s3Response = await S3ImageService.saveToS3(result.img, result.bvn);
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
        return BvnCache.saveResult(result);
    } catch (err) {
        console.log(err);
    }
}

