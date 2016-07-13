/**
 * Created by taiwo on 6/7/16.
 */

var ApiUserModel = require('./models/ApiUser').model;

module.exports.init = function (app) {

  var BasicStrategy = require('passport-http').BasicStrategy;

  require('passport').use(new BasicStrategy(
    function (username, password, done) {
      ApiUserModel.findOne({
        username: username
      }, function (err, user) {
        if (err || !user) {
          console.error("Could not fetch user, error: ", err);
          return done("Invalid credentials supplied", false);
        }

        if (user && !user.checkPassword(password)) {
          return done(null, false);
        }

        return done(null, user);
      });
    }
  ));

  //set routes
  require('./routes/bvn')(app);
  require('./routes/account')(app);
};