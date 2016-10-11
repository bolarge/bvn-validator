/**
 * Created by temi on 10/10/2016.
 */

module.exports.randomString = function (length, chars) {
  if (!chars) {
    chars = '0123456789ABCDEFGHJKLMNOPQRSTUVWXYZ';
  }

  var result = '';

  for (var i = length; i > 0; --i) {
    result += chars[Math.round(Math.random() *
      (chars.length - 1))];
  }

  return result;
};
