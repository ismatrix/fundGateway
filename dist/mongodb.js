'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

let connect = (() => {
  var _ref = _asyncToGenerator(function* (url) {
    gurl = url;
    try {
      connectionInstance = yield MongoClient.connect(gurl);
      event.emit('connect');
    } catch (err) {
      debug('Mongodb connect Err: %s', err);
      event.emit('error');
    }
  });

  return function connect(_x) {
    return _ref.apply(this, arguments);
  };
})();

var _mongodb = require('mongodb');

var _mongodb2 = _interopRequireDefault(_mongodb);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } // http://mongodb.github.io/node-mongodb-native/2.2/reference/ecmascript6/crud/
// http://mongodb.github.io/node-mongodb-native/2.2/api/index.html


const debug = (0, _debug2.default)('mongodb');
const event = new _events2.default.EventEmitter();
const MongoClient = _mongodb2.default.MongoClient;

let connectionInstance;
let gurl;

function getdb() {
  if (connectionInstance) {
    // debug('existing connection');
    return connectionInstance;
  }
  return new Promise((resolve, reject) => {
    event.on('connect', () => {
      debug('connected on promise resolution to existing connectionInstance');
      resolve(connectionInstance);
    });
    event.on('error', () => {
      debug('new connection with instance: %o', connectionInstance);
      reject(new Error('Error connection'));
    });
  });
}

const mongo = {
  connect,
  getdb
};

exports.default = mongo;