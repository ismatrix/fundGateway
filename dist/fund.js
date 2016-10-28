'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createFund;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _broker = require('./broker');

var _broker2 = _interopRequireDefault(_broker);

var _funds = require('./funds');

var _funds2 = _interopRequireDefault(_funds);

var _marketData = require('./marketData');

var _marketData2 = _interopRequireDefault(_marketData);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createFund(config) {
  const {
    fundid
  } = config;
  const debug = (0, _debug2.default)(`${ fundid }@fund`);
  debug('config %o', config);

  try {
    const ordersStore = [];
    const tradesStore = [];
    let accountStore = {};
    let positionsStore = [];

    const broker = (0, _broker2.default)(config);
    broker.on('order', data => {
      ordersStore.push(data);
    }).on('trade', data => {
      tradesStore.push(data);
    }).on('accountStore', data => {
      accountStore = data;
    }).on('positions', data => {
      positionsStore = data;
      _funds2.default.allPositionsToMdSubscriptions();
    });

    const getOrders = () => {
      const orders = ordersStore.map(elem => Object.assign({}, elem));
      return orders;
    };

    const getTrades = () => {
      const trades = tradesStore.map(elem => Object.assign({}, elem));
      return trades;
    };

    const getAccount = () => {
      const account = Object.assign({}, accountStore);
      return account;
    };

    const getPositions = () => {
      const positions = positionsStore.map(elem => Object.assign({}, elem));
      return positions;
    };

    const getLivePositions = () => {
      const mdStore = _marketData2.default.getMarketData();
      const instrumentSpecs = _marketData2.default.getInstrumentSpecs();
      const positions = getPositions();

      const livePositions = this.calcLivePositions({ positions, mdStore, instrumentSpecs });

      return livePositions;
    };

    const getLiveAccount = () => {
      const livePositionsProfit = getLivePositions().reduce((acc, cur) => acc + cur.positionprofit, 0);
      const liveAccount = getLiveAccount();
      if (livePositionsProfit !== 0) liveAccount.positionsProfit = livePositionsProfit;
      return liveAccount;
    };

    const fundBase = {
      fundid,
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
    debug('Error createFund(): %o', error);
  }
}