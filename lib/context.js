'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = require('debug')('koa-session:context');
var Session = require('./session');
var uid = require('uid-safe');
var util = require('./util');

var ONE_DAY = 24 * 60 * 60 * 1000;

var ContextSession = function () {
  /**
   * context session constructor
   * @api public
   */

  function ContextSession(ctx, opts) {
    _classCallCheck(this, ContextSession);

    this.ctx = ctx;
    this.opts = Object.assign({}, opts);
    this.store = this.opts.store;
  }

  /**
   * internal logic of `ctx.session`
   * @return {Session} session object
   *
   * @api public
   */

  _createClass(ContextSession, [{
    key: 'get',
    value: function get() {
      var session = this.session;
      // already retrieved
      if (session) return session;
      // unset
      if (session === false) return null;

      // cookie session store
      if (!this.store) this.initFromCookie();
      return this.session;
    }

    /**
     * internal logic of `ctx.session=`
     * @param {Object} val session object
     *
     * @api public
     */

  }, {
    key: 'set',
    value: function set(val) {
      if (val === null) {
        this.session = false;
        return;
      }
      if ((typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object') {
        // use the original `externalKey` if exists to avoid waste storage
        this.create(val, this.externalKey);
        return;
      }
      throw new Error('this.session can only be set as null or an object.');
    }

    /**
     * init session from external store
     * will be called in the front of session middleware
     *
     * @api public
     */

  }, {
    key: 'initFromExternal',
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var ctx, opts, externalKey, json;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                debug('init from external');
                ctx = this.ctx;
                opts = this.opts;
                externalKey = ctx.cookies.get(opts.key, opts);

                debug('get external key from cookie %s', externalKey);

                if (externalKey) {
                  _context.next = 8;
                  break;
                }

                // create a new `externalKey`
                this.create();
                return _context.abrupt('return');

              case 8:
                _context.next = 10;
                return this.store.get(externalKey);

              case 10:
                json = _context.sent;

                if (this.valid(json)) {
                  _context.next = 14;
                  break;
                }

                // create a new `externalKey`
                this.create();
                return _context.abrupt('return');

              case 14:

                // create with original `externalKey`
                this.create(json, externalKey);
                this.prevHash = util.hash(this.session.toJSON());

              case 16:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function initFromExternal() {
        return _ref.apply(this, arguments);
      }

      return initFromExternal;
    }()

    /**
     * init session from cookie
     * @api private
     */

  }, {
    key: 'initFromCookie',
    value: function initFromCookie() {
      debug('init from cookie');
      var ctx = this.ctx;
      var opts = this.opts;

      var cookie = ctx.cookies.get(opts.key, opts);
      if (!cookie) {
        this.create();
        return;
      }

      var json = void 0;
      debug('parse %s', cookie);
      try {
        json = opts.decode(cookie);
      } catch (err) {
        // backwards compatibility:
        // create a new session if parsing fails.
        // new Buffer(string, 'base64') does not seem to crash
        // when `string` is not base64-encoded.
        // but `JSON.parse(string)` will crash.
        debug('decode %j error: %s', cookie, err);
        if (!(err instanceof SyntaxError)) {
          // clean this cookie to ensure next request won't throw again
          ctx.cookies.set(opts.key, '', opts);
          // ctx.onerror will unset all headers, and set those specified in err
          err.headers = {
            'set-cookie': ctx.response.get('set-cookie')
          };
          throw err;
        }
        this.create();
        return;
      }

      debug('parsed %j', json);

      if (!this.valid(json)) {
        this.create();
        return;
      }

      // support access `ctx.session` before session middleware
      this.create(json);
      this.prevHash = util.hash(this.session.toJSON());
    }

    /**
     * verify session(expired or )
     * @param  {Object} json session object
     * @return {Boolean} valid
     * @api private
     */

  }, {
    key: 'valid',
    value: function valid(json) {
      if (!json) return false;

      if (!json._expire || json._expire < Date.now()) {
        debug('expired session');
        return false;
      }

      var valid = this.opts.valid;
      if (typeof valid === 'function' && !valid(this.ctx, json)) {
        // valid session value fail, ignore this session
        debug('invalid session');
        return false;
      }
      return true;
    }

    /**
     * create a new session and attach to ctx.sess
     *
     * @param {Object} [val] session data
     * @param {String} [externalKey] session external key
     * @api private
     */

  }, {
    key: 'create',
    value: function create(val, externalKey) {
      debug('create session with val: %j externalKey: %s', val, externalKey);
      if (this.opts.store) this.externalKey = externalKey || uid.sync(24);
      this.session = new Session(this.ctx, val);
    }

    /**
     * Commit the session changes or removal.
     *
     * @api public
     */

  }, {
    key: 'commit',
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
        var session, prevHash, opts, ctx, json;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                session = this.session;
                prevHash = this.prevHash;
                opts = this.opts;
                ctx = this.ctx;

                // not accessed

                if (!(undefined === session)) {
                  _context2.next = 6;
                  break;
                }

                return _context2.abrupt('return');

              case 6:
                if (!(session === false)) {
                  _context2.next = 10;
                  break;
                }

                _context2.next = 9;
                return this.remove();

              case 9:
                return _context2.abrupt('return');

              case 10:
                if (session._requireSave) {
                  _context2.next = 16;
                  break;
                }

                json = session.toJSON();
                // do nothing if new and not populated

                if (!(!prevHash && !Object.keys(json).length)) {
                  _context2.next = 14;
                  break;
                }

                return _context2.abrupt('return');

              case 14:
                if (!(prevHash === util.hash(json))) {
                  _context2.next = 16;
                  break;
                }

                return _context2.abrupt('return');

              case 16:

                if (typeof opts.beforeSave === 'function') {
                  debug('before save');
                  opts.beforeSave(ctx, session);
                }
                _context2.next = 19;
                return this.save();

              case 19:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function commit() {
        return _ref2.apply(this, arguments);
      }

      return commit;
    }()

    /**
     * remove session
     * @api private
     */

  }, {
    key: 'remove',
    value: function () {
      var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
        var opts, ctx, key, externalKey;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                opts = this.opts;
                ctx = this.ctx;
                key = opts.key;
                externalKey = this.externalKey;

                if (!externalKey) {
                  _context3.next = 7;
                  break;
                }

                _context3.next = 7;
                return this.store.destroy(externalKey);

              case 7:
                ctx.cookies.set(key, '', opts);

              case 8:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function remove() {
        return _ref3.apply(this, arguments);
      }

      return remove;
    }()

    /**
     * save session
     * @api private
     */

  }, {
    key: 'save',
    value: function () {
      var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
        var opts, key, externalKey, maxAge, json;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                opts = this.opts;
                key = opts.key;
                externalKey = this.externalKey;
                maxAge = opts.maxAge || ONE_DAY;
                json = this.session.toJSON();
                // set expire for check

                json._expire = maxAge + Date.now();
                json._maxAge = maxAge;

                // save to external store

                if (!externalKey) {
                  _context4.next = 13;
                  break;
                }

                debug('save %j to external key %s', json, externalKey);
                _context4.next = 11;
                return this.store.set(externalKey, json, maxAge);

              case 11:
                this.ctx.cookies.set(key, externalKey, opts);
                return _context4.abrupt('return');

              case 13:

                // save to cookie
                debug('save %j to cookie', json);
                json = opts.encode(json);
                debug('save %s', json);

                this.ctx.cookies.set(key, json, opts);

              case 17:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function save() {
        return _ref4.apply(this, arguments);
      }

      return save;
    }()
  }]);

  return ContextSession;
}();

module.exports = ContextSession;