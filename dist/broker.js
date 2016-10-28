'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createBroker;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _swBrokerIce = require('sw-broker-ice');

var _swBrokerIce2 = _interopRequireDefault(_swBrokerIce);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createBroker(config) {
  const {
    fundid
  } = config;
  const {
    name,
    server
  } = config.broker;

  const debug = (0, _debug2.default)(`${ fundid }@${ name }@${ server.ip }:${ server.port }@broker`);

  try {
    let broker;
    switch (name) {
      case 'ice':
        broker = (0, _swBrokerIce2.default)(config);
        break;
      default:
        throw new Error('Missing broker paramater');
    }

    return broker;
  } catch (error) {
    debug('Error createBroker(): %o', error);
  }
}