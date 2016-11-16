'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

let addAndGetFund = (() => {
  var _ref = _asyncToGenerator(function* (config) {
    try {
      const existingFund = fundsArr.find(matchFund(config));
      if (existingFund !== undefined) return existingFund;

      const marketData = yield _marketDatas2.default.addAndGetMarketData(config.marketData);
      const broker = (0, _broker2.default)(config);

      let newFund;

      switch (config.serviceName) {
        case 'smartwinFuturesFund':
          newFund = (0, _smartwinFutures2.default)(config, broker, marketData);
          break;
        default:
          throw new Error('No fund interface for this serviceName');
      }

      yield newFund.init();

      fundsArr.push(newFund);
      return newFund;
    } catch (error) {
      debug('Error addFund(): %o', error);
    }
  });

  return function addAndGetFund(_x) {
    return _ref.apply(this, arguments);
  };
})();

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _broker = require('./broker');

var _broker2 = _interopRequireDefault(_broker);

var _marketDatas = require('./marketDatas');

var _marketDatas2 = _interopRequireDefault(_marketDatas);

var _smartwinFutures = require('./smartwinFutures.fund/smartwinFutures.fund');

var _smartwinFutures2 = _interopRequireDefault(_smartwinFutures);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = (0, _debug2.default)('funds');

const fundsArr = [];

const matchFund = newConfig => elem => elem.config.serviceName === newConfig.serviceName && elem.config.fundid === newConfig.fundid;

function getFund(config) {
  try {
    const {
      serviceName,
      fundid
    } = config;
    debug('getFund(%o)', { serviceName, fundid });
    const existingFund = fundsArr.find(matchFund(config));
    if (existingFund !== undefined) return existingFund;

    throw new Error('fund not found');
  } catch (error) {
    debug('Error getFund(): %o', error);
    throw error;
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

const funds = {
  addAndGetFund,
  getFund,
  getFunds,
  getFundsPositions
};

exports.default = funds;