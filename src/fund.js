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
    const orders = [];
    const trades = [];
    let account = {};
    let positions = [];

    const broker = createBroker(config);
    broker
      .on('order', (data) => { orders.push(data); })
      .on('trade', (data) => { trades.push(data); })
      .on('account', (data) => { account = data; })
      .on('positions', (data) => {
        positions = data;
        funds.allPositionsToMdSubscriptions();
      });

    const getOrders = () => {
      const ordersCopy = orders.map(elem => Object.assign({}, elem));
      return ordersCopy;
    };

    const getTrades = () => {
      const tradesCopy = trades.map(elem => Object.assign({}, elem));
      return tradesCopy;
    };

    const getAccount = () => {
      const accountCopy = Object.assign({}, account);
      return accountCopy;
    };

    const getPositions = () => {
      const positionsCopy = positions.map(elem => Object.assign({}, elem));
      return positionsCopy;
    };

    const getLivePositions = () => {
      // const mdStore = marketData.getMarketDataStore();
      //  Todo
      const livePositions = getPositions().map((elem) => {
        debug('map');
        return elem;
      });
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
