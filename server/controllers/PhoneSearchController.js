"use strict";

const phoneSearch = require('../services/phoneSearch');


module.exports.searchPhoneNumber = function (req, res) {
  const phoneNumber = req.params.phoneNumber;
  if (!phoneNumber) {
    return res.status(400).json({message: "No Phone Number to resolve."});
  }
  const forceReload = req.query.forceReload === '1';
  phoneSearch.resolve(phoneNumber, forceReload)
    .then(function (result) {
      if (!result) {
        return res.status(404).json({message: "No data returned"})
      }
        console.log('Phone Number Search request:', phoneNumber, 'by:', req.user.username);
        res.json(result.data)
    })
    .catch(function (err) {
      console.error(err.message);
      res.status(500).json({message: err.message});
    })

};
