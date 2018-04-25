/**
 * Created by nonami on 25/04/2018.
 */

const NinService = require('../services/NinService');

module.exports.fetchNinData = function (req, res) {
  if (!req.params.nin) {
    return res.status(400).json({message: "No NIN sent, please check value"});
  }
  const forceReload = req.query.forceReload === '1';
  NinService.fetchNinData(req.params.nin, forceReload)
    .then(function(result) {
      if (!result) {
        return res.status(404).json({message: "NIN not found"})
      }
      res.json(result)
    })
    .catch(function(err) {
      res.status(500).json({message: err.message});
    })

};