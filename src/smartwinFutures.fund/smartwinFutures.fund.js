import createDebug from 'debug';
import { throttle } from 'lodash';
import calculations from 'sw-fund-smartwin-futures-calculations';

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
    let livePositionsStore = [];

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

    const calcLivePositions = async () => {
      try {
        const positions = getPositions();

        const subs = positions.map(position => ({
          symbol: position.instrumentid,
          resolution: 'snapshot',
          dataType: 'marketDepth',
        }));
        debug('subs from positions %o', subs);
        const symbols = positions.map(position => position.instrumentid);

        const mdGatewayReturns = await Promise.all([
          marketData.getLastMarketDepths(subs),
          marketData.getInstruments(symbols),
        ]);
        const mdStore = mdGatewayReturns[0];
        const instrumentsRes = mdGatewayReturns[1];

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
          }

          return position;
        });

        return livePositions;
      } catch (error) {
        debug('Error calcLivePositions() %o', error);
      }
    };

    const throttledCalcLivePositions = throttle(calcLivePositions, 10000);

    const getLivePositions = async function getLivePositions() {
      try {
        debug('getLivePositions');
        const livePositions = throttledCalcLivePositions();

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
