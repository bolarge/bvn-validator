/**
 * Created by nonami on 12/09/2019.
 */
const PhoneSearchCache = require('../models/PhoneSearchCache');
const NIBSS = require('./BVNProvider/nibss');
const LockService = require('../services/LockService');

const PHONE_SEARCH_LOCK_TIMEOUT = 45000;


module.exports.fetchDlData = async (phoneNumber, forceReload = false) => {
    let lock, lockKey = `phone-search-${PhoneSearchCache}`;

    try {
        lock = await LockService.acquireLock(lockKey, PHONE_SEARCH_LOCK_TIMEOUT, PHONE_SEARCH_LOCK_TIMEOUT);
        console.log('Lock acquired:', lockKey);

        if (!forceReload) {
            const cachedData = await PhoneSearchCache.getCachedResult(phoneNumber);
            if (cachedData) {
              return cachedData;
            }
        }

        const startTime = Date.now();
        const phoneSearchData = await NIBSS.fetchCustomerDetailsByPhone(phoneNumber);
        console.log("PHONE_SEARCH_RESOLUTION_TIME  = " + (Date.now() - startTime) / 1000.0);

        if (phoneSearchData) {
          await cacheResult(phoneSearchData);
        }

        return phoneSearchData;
    } finally {
        if (lock) {
            LockService.releaseLock(lockKey);
        }
    }
};

const cacheResult = (result) => {
  return PhoneSearchCache.saveResult(result);
};
