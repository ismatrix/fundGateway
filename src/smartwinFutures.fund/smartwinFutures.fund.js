import createDebug from 'debug';
import { throttle } from 'lodash';
import calculations from 'sw-fund-smartwin-futures-calculations';
import {
  equity as equityDB,
  fund as fundDB,
} from 'sw-mongodb-crud';

export default function createSmartwinFuturesFund(config, broker, marketData) {
  const {
    fundid,
  } = config;

  const debug = createDebug(`app:smartwinFutures.fund:${fundid}`);
  const logError = createDebug(`app:smartwinFutures.fund:${fundid}:error`);
  logError.log = console.error.bind(console);

  debug('config %o', config);

  try {
    let ordersStore = [];
    let tradesStore = [];
    let accountStore = {};
    let positionsStore = [];
    let tradingdayStore = '';

    let dbFundStore = {};
    let dbEquityStore = {};
    const dbTotalStore = {};

    const liveEquityStore = {};

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

        [
          dbFundStore,
          dbEquityStore,
          dbTotalStore.totalFixedIncome,
          dbTotalStore.totalFixedIncomeReturns,
          dbTotalStore.totalCostOut,
          dbTotalStore.totalAppendShare,
          dbTotalStore.totalRedemptionShare,
        ] = await Promise.all([
          fundDB.get(fundid),
          equityDB.get(fundid, tradingdayStore),
          equityDB.getTotalFixedIncome(fundid, tradingdayStore),
          equityDB.getTotalFixedIncomeReturns(fundid, tradingdayStore),
          equityDB.getTotalCostOut(fundid, tradingdayStore),
          equityDB.getTotalAppendShare(fundid, tradingdayStore),
          equityDB.getTotalRedemptionShare(fundid, tradingdayStore),
        ]);
        debug('init() dbFundStore %o', dbFundStore);
        debug('init() dbEquityStore %o', dbEquityStore);
        debug('init() dbTotalStore %o', dbTotalStore);

        Object.assign(liveEquityStore, dbEquityStore);
      } catch (error) {
        logError('init() %o', error);
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

        debug(`${fundid}: ${new Date()}: broker:tradingday ${data}, previousMemoryTradingday ${previousMemoryTradingday}, tradingdayStore ${tradingdayStore}`);
        broker.emit('fund:tradingday', data);
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
        logError('getOrders() %o', error);
        throw error;
      }
    };

    const getTrades = () => {
      try {
        const trades = tradesStore.map(elem => Object.assign({}, elem));
        return trades;
      } catch (error) {
        logError('getTrades() %o', error);
        throw error;
      }
    };

    const getAccount = () => {
      try {
        const account = Object.assign({}, accountStore);
        return account;
      } catch (error) {
        logError('getAccount() %o', error);
        throw error;
      }
    };

    const getPositions = () => {
      try {
        const positions = positionsStore.map(elem => Object.assign({}, elem));
        return positions;
      } catch (error) {
        logError('getPositions() %o', error);
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
        logError('calcLivePositions() %o', error);
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
        logError('getLivePositions() %o', error);
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
        logError('getLiveAccount() %o', error);
        throw error;
      }
    };

    const updateLiveEquity = async () => {
      try {
        const liveAccount = await getLiveAccount();
        const lastEquity = liveAccount.balance;

        calculations.updateEquityBar(lastEquity, liveEquityStore);

        return liveAccount;
      } catch (error) {
        logError('getLiveAccount() %o', error);
        throw error;
      }
    };

    const getLiveEquity = async () => {
      try {
        await updateLiveEquity();
        const liveEquity = Object.assign({}, liveEquityStore);

        return liveEquity;
      } catch (error) {
        logError('getLiveEquity() %o', error);
        throw error;
      }
    };

    const getLiveNetValueAndEquityReport = async () => {
      try {
        const tradingday = tradingdayStore;
        const fundDBDoc = Object.assign({}, dbFundStore);
        const equityDBDoc = await getLiveEquity();
        const totalDoc = Object.assign({}, dbTotalStore);

        const liveNetValueAndEquityReport =
          calculations.getNetValueAndEquityReport(tradingday, fundDBDoc, equityDBDoc, totalDoc);

        return liveNetValueAndEquityReport;
      } catch (error) {
        logError('getLiveNetValueAndEquityReport() %o', error);
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
      getLiveNetValueAndEquityReport,
    };
    const fund = Object.assign(Object.create(broker), fundBase);
    return fund;
  } catch (error) {
    logError('createSmartwinFuturesFund(): %o', error);
  }
}
