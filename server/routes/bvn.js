'use strict';

var config = require('../../config'),
  BvnController = require('../controllers/BvnController')
  ;


module.exports = function (app) {

  app.post("/oapi/bvnValidation",
    require('passport').authenticate('basic', {session: false}),
    BvnController.validate
  );
  
};
