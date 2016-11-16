'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createSmartwinFuturesFund;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _swFundSmartwinFuturesCalculations = require('sw-fund-smartwin-futures-calculations');

var _swFundSmartwinFuturesCalculations2 = _interopRequireDefault(_swFundSmartwinFuturesCalculations);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function createSmartwinFuturesFund(config, broker, marketData) {
  const {
    fundid,
    serviceName
  } = config;
  const debug = (0, _debug2.default)(`${ fundid }@${ serviceName }.fund`);
  debug('config %o', config);

  try {
    const ordersStore = [];
    const tradesStore = [];
    let accountStore = {};
    let positionsStore = [];

    broker.on('order', data => {
      ordersStore.push(data);
    }).on('trade', data => {
      tradesStore.push(data);
    }).on('accountStore', data => {
      accountStore = data;
    }).on('positions', data => {
      positionsStore = data;
    });

    const init = (() => {
      var _ref = _asyncToGenerator(function* () {
        try {
          broker.connect();
        } catch (error) {
          debug('Error init() %o', error);
        }
      });

      return function init() {
        return _ref.apply(this, arguments);
      };
    })();

    const getOrders = () => {
      try {
        const orders = ordersStore.map(elem => Object.assign({}, elem));
        return orders;
      } catch (error) {
        debug('Error getOrders() %o', error);
      }
    };

    const getTrades = () => {
      try {
        const trades = tradesStore.map(elem => Object.assign({}, elem));
        return trades;
      } catch (error) {
        debug('Error getTrades() %o', error);
      }
    };

    const getAccount = () => {
      try {
        const account = Object.assign({}, accountStore);
        return account;
      } catch (error) {
        debug('Error getAccount() %o', error);
      }
    };

    const getPositions = () => {
      try {
        const positions = positionsStore.map(elem => Object.assign({}, elem));
        return positions;
      } catch (error) {
        debug('Error getPositions() %o', error);
      }
    };

    const getLivePositions = (() => {
      var _ref2 = _asyncToGenerator(function* () {
        try {
          const positions = getPositions();

          const subs = positions.map(function (position) {
            return {
              symbol: position.instrumentid,
              resolution: 'snapshot',
              dataType: 'marketDepth'
            };
          });
          debug('subs from positions %o', subs);
          const mdStore = yield marketData.getLastMarketDepths(subs);
          debug('mdStore %o', mdStore);

          if ('marketDepths' in mdStore) {
            debug('mdStore %o', mdStore.marketDepths.map(function ({ symbol, price }) {
              return { symbol, price };
            }));
          }

          const symbols = positions.map(function (position) {
            return position.instrumentid;
          });
          const instrumentsRes = yield marketData.getInstruments(symbols);
          debug('instruments %o', instrumentsRes.instruments.map(function ({ instrumentid, volumemultiple }) {
            return { instrumentid, volumemultiple };
          }));

          const livePositions = positions.map(function (position) {
            const marketDepth = mdStore.marketDepths.find(function (elem) {
              return elem.symbol === position.instrumentid;
            });
            // debug('marketData %o', marketData);
            const instrument = instrumentsRes.instruments.find(function (elem) {
              return elem.instrumentid === position.instrumentid;
            });
            // debug('instrument %o', instrument);
            if (marketData && instrument) {
              position.positionprofit = _swFundSmartwinFuturesCalculations2.default.calcPositionProfit(position, marketDepth, instrument);
            }

            return position;
          });

          return livePositions;
        } catch (error) {
          debug('Error getLivePositions() %o', error);
        }
      });

      function getLivePositions() {
        return _ref2.apply(this, arguments);
      }

      return getLivePositions;
    })();

    const getLiveAccount = (() => {
      var _ref3 = _asyncToGenerator(function* () {
        const livePositions = yield getLivePositions();
        const livePositionsProfit = livePositions.reduce(function (acc, cur) {
          return acc + cur.positionprofit;
        }, 0);

        const liveAccount = getLiveAccount();
        if (livePositionsProfit !== 0) liveAccount.positionsProfit = livePositionsProfit;
        return liveAccount;
      });

      return function getLiveAccount() {
        return _ref3.apply(this, arguments);
      };
    })();

    const fundBase = {
      config,
      fundid,
      init,
      getOrders,
      getTrades,
      getAccount,
      getPositions,
      getLiveAccount,
      getLivePositions
    };
    const fund = Object.assign(Object.create(broker), fundBase);
    return fund;
  } catch (error) {
    debug('Error createSmartwinFuturesFund(): %o', error);
  }
}