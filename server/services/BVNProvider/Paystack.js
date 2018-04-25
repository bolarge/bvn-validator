/**
 * Created by nonami on 23/04/2018.
 */
const config = require('../../../config');
const rp = require('request-promise');


module.exports.resolve = (bvn) => {
  const options = {
    method: 'GET',
    uri: config.paystack.baseUrl + '/bank/resolve_bvn/' + bvn,
    headers: {
      'Authorization': 'Bearer ' + config.paystack.authSecret
    },
    json: true
  };

  return rp(options)
    .then((response) => {
      response.provider = module.exports.name;
      const data = response.data;
      if (!respone.status) {
        return null;
      }
      const result = {
        firstName: data.first_name,
        lastName: data.last_name,
        dob: data.dob,
        phoneNumber: data.mobile,
        bvn: data.bvn
      };
      return result;
    })
    .catch((err) => {
      if (err.statusCode === 400) {
        return null;
      }
      throw new Error(err.message);
    });
};


module.exports.name = 'paystack';