import createDebug from 'debug';
import createBroker from './broker';
import funds from './funds';

export default function createFund(config) {
  const {
    fundid,
  } = config;
  const debug = createDebug(`${fundid}@fund`);
  debug('config %o', config);

  try {
    const ordersStore = [];
    const tradesStore = [];
    let accountStore = {};
    let positionsStore = [];

    const broker = createBroker(config);
    broker
      .on('order', (data) => { ordersStore.push(data); })
      .on('trade', (data) => { tradesStore.push(data); })
      .on('accountStore', (data) => { accountStore = data; })
      .on('positions', (data) => {
        positionsStore = data;
        funds.allPositionsToMdSubscriptions();
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
      const mdStore = marketData.getMarketData();
      const instrumentSpecs = marketData.getInstrumentSpecs();
      const positions = getPositions();

      const livePositions = this.calcLivePositions({ positions, mdStore, instrumentSpecs });

      return livePositions;
    };

    const getLiveAccount = () => {
      const livePositionsProfit = getLivePositions()
        .reduce((acc, cur) => acc + cur.positionprofit, 0);
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
      getLivePositions,
    };
    const fund = Object.assign(Object.create(broker), fundBase);
    return fund;
  } catch (error) {
    debug('Error createFund(): %o', error);
  }
}
