'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (config) {
  const {
    name,
    server
  } = config.datafeed;

  const debug = (0, _debug2.default)(`dataFeed ${ name }@${ server.ip }:${ server.port }@`);
  try {
    let dataFeed;

    switch (name) {
      case 'iceLive':
        dataFeed = (0, _swDatafeedIcelive2.default)(config);
        break;
      default:
        throw new Error('Missing dataFeed provider paramater');
    }

    return dataFeed;
  } catch (error) {
    debug('createDataFeed() Error: %o', error);
  }
};

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _swDatafeedIcelive = require('sw-datafeed-icelive');

var _swDatafeedIcelive2 = _interopRequireDefault(_swDatafeedIcelive);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }