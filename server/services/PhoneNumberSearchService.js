const PhoneSearchCache = require('../models/PhoneSearchCache');
const NIBSS = require('./BVNProvider/nibss');
const LockService = require('../services/LockService');
const Utils = require('../services/Utils');

const PHONE_SEARCH_LOCK_TIMEOUT = 45000;


const cacheResult = (result) => {
  return PhoneSearchCache.saveResult(result);
};

const fetchPhoneSearchData = async (phoneNumber, forceReload = false) => {
  let lock, lockKey = `phone-search-${phoneNumber}`;

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

const phoneNumberHasMatchingValidAccount = (matchedAccountRecords, userData) => {
  for (let record of matchedAccountRecords) {
    let fullNames = [userData.lastName, userData.firstName, userData.middleName];
    let accountNames = [record.firstName, record.middleName, record.lastName];
    if (Utils.doNameMatch(fullNames, accountNames)) {
      return true;
    }
  }
  return false;
};

const validateCustomerByPhoneNumber = async (userData, forceReload) => {
  let matchedAccountRecords;
  try {
    const record = await fetchPhoneSearchData(userData.phoneNumber, forceReload);
    matchedAccountRecords = record.matchedRecords;
  } catch (err) {
    console.log("PHONE_SEARCH_ERROR", userData.phoneNumber, userData.clientId);
  }
  return Utils.generateResponse(
    phoneNumberHasMatchingValidAccount(matchedAccountRecords || [], userData),
    matchedAccountRecords
  );
};

module.exports.fetchPhoneSearchData = fetchPhoneSearchData;
module.exports.validateCustomerByPhoneNumber = validateCustomerByPhoneNumber;
