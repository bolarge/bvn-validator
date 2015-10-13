'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var Bvn = new Module('bvn');
var BasicStrategy = require('passport-http').BasicStrategy;
var mongoose = require('mongoose');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
Bvn.register(function(app, auth, database, passport) {

  //We enable routing. By default the Package Object is passed to the routes
  Bvn.routes(app, auth, database, passport);

  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    Bvn.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    Bvn.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    Bvn.settings(function(err, settings) {
        //you now have the settings object
    });
    */

  return Bvn;
});
