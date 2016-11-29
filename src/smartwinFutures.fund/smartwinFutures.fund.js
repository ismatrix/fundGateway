import createDebug from 'debug';
import { throttle } from 'lodash';
import calculations from 'sw-fund-smartwin-futures-calculations';

export default function createSmartwinFuturesFund(config, broker, marketData) {
  const {
    fundid,
  } = config;
  const debug = createDebug(`smartwinFutures.fund:${fundid}`);
  debug('config %o', config);

  try {
    let ordersStore = [];
    let tradesStore = [];
    let accountStore = {};
    let positionsStore = [];
    let tradingdayStore = '';

    const init = async () => {
      try {
        debug('init()');
        broker.connect();

        [
          ordersStore,
          tradesStore,
          accountStore,
          positionsStore,
          tradingdayStore,
        ] = await Promise.all([
          broker.queryOrders(),
          broker.queryTrades(),
          broker.queryAccount(),
          broker.queryPositions(),
          broker.getTradingday(),
        ]);
        debug('init() ordersStore %o', ordersStore);
        debug('init() tradesStore %o', tradesStore);
        debug('init() accountStore %o', accountStore);
        debug('init() positionsStore %o', positionsStore);
        debug('init() tradingdayStore %o', tradingdayStore);
      } catch (error) {
        debug('Error init() %o', error);
      }
    };

    broker
      .on('broker:order', (data) => { ordersStore.push(data); })
      .on('broker:trade', (data) => { tradesStore.push(data); })
      .on('broker:account', (data) => { accountStore = data; })
      .on('broker:positions', (data) => {
        positionsStore = data;
      })
      .on('broker:tradingday', async (data) => {
        const previousMemoryTradingday = tradingdayStore;

        await init();

        debug('%o : broker:tradingday %o, previousMemoryTradingday %o, tradingdayStore %o', new Date(), data, previousMemoryTradingday, tradingdayStore);
        if (data !== previousMemoryTradingday) {
          debug('pushing tradingday %o', data);
          broker.emit('fund:tradingday', data);
        }
      })
      .on('broker:connect:success', async () => {
        debug('broker:connect:success, start init()');
        await init();
      })
      ;

    const getOrders = () => {
      try {
        const orders = ordersStore.map(elem => Object.assign({}, elem));
        return orders;
      } catch (error) {
        debug('Error getOrders() %o', error);
        throw error;
      }
    };

    const getTrades = () => {
      try {
        const trades = tradesStore.map(elem => Object.assign({}, elem));
        return trades;
      } catch (error) {
        debug('Error getTrades() %o', error);
        throw error;
      }
    };

    const getAccount = () => {
      try {
        const account = Object.assign({}, accountStore);
        return account;
      } catch (error) {
        debug('Error getAccount() %o', error);
        throw error;
      }
    };

    const getPositions = () => {
      try {
        const positions = positionsStore.map(elem => Object.assign({}, elem));
        return positions;
      } catch (error) {
        debug('Error getPositions() %o', error);
        throw error;
      }
    };

    const calcLivePositions = async () => {
      try {
        const positions = getPositions();

        const subs = positions
          .filter(position => position.position !== 0)
          .map(position => ({
            symbol: position.instrumentid,
            resolution: 'snapshot',
            dataType: 'marketDepth',
          }))
          ;
        debug('subs from positions %o', subs);
        const symbols = positions.map(position => position.instrumentid);

        const [mdStore, instrumentsRes] = await Promise.all([
          marketData.getLastMarketDepths(subs),
          marketData.getInstruments(symbols),
        ]);

        if ('marketDepths' in mdStore) {
          debug('marketDephts: %o', mdStore.marketDepths.map(({ symbol, dataType }) => ({ symbol, dataType })));
        }
        if ('instruments' in instrumentsRes) {
          debug('instruments: %o', instrumentsRes.instruments.map(({ instrumentid, volumemultiple }) => ({ instrumentid, volumemultiple })));
        }

        const livePositions = positions.map((position) => {
          const marketDepth = mdStore.marketDepths.find(
            elem => elem.symbol === position.instrumentid);

          const instrument = instrumentsRes.instruments.find(
            elem => elem.instrumentid === position.instrumentid);

          if (marketDepth !== undefined && instrument !== undefined) {
            position.positionprofit = calculations.calcPositionProfit(
              position, marketDepth, instrument);
            debug('position.positionprofit %o', position.positionprofit);
          }

          return position;
        });

        return livePositions;
      } catch (error) {
        debug('Error calcLivePositions() %o', error);
        throw error;
      }
    };

    const throttledCalcLivePositions = throttle(calcLivePositions, 5000);

    const getLivePositions = async () => {
      try {
        debug('getLivePositions');
        const livePositions = throttledCalcLivePositions();

        return livePositions;
      } catch (error) {
        debug('Error getLivePositions() %o', error);
        throw error;
      }
    };

    const getLiveAccount = async () => {
      try {
        const liveAccount = getAccount();
        const livePositions = await getLivePositions();

        liveAccount.positionprofit = calculations.calcPositionsProfit(livePositions);
        liveAccount.balance = calculations.calcAccountBalance(liveAccount);

        return liveAccount;
      } catch (error) {
        debug('Error getLiveAccount() %o', error);
        throw error;
      }
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
