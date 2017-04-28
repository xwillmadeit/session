'use strict';

/**
 * Session model.
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Session = function () {
  /**
   * Session constructor
   * @param {Context} ctx
   * @param {Object} obj
   * @api private
   */

  function Session(ctx, obj) {
    _classCallCheck(this, Session);

    this._ctx = ctx;
    if (!obj) {
      this.isNew = true;
    } else {
      for (var k in obj) {
        // restore maxAge from store
        if (k === '_maxAge') this._ctx.sessionOptions.maxAge = obj._maxAge;else this[k] = obj[k];
      }
    }
  }

  /**
   * JSON representation of the session.
   *
   * @return {Object}
   * @api public
   */

  _createClass(Session, [{
    key: 'toJSON',
    value: function toJSON() {
      var _this = this;

      var obj = {};

      Object.keys(this).forEach(function (key) {
        if (key === 'isNew') return;
        if (key[0] === '_') return;
        obj[key] = _this[key];
      });

      return obj;
    }

    /**
     *
     * alias to `toJSON`
     * @api public
     */

  }, {
    key: 'inspect',
    value: function inspect() {
      return this.toJSON();
    }

    /**
     * Return how many values there are in the session object.
     * Used to see if it's "populated".
     *
     * @return {Number}
     * @api public
     */

  }, {
    key: 'save',


    /**
     * save this session no matter whether it is populated
     *
     * @api public
     */

    value: function save() {
      this._requireSave = true;
    }
  }, {
    key: 'length',
    get: function get() {
      return Object.keys(this.toJSON()).length;
    }

    /**
     * populated flag, which is just a boolean alias of .length.
     *
     * @return {Boolean}
     * @api public
     */

  }, {
    key: 'populated',
    get: function get() {
      return !!this.length;
    }

    /**
     * get session maxAge
     *
     * @return {Number}
     * @api public
     */

  }, {
    key: 'maxAge',
    get: function get() {
      return this._ctx.sessionOptions.maxAge;
    }

    /**
     * set session maxAge
     *
     * @param {Number}
     * @api public
     */

    ,
    set: function set(val) {
      this._ctx.sessionOptions.maxAge = val;
      // maxAge changed, must save to cookie and store
      this._requireSave = true;
    }
  }]);

  return Session;
}();

module.exports = Session;