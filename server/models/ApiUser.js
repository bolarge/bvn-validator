/**
 * Created by taiwo on 6/7/16.
 */

var mongoose = require('mongoose'), debug = require('debug')('db'),
  bcrypt = require('bcrypt'),
  config = require('../../config');


var apiUserSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  description: String
});

apiUserSchema.pre('save', function (next) {
  if (this.password) {
    debug('Encrypting password...');
    this.password = bcrypt.hashSync(this.password, config.authentication.salt);
  }
  next();
});


var ApiUser = mongoose.model('ApiUser', apiUserSchema);


ApiUser.prototype.checkPassword = function (password) {
  debug('Comparing passwords');
  return bcrypt.compareSync(password, this.password);
};

module.exports.model = ApiUser;

