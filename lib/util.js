'use strict';

var crc = require('crc').crc32;

module.exports = {

  /**
   * Decode the base64 cookie value to an object.
   *
   * @param {String} string
   * @return {Object}
   * @api private
   */

  decode: function decode(string) {
    var body = new Buffer(string, 'base64').toString('utf8');
    var json = JSON.parse(body);
    return json;
  },


  /**
   * Encode an object into a base64-encoded JSON string.
   *
   * @param {Object} body
   * @return {String}
   * @api private
   */

  encode: function encode(body) {
    body = JSON.stringify(body);
    return new Buffer(body).toString('base64');
  },
  hash: function hash(sess) {
    return crc(JSON.stringify(sess));
  }
};