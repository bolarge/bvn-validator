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
      return cachedNin;
    }

    if (idType === 'nin') {
      const cachedBvn = await BvnCache.findOne({nin});
      if (!!cachedBvn) {
        return cachedBvn;
      }
    }

  }

  const ninData = await NIBSS.fetchNimcData(nin, idType);
  if (!!ninData) {
    NinCache.saveResult(ninData);
  }

  return ninData;
};