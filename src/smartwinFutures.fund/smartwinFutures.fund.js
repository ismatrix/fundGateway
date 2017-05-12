import createDebug from 'debug';
import { throttle } from 'lodash';
import calculations from 'sw-fund-smartwin-futures-calculations';
import crud from 'sw-mongodb-crud';
import { redis } from '../redis';

export default function createSmartwinFuturesFund(config, broker, marketData) {
  const {
    fundid,
  } = config;

  const debug = createDebug(`app:smartwinFutures.fund:${fundid}`);
  const logError = createDebug(`app:smartwinFutures.fund:${fundid}:error`);
  logError.log = console.error.bind(console);
  const POSITIONS_CACHE_TIME = 5000;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

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

    let allPeriodsDrawdownReportStore = {};

    const init = async () => {
      try {
        logError('init()');
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
        logError('init() accountStore %o', accountStore);
        debug('init() positionsStore %o', positionsStore);
        logError('init() tradingdayStore %o', tradingdayStore);

        let equities = [];
        let intraDayNetValues = [];
        [
          dbFundStore,
          dbEquityStore,
          dbTotalStore,
          equities,
          intraDayNetValues,
        ] = await Promise.all([
          crud.fund.get(fundid),
          crud.equity.get(fundid, tradingdayStore),
          crud.equity.getTotal(fundid, tradingdayStore),
          crud.equity.getList({ fundid }),
          crud.netvalue.get(fundid, tradingdayStore),
        ]);

        const pastDaysNetValues =
          calculations.createNetValueAndEquityReports(equities, dbFundStore)
          .map(report => report.netvalue);
        allPeriodsDrawdownReportStore =
          calculations.createAllPeriodsDrawdownReport(pastDaysNetValues);
        const todayDrawdownReport = calculations.createAllPeriodsDrawdownReport(
          intraDayNetValues.netvalues.map(e => ({ open: e[1], high: e[1], low: e[1], last: e[1] })),
        );
        allPeriodsDrawdownReportStore.today = todayDrawdownReport.history;
        debug('init() dbFundStore %o', dbFundStore);
        debug('init() dbEquityStore %o', dbEquityStore);
        debug('init() dbTotalStore %o', dbTotalStore);
        debug('init() allPeriodsDrawdownReportStore %o', allPeriodsDrawdownReportStore);
        debug('init() todayDrawdownReport %o', todayDrawdownReport);
      } catch (error) {
        logError('init() %o', error);
        throw error;
      }
    };

    const initOnNewTradingday = async () => {
      try {
        debug('initOnNewTradingday()');
        allPeriodsDrawdownReportStore.today.peak = -1;
        allPeriodsDrawdownReportStore.today.maxDrawdown = 0;
        allPeriodsDrawdownReportStore.today.currentDrawdown = 0;
      } catch (error) {
        logError('initOnNewTradingday() %o', error);
        throw error;
      }
    };

    broker
      .on('order', async (data) => {
        try {
          logError('broker.on(order) %o', data);
          ordersStore.push(data);
          const subID = redis.joinSubKeys(config.broker.name, fundid, 'order');
          await redis.publishAsync(redis.join(redis.SUBID_BROKERDATA, subID), JSON.stringify(data));
        } catch (error) {
          logError('broker.on(order) %o', error);
        }
      })
      .on('trade', async (data) => {
        try {
          tradesStore.push(data);
          const subID = redis.joinSubKeys(config.broker.name, fundid, 'trade');
          await redis.publishAsync(redis.join(redis.SUBID_BROKERDATA, subID), JSON.stringify(data));
        } catch (error) {
          logError('broker.on(trade) %o', error);
        }
      })
      .on('account', async (data) => {
        try {
          accountStore = data;
          const subID = redis.joinSubKeys(config.broker.name, fundid, 'account');
          await redis.publishAsync(redis.join(redis.SUBID_BROKERDATA, subID), JSON.stringify(data));
        } catch (error) {
          logError('broker.on(account) %o', error);
        }
      })
      .on('positions', async (data) => {
        try {
          positionsStore = data;
          const subID = redis.joinSubKeys(config.broker.name, fundid, 'positions');
          await redis.publishAsync(
            redis.join(redis.SUBID_BROKERDATA, subID),
            JSON.stringify({ positions: data }),
          );
        } catch (error) {
          logError('broker.on(positions) %o', error);
        }
      })
      .on('tradingday', async (data) => {
        try {
          const beforeInitTradingday = tradingdayStore;
          logError('broker.on(tradingday): broker:tradingday %o, beforeInitTradingday %o', fundid, data.tradingday, beforeInitTradingday);

          await init();

          const subID = redis.joinSubKeys(config.broker.name, fundid, 'tradingday');

          if (data.tradingday !== beforeInitTradingday) {
            await sleep(POSITIONS_CACHE_TIME * 2);
            await redis.publishAsync(
                redis.join(redis.SUBID_BROKERDATA, subID), JSON.stringify(data));
            await initOnNewTradingday();
          }
        } catch (error) {
          logError('broker.on(tradingday) %o', error);
        }
      })
      .on('connect:success', async () => {
        try {
          logError('broker:connect:success, call init()');
          await init();
        } catch (error) {
          logError('broker.on(connect:success) %o', error);
        }
      })
      .on('error', error => logError('broker.on(error) %o', error))
      ;

    const placeOrder = async (order) => {
      try {
        debug('order: %o', order);
        if (!['limitPrice', '1'].includes(order.ordertype)) {
          try {
            const subscriptions = [{
              symbol: order.instrumentid,
              resolution: 'snapshot',
              dataType: 'marketDepth',
            }];

            const lastMDsResponse = await marketData.getLastMarketDepths({ subscriptions });
            const lastMD = lastMDsResponse.marketDepths[0];
            debug('placeOrder getLastMarketDepths: %o', lastMD);

            if (['marketPrice', '0'].includes(order.ordertype)) {
              order.price = order.direction === 'buy' ? lastMD.askPrice1 : lastMD.bidPrice1;
            } else if (order.ordertype === 'bestPrice') {
              order.price = order.direction === 'buy' ? lastMD.askPrice1 : lastMD.bidPrice1;
            } else if (order.ordertype === 'lastPrice') {
              order.price = lastMD.lastPrice;
            } else if (order.ordertype === 'askPrice1') {
              order.price = lastMD.askPrice1;
            } else if (order.ordertype === 'bidPrice1') {
              order.price = lastMD.bidPrice1;
            } else {
              throw new Error(`Invalid order.ordertype: ${order.ordertype}`);
            }

            order.ordertype = '1';
          } catch (error) {
            logError('placeOrder(): %o', error);
            throw new Error(`Failed to get ${order.ordertype}`);
          }
        }

        if (order.offsetflag === 'close') {
          const directionMap = { buy: 'short', sell: 'long' };

          const positionToClose = positionsStore.reduce((accu, position) => {
            if (position.instrumentid === order.instrumentid
            && position.direction === directionMap[order.direction]) {
              accu.preholdposition += position.preholdposition;
              accu.todayholdposition += position.todayholdposition;
            }
            return accu;
          }, {
            preholdposition: 0,
            todayholdposition: 0,
          });
          debug('positionToClose: %o', positionToClose);

          const totalVolume = positionToClose.preholdposition + positionToClose.todayholdposition;
          order.volume = Math.min(order.volume, totalVolume);

          if (positionToClose.preholdposition === 0 && positionToClose.todayholdposition === 0) {
            throw new Error(`No existing position for the symbol: ${order.instrumentid} WITH direction: ${directionMap[order.direction]}`);
          }

          if (order.exchangeid === 'SHFE') {
            if (positionToClose.preholdposition === 0) {
              // all positions are opened today
              order.offsetflag = 'closetoday';
            } else if (order.volume <= positionToClose.preholdposition) {
              // order volume to close will close positions opened yesterday
              order.offsetflag = 'closeyesterday';
            } else {
              // Need 2 orders to close all yesterday's positions + part of today's positions
              const yesterdayVolumeToClose = positionToClose.preholdposition;
              const todayVolumeToClose = order.volume - yesterdayVolumeToClose;

              const yesterdayPositionsOrder = Object.assign(
                {}, order, { offsetflag: 'closeyesterday', volume: yesterdayVolumeToClose });
              const todayPositionsOrder = Object.assign(
                {}, order, { offsetflag: 'closetoday', volume: todayVolumeToClose });

              const privatenoInts = await Promise.all([
                broker.order(yesterdayPositionsOrder),
                broker.order(todayPositionsOrder),
              ]);
              const placeOrderResponse = {
                privateno: privatenoInts.join(','),
              };

              return placeOrderResponse;
            }
          }
        }

        const privatenoInt = await broker.order(order);

        const privateno = privatenoInt.toString();
        const placeOrderResponse = { privateno };

        return placeOrderResponse;
      } catch (error) {
        logError('placeOrder(): %o', error);
        throw error;
      }
    };

    const getOrders = () => ordersStore.map(elem => Object.assign({}, elem));
    const getTrades = () => tradesStore.map(elem => Object.assign({}, elem));
    const getAccount = () => Object.assign({}, accountStore);
    const getPositions = () => positionsStore.map(elem => Object.assign({}, elem));
    const getFund = () => Object.assign({}, dbFundStore);
    const getEquity = () => Object.assign({}, dbEquityStore);
    const getTotal = () => Object.assign({}, dbTotalStore);

    const calcLivePositions = async () => {
      try {
        const positions = getPositions();
        const account = getAccount();
        const equity = getEquity();
        const total = getTotal();

        const subscriptions = positions
          .filter(position => position.position !== 0)
          .map(position => ({
            symbol: position.instrumentid,
            resolution: 'snapshot',
            dataType: 'marketDepth',
          }))
          ;

        if (subscriptions.length === 0) return positions;

        const symbols = positions.map(position => position.instrumentid);
        debug('query mdGateway for positions symbols: %o', symbols);

        const [mdStore, instrumentsRes] = await Promise.all([
          marketData.getLastMarketDepths({ subscriptions }),
          marketData.getMemoryInstruments({ symbols }),
        ]);

        if (!('marketDepths' in mdStore) || !('instruments' in instrumentsRes)) {
          return positions;
        }

        // If quote's tradingday is not current tradingday, update preSettlementPrice
        mdStore.marketDepths.forEach((marketDepth) => {
          if (marketDepth.tradingDay !== tradingdayStore) {
            marketDepth.preSettlementPrice = marketDepth.lastPrice;
          }
        });
        const marketDepths = mdStore.marketDepths;

        debug('marketDephts: %o', marketDepths.map(({ symbol, dataType }) => ({ symbol, dataType })));
        debug('instruments: %o', instrumentsRes.instruments.map(({ instrumentid, volumemultiple }) => ({ instrumentid, volumemultiple })));

        const livePositions = calculations.positionsToLivePositions(
          positions,
          marketDepths,
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

    const throttledCalcLivePositions = throttle(calcLivePositions, POSITIONS_CACHE_TIME);
    const getLivePositions = () => throttledCalcLivePositions();

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

    const updateAllPeriodsDrawdownReport = netValue =>
      calculations.updateAllPeriodsDrawdownReport(allPeriodsDrawdownReportStore, netValue);

    const getAllPeriodsDrawdownReport = async () => {
      try {
        const liveEquity = await getLiveEquity();
        const liveNetValueAndEquityReport = calcNetValueAndEquityReport(liveEquity);

        const allPeriodsDrawdownReport =
          updateAllPeriodsDrawdownReport(liveNetValueAndEquityReport.netvalue);

        return allPeriodsDrawdownReport;
      } catch (error) {
        logError('getAllPeriodsDrawdownReport(): %o', error);
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
        const allPeriodsDrawdownReport =
          updateAllPeriodsDrawdownReport(netValueAndEquityReport.netvalue);

        const liveCombinedReport = {
          positionsLevelReport,
          positionsLeverageReport,
          netValueAndEquityReport,
          allPeriodsDrawdownReport,
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
      placeOrder,
      getOrders,
      getTrades,
      getAccount,
      getPositions,
      getLiveAccount,
      getLivePositions,

      getNetValueAndEquityReport,
      getPositionsLevelReport,
      getPositionsLeverageReport,
      getAllPeriodsDrawdownReport,
      getCombinedReport,
    };
    const fund = Object.assign(Object.create(broker), fundBase);
    return fund;
  } catch (error) {
    logError('createSmartwinFuturesFund(): %o', error);
    throw error;
  }
}
