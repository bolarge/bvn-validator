/**
 * Created by taiwo on 6/7/16.
 */

const mongoose = require('mongoose'),
  connection = require('./connection'),
  debug = require('debug')('db'),
  bcrypt = require('bcrypt'),
  config = require('../../config');


const apiUserSchema = mongoose.Schema({
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


const ApiUser = connection.model('ApiUser', apiUserSchema);


ApiUser.prototype.checkPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports.model = ApiUser;

