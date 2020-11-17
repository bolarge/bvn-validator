'use strict';

const PhoneSearchController = require('../controllers/PhoneSearchController');


module.exports = function (app) {
  app.get("/oapi/phone-search/:phoneNumber",
    require('passport').authenticate('basic', {session: false}),
    PhoneSearchController.searchPhoneNumber
  );
};
