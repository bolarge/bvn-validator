/**
 * Created by nonami on 25/04/2018.
 */

const BvnCache = require('../models/BvnCache');
const NIBSS  = require('./BVNProvider/nibss');

module.exports.fetchNin = (bvn) => {
  return BvnCache.getCachedResult({bvn})
    .then(function(result) {
      if (result && result.nin) {
        return result;
      }
      return NIBSS.resolve(bvn)
        .then((response) => {
          if (response) {
            BvnCache.saveResult({bvn}, response);
          }
          return response;
        });
    })
};