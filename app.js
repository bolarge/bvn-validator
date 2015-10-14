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

var User = mongoose.model('User');

    passport.use(new BasicStrategy(
      function(username, password, done) {
        User.findOne({ username: username }, function (err, user) {
          if (err) { return done(err); }
          if (!user) { return done(null, false); }
          if (!user.authenticate(password)) { return done(null, false); }
          return done(null, user);
        });
      }
      ));

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
