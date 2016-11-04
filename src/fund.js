import createDebug from 'debug';
import createBroker from './broker';
import funds from './funds';
import marketDatas from './marketDatas';

export default function createFund(config) {
  const {
    fundid,
  } = config;
  const debug = createDebug(`${fundid}@fund`);
  debug('config %o', config);

  const marketData = marketDatas.getMarketData(config.marketData);

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
      });

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

    const getLivePositions = async function getLivePositions() {
      try {
        const positions = getPositions();
        debug('positions %o', positions);
        const subs = positions.map(position => ({
          symbol: position.instrumentid,
          resolution: 'snapshot',
          dataType: 'ticker',
        }));
        debug('subs %o', subs);
        const mdStore = await marketData.getLastTickersAsync(subs);
        debug('mdStore %o', mdStore);
        const symbols = positions.map(position => position.instrumentid);

        const instrumentSpecs = await marketData.getInstrumentsAsync(symbols);

        const livePositions = this.calcLivePositions({
          positions,
          mdStore: mdStore.tickers,
          instrumentSpecs: instrumentSpecs.instruments,
        });
        debug('livePositions %o', livePositions);
        return livePositions;
      } catch (error) {
        debug('Error getLivePositions() %o', error);
      }
    };

    const getLiveAccount = async () => {
      const livePositions = await getLivePositions();
      const livePositionsProfit = livePositions
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
