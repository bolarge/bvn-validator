/**
 * Created by nonami on 25/04/2018.
 */

const BvnCache = require('../models/BvnCache');
const NinCache = require('../models/NinCache');
const NIBSS = require('./BVNProvider/nibss');

module.exports.fetchNinData = async (nin, forceReload = false) => {
  if (!forceReload) {
    const cachedNin = await NinCache.getCachedResult(nin);
    if (!!cachedNin) {
      return cachedNin;
    }

    const cachedBvn = await BvnCache.findOne({nin});
    if (!!cachedBvn) {
      return cachedBvn;
    }
  }

  const ninData = await NIBSS.fetchNinData(nin);
  if (!!ninData) {
    NinCache.saveResult(ninData);
  }

  return ninData;
};