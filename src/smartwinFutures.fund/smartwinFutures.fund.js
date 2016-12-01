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
          dbTotalStore.totalDividendNetValue,
          dbTotalStore.totalFixedIncome,
          dbTotalStore.totalFixedIncomeReturns,
          dbTotalStore.totalCostOut,
          dbTotalStore.totalAppendShare,
          dbTotalStore.totalRedemptionShare,
        ] = await Promise.all([
          fundDB.get(fundid),
          equityDB.get(fundid, tradingdayStore),
          equityDB.getTotalDividendNetValue(fundid, tradingdayStore),
          equityDB.getTotalFixedIncome(fundid, tradingdayStore),
          equityDB.getTotalFixedIncomeReturns(fundid, tradingdayStore),
          equityDB.getTotalCostOut(fundid, tradingdayStore),
          equityDB.getTotalAppendShare(fundid, tradingdayStore),
          equityDB.getTotalRedemptionShare(fundid, tradingdayStore),
        ]);
        debug('init() dbFundStore %o', dbFundStore);
        debug('init() dbEquityStore %o', dbEquityStore);
        debug('init() dbTotalStore %o', dbTotalStore);
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

    const getFund = () => {
      try {
        const fund = Object.assign({}, dbFundStore);
        return fund;
      } catch (error) {
        logError('getFund() %o', error);
        throw error;
      }
    };

    const getEquity = () => {
      try {
        const equity = Object.assign({}, dbEquityStore);
        return equity;
      } catch (error) {
        logError('getEquity() %o', error);
        throw error;
      }
    };

    const getTotal = () => {
      try {
        const total = Object.assign({}, dbTotalStore);
        return total;
      } catch (error) {
        logError('getTotal() %o', error);
        throw error;
      }
    };

    const calcLivePositions = async () => {
      try {
        const positions = getPositions();
        const account = getAccount();

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

        if (!('marketDepths' in mdStore) || !('instruments' in instrumentsRes)) {
          return positions;
        }

        debug('marketDephts: %o', mdStore.marketDepths.map(({ symbol, dataType }) => ({ symbol, dataType })));
        debug('instruments: %o', instrumentsRes.instruments.map(({ instrumentid, volumemultiple }) => ({ instrumentid, volumemultiple })));

        const livePositions = calculations.positionsToLivePositions(
          positions,
          mdStore.marketDepths,
          instrumentsRes.instruments,
          account,
          dbEquityStore,
          dbTotalStore,
        );

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

    const calcLiveAccount = (account, livePositions) => {
      try {
        const liveAccount = calculations.accountToLiveAccount(account, livePositions);

        return liveAccount;
      } catch (error) {
        logError('calcLiveAccount() %o', error);
        throw error;
      }
    };

    const getLiveAccount = async () => {
      try {
        const account = getAccount();
        const livePositions = await getLivePositions();

        const liveAccount = calcLiveAccount(account, livePositions);

        return liveAccount;
      } catch (error) {
        logError('getLiveAccount() %o', error);
        throw error;
      }
    };

    const calcLiveEquity = (equity, liveAccount) => {
      try {
        const liveEquity = calculations.equityToLiveEquity(equity, liveAccount);

        return liveEquity;
      } catch (error) {
        logError('calcLiveEquity() %o', error);
        throw error;
      }
    };

    const getLiveEquity = async () => {
      try {
        const equity = getEquity();
        const liveAccount = await getLiveAccount();

        const liveEquity = calcLiveEquity(equity, liveAccount);

        return liveEquity;
      } catch (error) {
        logError('getLiveEquity() %o', error);
        throw error;
      }
    };

    const getLiveNetValueAndEquityReport = async () => {
      try {
        const tradingday = tradingdayStore;
        const fund = getFund();
        const total = getTotal();
        const liveEquity = await getLiveEquity();

        const liveNetValueAndEquityReport =
          calculations.getNetValueAndEquityReport(tradingday, fund, liveEquity, total);
        liveNetValueAndEquityReport.updatedate =
          calculations.dateToISOStringWithTimezone(liveNetValueAndEquityReport.updatedate);

        return liveNetValueAndEquityReport;
      } catch (error) {
        logError('getLiveNetValueAndEquityReport() %o', error);
        throw error;
      }
    };

    const getLivePositionsLevelReport = async () => {
      try {
        const livePositions = await getLivePositions();
        const account = getAccount();
        const liveAccount = calcLiveAccount(account, livePositions);
        const equity = getEquity();
        const total = getTotal();
        const realEquity = calculations.calcRealEquity(liveAccount, equity, total);

        const livePositionsLevelReport =
          calculations.getPositionsLevelReport(livePositions, realEquity);

        return livePositionsLevelReport;
      } catch (error) {
        logError('getLivePositionsLevelReport() %o', error);
        throw error;
      }
    };

    const getLivePositionsLeverageReport = async () => {
      try {
        const livePositions = await getLivePositions();

        const livePositionsLeverageReport =
          calculations.getPositionsLeverageReport(livePositions);

        return livePositionsLeverageReport;
      } catch (error) {
        logError('getLivePositionsLeverageReport() %o', error);
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
      getLivePositionsLevelReport,
      getLivePositionsLeverageReport,
    };
    const fund = Object.assign(Object.create(broker), fundBase);
    return fund;
  } catch (error) {
    logError('createSmartwinFuturesFund(): %o', error);
  }
}
