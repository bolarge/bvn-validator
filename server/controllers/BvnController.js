/**
 * Created by taiwo on 6/7/16.
 */

"use strict";

const
  debug = require("debug")("bvn"),
  config = require('../../config'),
  ResultCache = require('../models/ResultCache'),
  _ = require('lodash');

const BVNService = require('../services/BVNService');


module.exports.resolveBvn = function (req, res) {
  if (!req.params.bvn) {
    return res.status(400).json({message: "No BVN to resolve."});
  }
  const forceReload = req.query.forceReload === '1';
  BVNService.resolve(req.params.bvn, forceReload)
    .then(function (result) {
      if (!result) {
        return res.status(404).json({message: "BVN not found"})
      }
        console.log('BVN request:', req.params.bvn, 'by:', req.user.username);
        res.json(result)
    })
    .catch(function (err) {
      console.error(err.message);
      res.status(500).json({message: err.message});
    })

};
