'use strict';

let init = (() => {
  var _ref = _asyncToGenerator(function* () {
    try {
      yield Promise.all([_mongodb2.default.connect(_config.mongodbUrl), _funds2.default.addFund(_config.funds[0]), _marketData2.default.addDataFeed(_config.marketData[0])]);
    } catch (error) {
      debug('Error init(): %o', error);
    }
  });

  return function init() {
    return _ref.apply(this, arguments);
  };
})();

let main = (() => {
  var _ref2 = _asyncToGenerator(function* () {
    try {
      debug('app.js main');
      debug('marketDataDB[0] %o', _config.marketData[0]);
      yield init();

      const fundProto = _grpc2.default.load(__dirname.concat('/fund.proto'));

      const sslServerCrtPath = _path2.default.join(__dirname, '../crt/server.crt');
      const sslServerKeyPath = _path2.default.join(__dirname, '../crt/server.key');
      const sslServerCrt = _fs2.default.readFileSync(sslServerCrtPath);
      const sslServerKey = _fs2.default.readFileSync(sslServerKeyPath);

      const sslCreds = _grpc2.default.ServerCredentials.createSsl(null, [{ private_key: sslServerKey, cert_chain: sslServerCrt }], true);

      const server = new _grpc2.default.Server();
      server.addProtoService(fundProto.fundPackage.FundService.service, _grpcFundMethods2.default);

      server.bind('0.0.0.0:50051', sslCreds);
      server.start();
    } catch (error) {
      debug('Error main(): %o', error);
    }
  });

  return function main() {
    return _ref2.apply(this, arguments);
  };
})();

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _grpc = require('grpc');

var _grpc2 = _interopRequireDefault(_grpc);

var _grpcFundMethods = require('./grpcFundMethods');

var _grpcFundMethods2 = _interopRequireDefault(_grpcFundMethods);

var _mongodb = require('./mongodb');

var _mongodb2 = _interopRequireDefault(_mongodb);

var _config = require('./config');

var _funds = require('./funds');

var _funds2 = _interopRequireDefault(_funds);

var _marketData = require('./marketData');

var _marketData2 = _interopRequireDefault(_marketData);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = (0, _debug2.default)('app');

main();