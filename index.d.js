'use strict';

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var debug = require('debug')('koa-session');
var ContextSession = require('./lib/context');
var util = require('./lib/util');
var assert = require('assert');

var CONTEXT_SESSION = Symbol('context#contextSession');
var _CONTEXT_SESSION = Symbol('context#_contextSession');

/**
 * Initialize session middleware with `opts`:
 *
 * - `key` session cookie name ["koa:sess"]
 * - all other options are passed as cookie options
 *
 * @param {Object} [opts]
 * @param {Application} app, koa application instance
 * @api public
 */

module.exports = function (opts, app) {
  // session(app[, opts])
  if (opts && typeof opts.use === 'function') {
    var tmp = app;
    app = opts;
    opts = tmp;
  }
  // app required
  if (!app || typeof app.use !== 'function') {
    throw new TypeError('app instance required: `session(opts, app)`');
  }

  opts = formatOpts(opts);
  extendContext(app.context, opts);

  return function () {
    var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(ctx, next) {
      var sess;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              sess = ctx[CONTEXT_SESSION];

              if (!sess.store) {
                _context.next = 4;
                break;
              }

              _context.next = 4;
              return sess.initFromExternal();

            case 4:
              _context.prev = 4;
              _context.next = 7;
              return next();

            case 7:
              _context.next = 12;
              break;

            case 9:
              _context.prev = 9;
              _context.t0 = _context['catch'](4);
              throw _context.t0;

            case 12:
              _context.prev = 12;
              _context.next = 15;
              return sess.commit();

            case 15:
              return _context.finish(12);

            case 16:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this, [[4, 9, 12, 16]]);
    }));

    function session(_x, _x2) {
      return _ref.apply(this, arguments);
    }

    return session;
  }();
};

/**
 * format and check session options
 * @param  {Object} opts session options
 * @return {Object} new session options
 *
 * @api private
 */

function formatOpts(opts) {
  opts = opts || {};
  // key
  opts.key = opts.key || 'koa:sess';

  // back-compat maxage
  if (!('maxAge' in opts)) opts.maxAge = opts.maxage;

  // defaults
  if (opts.overwrite == null) opts.overwrite = true;
  if (opts.httpOnly == null) opts.httpOnly = true;
  if (opts.signed == null) opts.signed = true;

  debug('session options %j', opts);

  // setup encoding/decoding
  if (typeof opts.encode !== 'function') {
    opts.encode = util.encode;
  }
  if (typeof opts.decode !== 'function') {
    opts.decode = util.decode;
  }

  if (opts.store) {
    assert(typeof opts.store.get === 'function', 'store.get must be function');
    assert(typeof opts.store.set === 'function', 'store.set must be function');
    assert(typeof opts.store.destroy === 'function', 'store.destroy must be function');
  }

  return opts;
}

/**
 * extend context prototype, add session properties
 *
 * @param  {Object} context koa's context prototype
 * @param  {Object} opts session options
 *
 * @api private
 */

function extendContext(context, opts) {
  var _Object$definePropert;

  Object.defineProperties(context, (_Object$definePropert = {}, _defineProperty(_Object$definePropert, CONTEXT_SESSION, {
    get: function get() {
      if (this[_CONTEXT_SESSION]) return this[_CONTEXT_SESSION];
      this[_CONTEXT_SESSION] = new ContextSession(this, opts);
      return this[_CONTEXT_SESSION];
    }
  }), _defineProperty(_Object$definePropert, 'session', {
    get: function get() {
      return this[CONTEXT_SESSION].get();
    },
    set: function set(val) {
      this[CONTEXT_SESSION].set(val);
    },

    configurable: true
  }), _defineProperty(_Object$definePropert, 'sessionOptions', {
    get: function get() {
      return this[CONTEXT_SESSION].opts;
    }
  }), _Object$definePropert));
}
