/**
 * Created by taiwo on 6/6/16.
 */
'use strict';

var express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  mongoose = require('mongoose'),
  passport = require('passport'),
  config = require('./config')
;


var worker = require('debug')('worker');

mongoose.connect(config.db.url);

// set our port
var port = process.env.PORT || 3000;

// connect to our mongoDB database
// (uncomment after you enter in your own credentials in config/db.js)
//mongoose.connect(db.url);

app.use(bodyParser.json());

// parse application/vnd.api+json as json
app.use(bodyParser.json({type: 'application/vnd.api+json'}));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));

// override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(methodOverride('X-HTTP-Method-Override'));

app.use(express.static(__dirname + '/public'));

app.use(function (req, res, next) {
  console.log('PATH ', req.method, req.path, new Date());
  next();
});

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Authorization");
  next();

});


app.use(passport.initialize({}));
app.use(passport.session());

require('./server').init(app);

app.listen(port);

// shoutout to the user
console.log('Serving on port ' + port);
// expose app
module.exports = app;
