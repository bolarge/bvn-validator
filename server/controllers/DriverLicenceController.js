/**
 * Created by nonami on 13/09/2019.
 */
const DriverLicenceService = require('../services/DriverLicenceService');

module.exports.fetchData = function (req, res) {
    const forceReload = req.query.forceReload === '1';
    DriverLicenceService.fetchDlData(req.params.idNumber, forceReload)
        .then(function (result) {
            if (!result) {
                return res.status(404).json({message: "ID number data not found"})
            }
            res.json(result)
        })
        .catch(function (err) {
            console.error(req.params.idNumber, ' --> Error; ', err);
            res.status(500).json({message: err.message});
        });

};