/**
 * Created by temi on 11/07/2016.
 */
'use strict';

var config = require('../../config'),
    AccountController = require('../controllers/AccountValidationController'),
    NIPController = require('../controllers/NIPController');


module.exports = function (app) {

    app.post("/oapi/accountValidation",
        require('passport').authenticate('basic', {session: false}),
        AccountController.validateAccount
    );

    app.post("/oapi/nip/txnStatus",
      require('passport').authenticate('basic', {session: false}),
      NIPController.transferStatus
    );

    app.post("/oapi/nip/fundTransfer",
      require('passport').authenticate('basic', {session: false}),
      NIPController.fundTransfer
    );
};
