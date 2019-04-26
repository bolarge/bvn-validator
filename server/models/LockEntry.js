const connection = require('./connection');
const Schema = require('mongoose').Schema;

const DEFAULT_LOCK_TIMEOUT = 600000;

const lockSchema = new Schema({
  _id: String,
  expiresAt: {
    type: Date,
    default: function () {
      return Date.now() + DEFAULT_LOCK_TIMEOUT;
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});


module.exports = connection.model('LockEntry', lockSchema, 'lock_entry');

