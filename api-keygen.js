#!/usr/local/bin/node

"use strict";

var mongoose = require('mongoose'),
  config = require('./config'),
  prompt = require('prompt');

mongoose.connect(config.db.url);

var ApiUser = require('./server/models/ApiUser').model;

var schema = {
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
    if(err){
      console.log('The API key could not be generated', err);
    } else {
      console.log('Saved successfully...');
    }

    process.exit(0);
  });

});