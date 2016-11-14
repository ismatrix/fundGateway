import createDebug from 'debug';

export default function createSmartwinFuturesFund(config, broker, marketData) {
  const {
    fundid,
    serviceName,
  } = config;
  const debug = createDebug(`${fundid}@${serviceName}.fund`);
  debug('config %o', config);

  try {
    const ordersStore = [];
    const tradesStore = [];
    let accountStore = {};
    let positionsStore = [];

    broker
      .on('order', (data) => { ordersStore.push(data); })
      .on('trade', (data) => { tradesStore.push(data); })
      .on('accountStore', (data) => { accountStore = data; })
      .on('positions', (data) => {
        positionsStore = data;
      });

    const init = async () => {
      try {
        broker.connect();
      } catch (error) {
        debug('Error init() %o', error);
      }
    };

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

        const subs = positions.map(position => ({
          symbol: position.instrumentid,
          resolution: 'snapshot',
          dataType: 'marketDepth',
        }));
        debug('subs from positions %o', subs);
        const mdStore = await marketData.getLastMarketDepths(subs);
        debug('mdStore %o', mdStore);

        if ('marketDepths' in mdStore) {
          debug('mdStore %o', mdStore.marketDepths.map(({ symbol, price }) => ({ symbol, price })));
        }

        const symbols = positions.map(position => position.instrumentid);
        const instrumentsRes = await marketData.getInstruments(symbols);
        debug('instruments %o', instrumentsRes.instruments.map(({ instrumentid, volumemultiple }) => ({ instrumentid, volumemultiple })));

        const livePositions = this.calcLivePositions({
          positions,
          marketDatas: mdStore.marketDepths,
          instruments: instrumentsRes.instruments,
        });

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
      config,
      fundid,
      init,
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
    debug('Error createSmartwinFuturesFund(): %o', error);
  }
}
