/**
 * Created by temi on 11/07/2016.
 */
'use strict';

const config = require('../../config'),
  AccountController = require('../controllers/AccountValidationController'),
  authPolicy = require('passport').authenticate('basic', {session: false});


module.exports = function (app) {

  app.post("/oapi/accountValidation",
    authPolicy,
    AccountController.validateAccount
  );

  app.post("/oapi/payout", authPolicy, (req, res) => {

    const client = require('../services/CPoSClient');

    client.payoutImport(req.body)
      .spread((status, body) => console.log('Payout import complete: ', body.id, body.accountId))
      .catch((err) => {
        console.error("Could not complete import:", err);
      });

    res.send(200, {message: 'Sent for processing'});
  });

};

