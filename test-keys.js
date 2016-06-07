/**
 * Created by taiwo on 6/7/16.
 */
var ssm = require('./server/lib/ssm'),
  config = require('./config');

var dataToEncrypt = "My name is Taiwo";

ssm.encrypt(dataToEncrypt, config.ssm.publicKeyPath)
  .then(function (data) {
    console.log('Encryption completed, data=', data);
    ssm.decrypt(data, config.ssm.password, config.ssm.privateKeyPath)
      .then(function (decrypted) {
        console.log('Decryption completed: ', decrypted);
      });
  })
;