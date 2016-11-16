'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _smartwinFuturesFund = require('./smartwinFutures.fund/smartwinFutures.fund.grpc');

var _smartwinFuturesFund2 = _interopRequireDefault(_smartwinFuturesFund);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const fundGatewayServices = {
  smartwinFuturesFund: _smartwinFuturesFund2.default
};

exports.default = fundGatewayServices;