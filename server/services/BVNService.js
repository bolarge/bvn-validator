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
                return response;
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
            if (result) {

                if (result.isS3img) {
                    return retrieveImageForCache(result);
                } else {
                    saveProviderImageToS3(result);
                    return result;
                }
            } else {
                return getBvnInfo(bvn);
            }

        }).catch((err) => {
            console.log(err);
            return err.message

        });
};


function retrieveImageForCache(result) {
    return S3ImageService.retrieveImageFromS3(result)
        .then((s3Response) => {
            result.img = s3Response.response;
            return result;
        }).catch((err) => {
            console.log(err);
            return result;
        });
}

function saveProviderImageToS3(result) {
    return S3ImageService.saveToS3(result.img, result.bvn, 'BVN')
        .then((s3Response) => {
            result.isS3img = true;
            result.img = s3Response.key;
            return BvnCache.saveResult(result);
        }).catch((err) => {
            console.log(err);
            return result;
        });

}

