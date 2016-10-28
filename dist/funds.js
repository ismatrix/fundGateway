'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

let addFund = (() => {
  var _ref = _asyncToGenerator(function* (config) {
    try {
      const {
        fundid
      } = config;

      if (fundsArr.map(function (elem) {
        return elem.fundid;
      }).includes(fundid)) return;

      const newFund = (0, _fund2.default)(config);
      newFund.config = config;

      fundsArr.push(newFund);
    } catch (error) {
      debug('Error addFund(): %o', error);
    }
  });

  return function addFund(_x) {
    return _ref.apply(this, arguments);
  };
})();

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _fund = require('./fund');

var _fund2 = _interopRequireDefault(_fund);

var _marketData = require('./marketData');

var _marketData2 = _interopRequireDefault(_marketData);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = (0, _debug2.default)('funds');

const fundsArr = [];

function getFund(fundid) {
  try {
    const theFund = fundsArr.find(elem => elem.fundid === fundid);
    if (theFund !== undefined) return theFund;

    throw new Error('fund not found');
  } catch (error) {
    debug('Error getFund(): %o', error);
  }
}

function getFunds() {
  try {
    return fundsArr;
  } catch (error) {
    debug('Error getFunds(): %o', error);
  }
}

function getFundsPositions() {
  try {
    const allFunds = getFunds();
    const allPositions = allFunds.map(elem => elem.getPositions()).reduce((acc, cur) => acc.concat(cur), []);
    return allPositions;
  } catch (error) {
    debug('Error get(): %o', error);
  }
}

function allPositionsToMdSubscriptions() {
  try {
    const allFundsPositions = getFundsPositions();
    debug('allFundsPositions %o', allFundsPositions);

    const allUniqueSymbols = allFundsPositions.map(elem => elem.instrumentid).filter((symbol, index, arr) => arr.indexOf(symbol) === index);
    debug('allUniqueSymbols %o', allUniqueSymbols);

    const needUnsubscribeSymbols = allUniqueSymbols.filter(symbol => !allFundsPositions.filter(fund => fund.instrumentid === symbol).reduce((acc, cur) => acc + cur.position, 0));
    debug('needUnsubscribeSymbols: %o', needUnsubscribeSymbols);
    needUnsubscribeSymbols.map(symbol => _marketData2.default.unsubscribe({
      symbol,
      resolution: 'tick'
    }));

    const needSubscribeSymbols = allUniqueSymbols.filter(symbol => !needUnsubscribeSymbols.includes(symbol));
    debug('needSubscribeSymbols: %o', needSubscribeSymbols);
    needSubscribeSymbols.map(symbol => _marketData2.default.subscribe({
      symbol,
      resolution: 'tick'
    }));
  } catch (error) {
    debug('Error allPositionsToMdSubscriptions(): %o', error);
  }
}

const funds = {
  getFund,
  getFunds,
  addFund,
  allPositionsToMdSubscriptions
};

exports.default = funds;