'use strict';

let init = (() => {
  var _ref = _asyncToGenerator(function* () {
    try {
      yield Promise.all([].concat(_mongodb2.default.connect(_config.mongodbUrl), _config.fundConfigs.map(function (config) {
        return _funds2.default.addAndGetFund(config);
      })));
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
      yield init();

      const fundProto = _grpc2.default.load(__dirname.concat('/fundGateway.proto'));

      const credentialsName = _commander2.default.credentialsName || 'server';
      const sslServerCrtPath = _path2.default.join(__dirname, `../crt/${ credentialsName }.crt`);
      const sslServerKeyPath = _path2.default.join(__dirname, `../crt/${ credentialsName }.key`);
      const sslServerCrt = _fs2.default.readFileSync(sslServerCrtPath);
      const sslServerKey = _fs2.default.readFileSync(sslServerKeyPath);

      const sslCreds = _grpc2.default.ServerCredentials.createSsl(null, [{ private_key: sslServerKey, cert_chain: sslServerCrt }], true);

      const server = new _grpc2.default.Server();

      for (const config of _config.fundConfigs) {
        debug('config %o', config);
        server.addProtoService(fundProto[config.serviceName][(0, _lodash.upperFirst)(config.serviceName)].service, _fundGateway2.default[config.serviceName](config, _funds2.default));
      }

      server.bind(`${ grpcUrl }`, sslCreds);
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

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _lodash = require('lodash');

var _fundGateway = require('./fundGateway.grpc');

var _fundGateway2 = _interopRequireDefault(_fundGateway);

var _mongodb = require('./mongodb');

var _mongodb2 = _interopRequireDefault(_mongodb);

var _config = require('./config');

var _funds = require('./funds');

var _funds2 = _interopRequireDefault(_funds);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

_commander2.default.version('1.0.2').option('-c, --credentials-name [value]', 'the name of the server ssl credentials .crt/.key').parse(process.argv);

const grpcUrl = `${ _config.grpcConfig.ip }:${ _config.grpcConfig.port }`;
const debug = (0, _debug2.default)(`app ${ grpcUrl }`);

main();