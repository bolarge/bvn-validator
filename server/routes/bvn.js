'use strict';

var config = require('../../config'),
  BvnController = require('../controllers/BvnController')
  ;


module.exports = function (app) {

  app.post("/oapi/bvnValidation",
    require('passport').authenticate('basic', {session: false}),
    BvnController.validate
  );


  app.post("/oapi/validate",
    require('passport').authenticate('basic', {session: false}),
    BvnController.validateBoolean
  );


  app.get("/oapi/validate",
    require('passport').authenticate('basic', {session: false}),
    BvnController.validateBoolean
  );

  app.get("/oapi/resolveBvn/:bvn",
    require('passport').authenticate('basic', {session: false}),
    BvnController.resolveBvn
  );
};
