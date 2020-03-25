/**
 * Created by taiwo on 6/7/16.
 */
require('mongoose').Promise = require('bluebird');

module.exports.db = {
  url: process.env.MONGODB_URL || 'mongodb+srv://staginguser:nwx1KOyH1yUDxSuG@staging-jnyqv.mongodb.net/bvnservice_staging?retryWrites=true&w=majority',
  options: {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  }
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
    nibssKeyPath: process.env.NIP_NIBSS_KEY_PATH || 'keys/nibss.key',
    publicKeyPath: process.env.NIP_PUBLIC_KEY_PATH || 'keys/public.key',
    privateKeyPath: process.env.NIP_PRIVATE_KEY_PATH || 'keys/private.key',
    password: process.env.NIP_PASSWORD || "OneFi123",
    schemeCode: process.env.NIP_SCHEME_CODE || "999061",
    channelCode: process.env.NIP_CHANNEL_CODE || "8",
    wsdl: process.env.NIP_WSDL || 'http://196.6.103.10:86/NIPWS/NIPInterface?wsdl'
  },
  portal: {
    baseUrl: process.env.NIBSS_PORTAL_URL || 'https://bvnvalidationportal.nibss-plc.com.ng',
    user: process.env.NIBSS_USERNAME || '',
    password: process.env.NIBSS_PASSWORD || '',
    timeout: parseInt(process.env.NIBSS_PORTAL_TIMEOUT_SECONDS) || 60,
    poolConfig: {
      max: 1,
      min: 1,
      idleTimeoutMillis: 180000,
      maxUses: 50,
      phantomArgs: [
        ['--ignore-ssl-errors=true', '--disk-cache=true'], {
          logLevel: 'warn',
        }]
    }
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
};

module.exports.cpos = {
  baseURL: process.env.CPOS_BASE_URL || 'http://54.200.6.143:8080',
  username: process.env.CPOS_USERNAME || 'user',
  password: process.env.CPOS_PASSWORD || 'password'
};

module.exports.paystack = {
  baseUrl: process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co',
  authSecret: process.env.PAYSTACK_SECRET || ''
};

module.exports.activeBvnProvider = process.env.ACTIVE_BVN_PROVIDER || 'nibss';


module.exports.aws = {
  region: process.env.AWS_DEFAULT_REGION || 'us-west-2',
  pictureS3Bucket: 'onefibvnservice-' + (process.env.NODE_ENV !== 'production' ? 'staging' : 'production')
};

