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
  wsdlUrl: process.env.NIBSS_WSDL_URL || 'http://196.6.103.100/BVNValidationBooleanMatch/bvnValidation?wsdl',
  nip: {
    publicKeyPath: process.env.NIP_PUBLIC_KEY_PATH || 'keys/public.key',
    privateKeyPath: process.env.NIP_PRIVATE_KEY_PATH || 'keys/private.key',
    password: process.env.NIP_PASSWORD || "OneFi123",
    schemeCode: process.env.NIP_SCHEME_CODE || "999061",
    channelCode: "8",
    wsdl: process.env.NIP_WSDL || 'http://196.6.103.10:86/NIPWS/NIPInterface?wsdl'
  }
};

module.exports.authentication = {
  salt: 8
};

module.exports.account = {
  accountValidationURL: process.env.NIBSS_ACCOUNT_URL || 'https://41.58.130.138:5035/icad/accounts',
  accountValidationTimeout: process.env.NIBSS_ACCOUNT_TIMEOUT || 10000,
  apiKey: process.env.NIBSS_ACCOUNT_API_KEY || '848939ujrhd7erhdbe7',
  socksPort: process.env.SOCKS_PORT || false
}
