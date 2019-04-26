#!/usr/local/bin/node

"use strict";

const prompt = require('prompt');

const ApiUser = require('./server/models/ApiUser').model;

const schema = {
  properties: {
    username: {
      pattern: /^[0-9a-zA-Z\s\-]+$/,
      description: 'Please specify username',
      required: true
    },
    password: {
      hidden: true,
      required: true,
      description: 'Please specify password'
    },
    description: {
      description: 'Description of Key'
    }
  }
};

//
// Start the prompt
//
prompt.start();


prompt.get(schema, function (err, result) {
  var userKey = new ApiUser({
    username: result.username,
    password: result.password,
    description: result.description,
  });

  userKey.save(function (err) {
    if (err) {
      console.log('The API key could not be generated', err);
    } else {
      console.log('Saved successfully...');
    }

    process.exit(0);
  });

});