/**
 * Created by temi on 11/07/2016.
 */
'use strict';

var config = require('../../config'),
    AccountController = require('../controllers/AccountController');


module.exports = function (app) {

    app.post("/oapi/accountValidation",
        require('passport').authenticate('basic', {session: false}),
        AccountController.validateAccount
    );
};
