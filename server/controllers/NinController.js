/**
 * Created by nonami on 25/04/2018.
 */

const NinService = require('../services/NinService');

module.exports.fetchNimcData = function (req, res) {
  if (!req.params.nin || !req.params.idType) {
    return res.status(400).json({message: "No ID Number and ID type must set"});
  }
  const forceReload = req.query.forceReload === '1';
  NinService.fetchNimcData(req.params.nin, req.params.idType, forceReload)
    .then(function (result) {
      if (!result) {
        return res.status(404).json({message: "ID number data not found"})
      }
      res.json(result)
    })
    .catch(function (err) {
      console.error(req.params.nin, ' --> Error; ', err);
      res.status(500).json({message: err.message});
    });

};