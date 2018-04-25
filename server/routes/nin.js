/**
 * Created by nonami on 25/04/2018.
 */

'use strict';

const NinController = require('../controllers/NinController');


module.exports = function (app) {

  app.get("/oapi/resolveNin/:nin",
    require('passport').authenticate('basic', {session: false}),
    NinController.fetchNinData
  );
};
