'use strict';

var config = require('../../config'),
    BvnController = require('../controllers/BvnController')
;


module.exports = function (app) {

    app.get("/oapi/resolveBvn/:bvn",
        require('passport').authenticate('basic', {session: false}),
        BvnController.resolveBvn
    );
};
