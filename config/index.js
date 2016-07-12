/**
 * Created by taiwo on 6/7/16.
 */
module.exports.db = {
  url: process.env.MONGODB_URL || 'mongodb://localhost:27017/bvn_service'
};

module.exports.caching = {
  cacheResults: true
};


module.exports.ssm = {
  nibssKeyPath: process.env.NIBSS_KEY_PATH || 'keys/nibss.key',
  publicKeyPath: process.env.SSM_PUBLIC_KEY_PATH || 'keys/public.key',
  privateKeyPath: process.env.SSM_PRIVATE_KEY_PATH || 'keys/private.key',
  password: process.env.SSM_PASSWORD || "great55&&31L9900"
};


module.exports.nibss = {
  organisationCode: process.env.NIBSS_ORGANISATION_CODE || '002002',
  wsdlUrl: process.env.NIBSS_WSDL_URL || 'http://196.6.103.100/BVNValidationBooleanMatch/bvnValidation?wsdl'
};

module.exports.authentication = {
  salt: 8
};

module.exports.account = {
  accountValidationURL: process.env.NIBBS_ACCOUNT_URL || 'https://41.58.130.138:5035/icad/accounts',
  accountValidationTimeout: process.env.NIBBS_ACCOUNT_TIMEOUT || 10000,
  apiKey: process.env.API_KEY || '848939ujrhd7erhdbe7',
  socksPort: process.env.SOCKS_PORT || 9004
}