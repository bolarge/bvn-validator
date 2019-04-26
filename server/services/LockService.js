"use strict";

const WAIT_FOR_LOCK_RETRY = 1000;
const LockService = {};
const LockEntry = require('../models/LockEntry');
const Promise = require('bluebird');

const waitForLock = async (lockKey, ttl, timeout) => {
  console.log(lockKey, 'lock is busy, waiting to retry...');
  await Promise.delay(WAIT_FOR_LOCK_RETRY);
  return LockService.acquireLock(lockKey, ttl, timeout - WAIT_FOR_LOCK_RETRY);
};

LockService.acquireLock = async function (lockKey, ttl, timeout = 0) {

  console.log(lockKey, 'Attempting to acquire, ttl=', ttl);
  let lock = await LockEntry.findOne({_id: lockKey});
  if (lock) {
    if (lock.expiresAt < Date.now()) {
      console.log(lockKey, 'existing lock expired already');
      await LockEntry.remove({_id: lockKey});
    } else if (timeout > 0) {
      return waitForLock(lockKey, ttl, timeout);
    } else {
      console.log(lockKey, 'lock could not be acquired after timeout');
      throw new Error("Lock is still in use. " + lockKey + " after timeout");
    }
  }

  lock = {_id: lockKey};
  if (ttl) {
    lock.expiresAt = Date.now() + ttl;
  }

  try {
    const locked = await new LockEntry(lock).save();
    console.log(lockKey, 'Lock acquired...');
    return locked;
  } catch (e) {
    if (/duplicate key/i.test(e.message)) {
      return waitForLock(lockKey, ttl, timeout);
    }
    throw e;
  }
};

LockService.releaseLock = function (lockKey) {
  LockEntry.remove({_id: lockKey})
    .exec(function (err) {
      console.log('Lock released: ', lockKey);
    });
};


module.exports = LockService;
