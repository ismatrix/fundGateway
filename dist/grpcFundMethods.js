'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

let getOrders = (() => {
  var _ref = _asyncToGenerator(function* (call, callback) {
    try {
      debug('call.metadata %o', call.metadata.get('Authorization'));
      yield (0, _acl2.default)(call, 'read', 'getOrders');

      const fund = _funds2.default.getFund(call.request.fundid);
      const orders = fund.getOrders();
      debug('orders %o', orders);
      callback(null, orders);
    } catch (error) {
      debug('Error getOrders(): %o', error);
      callback(error);
    }
  });

  return function getOrders(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

let getTrades = (() => {
  var _ref2 = _asyncToGenerator(function* (call, callback) {
    try {
      const fund = _funds2.default.getFund(call.request.fundid);
      const trades = fund.getTrades();
      debug('trades %o', trades);
      callback(null, trades);
    } catch (error) {
      debug('Error getTrades(): %o', error);
      callback(error);
    }
  });

  return function getTrades(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
})();

let getAccount = (() => {
  var _ref3 = _asyncToGenerator(function* (call, callback) {
    try {
      const fund = _funds2.default.getFund(call.request.fundid);
      const account = fund.getAccount();
      debug('account %o', account);
      callback(null, account);
    } catch (error) {
      debug('Error getAccount(): %o', error);
      callback(error);
    }
  });

  return function getAccount(_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
})();

let getPositions = (() => {
  var _ref4 = _asyncToGenerator(function* (call, callback) {
    try {
      const fund = _funds2.default.getFund(call.request.fundid);
      const positions = fund.getPositions();
      debug('positions %o', positions);
      callback(null, positions);
    } catch (error) {
      debug('Error getPositions(): %o', error);
      callback(error);
    }
  });

  return function getPositions(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
})();

let getLiveAccount = (() => {
  var _ref5 = _asyncToGenerator(function* (call, callback) {
    try {
      const fund = _funds2.default.getFund(call.request.fundid);
      const liveAccount = fund.getLiveAccount();
      debug('getLiveAccount %o', liveAccount);
      callback(null, liveAccount);
    } catch (error) {
      debug('Error getLiveAccount(): %o', error);
      callback(error);
    }
  });

  return function getLiveAccount(_x9, _x10) {
    return _ref5.apply(this, arguments);
  };
})();

let getLivePositions = (() => {
  var _ref6 = _asyncToGenerator(function* (call, callback) {
    try {
      const fund = _funds2.default.getFund(call.request.fundid);
      const livePositions = fund.getlivePositions();
      debug('getLiveAccount %o', livePositions);
      callback(null, livePositions);
    } catch (error) {
      debug('Error getLivePositions(): %o', error);
      callback(error);
    }
  });

  return function getLivePositions(_x11, _x12) {
    return _ref6.apply(this, arguments);
  };
})();

let placeOrder = (() => {
  var _ref7 = _asyncToGenerator(function* (call, callback) {
    try {
      const fund = _funds2.default.getFund(call.request.fundid);

      yield fund.order(call.request);

      callback(null, {});
    } catch (error) {
      debug('Error placeOrder(): %o', error);
      callback(error);
    }
  });

  return function placeOrder(_x13, _x14) {
    return _ref7.apply(this, arguments);
  };
})();

let cancelOrder = (() => {
  var _ref8 = _asyncToGenerator(function* (call, callback) {
    try {
      const fund = _funds2.default.getFund(call.request.fundid);

      const instrumentid = call.request.instrumentid;
      const privateno = call.request.privateno;
      const orderid = call.request.orderid;

      yield fund.cancelOrder(instrumentid, privateno, orderid);

      callback(null, {});
    } catch (error) {
      debug('Error cancelOrder(): %o', error);
      callback(error);
    }
  });

  return function cancelOrder(_x15, _x16) {
    return _ref8.apply(this, arguments);
  };
})();

let subscribeOrder = (() => {
  var _ref9 = _asyncToGenerator(function* (stream) {
    try {
      const fund = _funds2.default.getFund(stream.request.fundid);

      fund.on('order', function (eventData) {
        stream.write(eventData);
      });
    } catch (error) {
      debug('Error subscribeOrder(): %o', error);
    }
  });

  return function subscribeOrder(_x17) {
    return _ref9.apply(this, arguments);
  };
})();

let subscribeTrade = (() => {
  var _ref10 = _asyncToGenerator(function* (stream) {
    try {
      const fund = _funds2.default.getFund(stream.request.fundid);

      fund.on('trade', function (eventData) {
        stream.write(eventData);
      });
    } catch (error) {
      debug('Error subscribeTrade(): %o', error);
    }
  });

  return function subscribeTrade(_x18) {
    return _ref10.apply(this, arguments);
  };
})();

let subscribeAccount = (() => {
  var _ref11 = _asyncToGenerator(function* (stream) {
    try {
      const fund = _funds2.default.getFund(stream.request.fundid);

      fund.on('account', function (eventData) {
        stream.write(eventData);
      });
    } catch (error) {
      debug('Error subscribeAccount(): %o', error);
    }
  });

  return function subscribeAccount(_x19) {
    return _ref11.apply(this, arguments);
  };
})();

let subscribePositions = (() => {
  var _ref12 = _asyncToGenerator(function* (stream) {
    try {
      const fund = _funds2.default.getFund(stream.request.fundid);
      debug('subscribePositions fund: %o', fund);

      fund.on('positions', function (eventData) {
        stream.write(eventData);
      });
    } catch (error) {
      debug('Error subscribePositions(): %o', error);
    }
  });

  return function subscribePositions(_x20) {
    return _ref12.apply(this, arguments);
  };
})();

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _acl = require('./acl');

var _acl2 = _interopRequireDefault(_acl);

var _funds = require('./funds');

var _funds2 = _interopRequireDefault(_funds);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = (0, _debug2.default)('grpcFundMethods');

const fundMethods = {
  getOrders,
  getTrades,
  getAccount,
  getPositions,
  getLiveAccount,
  getLivePositions,
  placeOrder,
  cancelOrder,
  subscribeOrder,
  subscribeTrade,
  subscribeAccount,
  subscribePositions
};

exports.default = fundMethods;