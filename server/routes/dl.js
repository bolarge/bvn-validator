/**
 * Created by nonami on 25/04/2018.
 */

'use strict';

const DlController = require('../controllers/DriverLicenceController');


module.exports = function (app) {
    app.get("/oapi/driverlicence/:idNumber",
        require('passport').authenticate('basic', {session: false}),
        DlController.fetchData
    );
};
