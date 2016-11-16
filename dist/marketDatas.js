'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

let addAndGetMarketData = (() => {
  var _ref = _asyncToGenerator(function* (config) {
    const {
      serviceName,
      server,
      jwtoken,
      sslCaCrtPath
    } = config;
    try {
      const existingClient = marketDataClients.find(matchMarketDataClient(config));
      if (existingClient !== undefined) return existingClient;

      let sslCaCrt;
      if (typeof sslCaCrtPath === 'string') {
        const sslCaCrtAbsolutePath = _path2.default.join(__dirname, sslCaCrtPath);
        sslCaCrt = yield fs.readFileAsync(sslCaCrtAbsolutePath);
      }
      const newMDGatewayClient = (0, _swGrpcClient2.default)({
        serviceName,
        server,
        sslCaCrt,
        jwtoken
      });

      marketDataClients.push(newMDGatewayClient);
      return newMDGatewayClient;
    } catch (error) {
      debug('Error addMarketData(): %o', error);
    }
  });

  return function addAndGetMarketData(_x) {
    return _ref.apply(this, arguments);
  };
})();

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _swGrpcClient = require('sw-grpc-client');

var _swGrpcClient2 = _interopRequireDefault(_swGrpcClient);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new _bluebird2.default(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return _bluebird2.default.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = (0, _debug2.default)('marketDatas');
const fs = _bluebird2.default.promisifyAll(_fs2.default);

const marketDataClients = [];

const matchMarketDataClient = newConfig => elem => elem.config.serviceName === newConfig.serviceName;

function getMarketData(config) {
  try {
    const existingClient = marketDataClients.find(matchMarketDataClient(config));
    if (existingClient !== undefined) return existingClient;

    throw new Error('marketDataClient not found');
  } catch (error) {
    debug('Error getMarketData(): %o', error);
  }
}

const marketDatas = {
  addAndGetMarketData,
  getMarketData
};

exports.default = marketDatas;