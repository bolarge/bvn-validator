#!/usr/local/bin/node

var ssm = require('./server/lib/ssm'),
  nodeOpts = require('node-getopt'),
  _ = require('lodash')
  ;


var getOpts = nodeOpts.create([
    ['', 'public-key=ARG', 'Path to public key'],
    ['', 'private-key=ARG', 'Path to private key'],
    ['u', 'username=ARG', 'Username/Key alias'],
    ['p', 'password=ARG', 'Password'],
    ['h', 'help', 'display this help']

  ])
  .bindHelp();

var opts = getOpts.parseSystem();

//
var inputOptions = _.extend({
  'public-key': 'public.key',
  'private-key': 'private.key'
}, opts.options);

if(!inputOptions.username && !inputOptions.password){
  console.log('Username and password must be specified');
  getOpts.showHelp();
  process.exit(1);
}


ssm.generateKey(inputOptions.username, inputOptions.password, inputOptions['public-key'], inputOptions['private-key'])
  .then(function (result) {
    console.log('Keys have been successfully generated', result);
  }, function (err) {
    console.error('We could not generate the keys', err);
  });

