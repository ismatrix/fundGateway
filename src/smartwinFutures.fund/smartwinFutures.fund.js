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
    let dbTotalStore = {};

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
          dbTotalStore,
        ] = await Promise.all([
          fundDB.get(fundid),
          equityDB.get(fundid, tradingdayStore),
          equityDB.getTotal(fundid, tradingdayStore),
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
        logError('getOrders(): %o', error);
        throw error;
      }
    };

    const getTrades = () => {
      try {
        const trades = tradesStore.map(elem => Object.assign({}, elem));
        return trades;
      } catch (error) {
        logError('getTrades(): %o', error);
        throw error;
      }
    };

    const getAccount = () => {
      try {
        const account = Object.assign({}, accountStore);
        return account;
      } catch (error) {
        logError('getAccount(): %o', error);
        throw error;
      }
    };

    const getPositions = () => {
      try {
        const positions = positionsStore.map(elem => Object.assign({}, elem));
        return positions;
      } catch (error) {
        logError('getPositions(): %o', error);
        throw error;
      }
    };

    const getFund = () => {
      try {
        const fund = Object.assign({}, dbFundStore);
        return fund;
      } catch (error) {
        logError('getFund(): %o', error);
        throw error;
      }
    };

    const getEquity = () => {
      try {
        const equity = Object.assign({}, dbEquityStore);
        return equity;
      } catch (error) {
        logError('getEquity(): %o', error);
        throw error;
      }
    };

    const getTotal = () => {
      try {
        const total = Object.assign({}, dbTotalStore);
        return total;
      } catch (error) {
        logError('getTotal(): %o', error);
        throw error;
      }
    };

    const calcLivePositions = async () => {
      try {
        const positions = getPositions();
        const account = getAccount();
        const equity = getEquity();
        const total = getTotal();

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
          equity,
          total,
        );

        return livePositions;
      } catch (error) {
        logError('calcLivePositions(): %o', error);
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
        logError('getLivePositions(): %o', error);
        throw error;
      }
    };

    const calcLiveAccount = livePositions =>
      calculations.accountToLiveAccount(getAccount(), livePositions);

    const getLiveAccount = async () => {
      try {
        const livePositions = await getLivePositions();

        const liveAccount = calcLiveAccount(livePositions);

        return liveAccount;
      } catch (error) {
        logError('getLiveAccount(): %o', error);
        throw error;
      }
    };

    const calcRealEquity = liveBalance =>
      calculations.calcRealEquity(liveBalance, getEquity(), getTotal());

    const calcLiveEquity = liveAccount => calculations.equityToLiveEquity(getEquity(), liveAccount);

    const getLiveEquity = async () => {
      try {
        const liveAccount = await getLiveAccount();

        const liveEquity = calcLiveEquity(liveAccount);

        return liveEquity;
      } catch (error) {
        logError('getLiveEquity(): %o', error);
        throw error;
      }
    };

    const calcNetValueAndEquityReport = liveEquity =>
      calculations.getNetValueAndEquityReport(tradingdayStore, getFund(), liveEquity, getTotal());

    const getNetValueAndEquityReport = async () => {
      try {
        const liveEquity = await getLiveEquity();

        const liveNetValueAndEquityReport = calcNetValueAndEquityReport(liveEquity);

        return liveNetValueAndEquityReport;
      } catch (error) {
        logError('getNetValueAndEquityReport(): %o', error);
        throw error;
      }
    };

    const calcPositionsLevelReport = (livePositions, realEquity) =>
      calculations.getPositionsLevelReport(livePositions, realEquity);

    const getPositionsLevelReport = async () => {
      try {
        const livePositions = await getLivePositions();
        const liveAccount = calcLiveAccount(livePositions);
        const realEquity = calcRealEquity(liveAccount.balance);

        const livePositionsLevelReport = calcPositionsLevelReport(livePositions, realEquity);

        return livePositionsLevelReport;
      } catch (error) {
        logError('getPositionsLevelReport(): %o', error);
        throw error;
      }
    };

    const calcPositionsLeverageReport = livePositions =>
      calculations.getPositionsLeverageReport(livePositions);

    const getPositionsLeverageReport = async () => {
      try {
        const livePositions = await getLivePositions();

        const livePositionsLeverageReport = calcPositionsLeverageReport(livePositions);

        return livePositionsLeverageReport;
      } catch (error) {
        logError('getPositionsLeverageReport(): %o', error);
        throw error;
      }
    };

    const getCombinedReport = async () => {
      try {
        const livePositions = await getLivePositions();
        const liveAccount = calcLiveAccount(livePositions);
        const realEquity = calcRealEquity(liveAccount.balance);
        const liveEquity = calcLiveEquity(liveAccount);

        const positionsLevelReport = calcPositionsLevelReport(livePositions, realEquity);
        const positionsLeverageReport = calcPositionsLeverageReport(livePositions);
        const netValueAndEquityReport = calcNetValueAndEquityReport(liveEquity);

        const liveCombinedReport = {
          positionsLevelReport,
          positionsLeverageReport,
          netValueAndEquityReport,
        };

        return liveCombinedReport;
      } catch (error) {
        logError('getCombinedReport(): %o', error);
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

      getNetValueAndEquityReport,
      getPositionsLevelReport,
      getPositionsLeverageReport,
      getCombinedReport,
    };
    const fund = Object.assign(Object.create(broker), fundBase);
    return fund;
  } catch (error) {
    logError('createSmartwinFuturesFund(): %o', error);
    throw error;
  }
}
