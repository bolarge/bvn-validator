const phoneSearch = require('../services/PhoneNumberSearchService');
const Utils = require('../services/Utils');

module.exports.searchPhoneNumber = async (req, res) => {
  const phoneNumber = req.params.phoneNumber;
  if (!phoneNumber) {
    return res.status(400).json({message: "No Phone Number to resolve."});
  }
  const forceReload = req.query.forceReload === '1';

  try {
    const result = await phoneSearch.fetchPhoneSearchData(phoneNumber, forceReload);
    if (!result) {
      return res.status(404).json({message: "No data returned"});
    }
    console.log('Phone Number Search request:', phoneNumber, 'by:', req.user.username);
    res.json(result.matchedRecords || []);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({message: err.message});
  }

};

const hasValidUserData = (userData) => {
  return Utils.validateRequest(userData, ['phoneNumber', 'clientId', 'firstName', 'lastName']).status;
};

module.exports.validateCustomerByPhoneNumber = async (req, res) => {
  if (!hasValidUserData(req.body)) {
    return res.status(400).json({message: "Invalid validation data received."});
  }
  const forceReload = req.query.forceReload === '1';
  try {
    const result = await phoneSearch.validateCustomerByPhoneNumber(req.body, forceReload);
    console.log('Phone Number Search request:', req.body.phoneNumber, 'by:', req.user.username);
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({message: err.message});
  }
};
