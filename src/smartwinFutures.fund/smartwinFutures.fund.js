import { throttle } from 'lodash';
import calculations from 'sw-fund-smartwin-futures-calculations';
import crud from 'sw-mongodb-crud';
import { redis } from '../redis';
import logger from 'sw-common';

export default function createSmartwinFuturesFund(config, broker, marketData) {
  const {
    fundid,
  } = config;

  const POSITIONS_CACHE_TIME = 5000;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  logger.info('config %j', config);

  try {
    let ordersStore = [];
    let tradesStore = [];
    let accountStore = {};
    let positionsStore = [];
    let tradingdayStore = '';

    let dbFundStore = {};
    let dbEquityStore = {};
    let dbTotalStore = {};
    let dbProductStore = [];

    let allPeriodsDrawdownReportStore = {};

    const init = async () => {
      try {
        logger.error('init()');
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
        logger.info('init() ordersStore %j', ordersStore);
        logger.info('init() tradesStore %j', tradesStore);
        logger.error('init() accountStore %j', accountStore);
        logger.info('init() positionsStore %j', positionsStore);
        logger.error('init() tradingdayStore %j', tradingdayStore);

        let equities = [];
        let intraDayNetValues = {};
        [
          dbFundStore,
          dbEquityStore,
          dbTotalStore,
          dbProductStore,
          equities,
          intraDayNetValues,
        ] = await Promise.all([
          crud.fund.get(fundid),
          crud.equity.get(fundid, tradingdayStore),
          crud.equity.getTotal(fundid, tradingdayStore),
          crud.product.getList(),
          crud.equity.getList({ fundid }),
          crud.netvalue.get(fundid, tradingdayStore),
        ]);

        const pastDaysNetValues =
          calculations.createNetValueAndEquityReports(equities, dbFundStore)
          .map(report => report.netvalue);
        allPeriodsDrawdownReportStore =
          calculations.createAllPeriodsDrawdownReport(pastDaysNetValues);

        if (intraDayNetValues && 'netvalues' in intraDayNetValues) {
          const todayDrawdownReport = calculations.createAllPeriodsDrawdownReport(
            intraDayNetValues.netvalues.map(e =>
              ({ open: e[1], high: e[1], low: e[1], last: e[1] })),
          );
          allPeriodsDrawdownReportStore.today = todayDrawdownReport.history;
          logger.info('init() todayDrawdownReport %j', todayDrawdownReport);
        }

        logger.info('init() dbFundStore %j', dbFundStore);
        logger.info('init() dbEquityStore %j', dbEquityStore);
        logger.info('init() dbTotalStore %j', dbTotalStore);
        logger.info('init() allPeriodsDrawdownReportStore %j', allPeriodsDrawdownReportStore);
      } catch (error) {
        logger.error('init() %j', error);
        throw error;
      }
    };

    const initOnNewTradingday = async () => {
      try {
        logger.info('initOnNewTradingday()');
        allPeriodsDrawdownReportStore.today.peak = -1;
        allPeriodsDrawdownReportStore.today.maxDrawdown = 0;
        allPeriodsDrawdownReportStore.today.currentDrawdown = 0;
      } catch (error) {
        logger.error('initOnNewTradingday() %j', error);
        throw error;
      }
    };

    broker
      .on('order', async (data) => {
        try {
          logger.error('broker.on(order) %j', data);
          ordersStore.push(data);
          const subID = redis.joinSubKeys(config.broker.name, fundid, 'order');
          await redis.publishAsync(redis.join(redis.SUBID_BROKERDATA, subID), JSON.stringify(data));
        } catch (error) {
          logger.error('broker.on(order) %j', error);
        }
      })
      .on('trade', async (data) => {
        try {
          tradesStore.push(data);
          const subID = redis.joinSubKeys(config.broker.name, fundid, 'trade');
          await redis.publishAsync(redis.join(redis.SUBID_BROKERDATA, subID), JSON.stringify(data));
        } catch (error) {
          logger.error('broker.on(trade) %j', error);
        }
      })
      .on('account', async (data) => {
        try {
          accountStore = data;
          const subID = redis.joinSubKeys(config.broker.name, fundid, 'account');
          await redis.publishAsync(redis.join(redis.SUBID_BROKERDATA, subID), JSON.stringify(data));
        } catch (error) {
          logger.error('broker.on(account) %j', error);
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
          logger.error('broker.on(positions) %j', error);
        }
      })
      .on('tradingday', async (data) => {
        try {
          const beforeInitTradingday = tradingdayStore;
          logger.error('broker.on(tradingday): broker:tradingday %j, beforeInitTradingday %j', fundid, data.tradingday, beforeInitTradingday);

          await init();

          const subID = redis.joinSubKeys(config.broker.name, fundid, 'tradingday');

          if (data.tradingday !== beforeInitTradingday) {
            await sleep(POSITIONS_CACHE_TIME * 2);
            await redis.publishAsync(
                redis.join(redis.SUBID_BROKERDATA, subID), JSON.stringify(data));
            await initOnNewTradingday();
          }
        } catch (error) {
          logger.error('broker.on(tradingday) %j', error);
        }
      })
      .on('connect:success', async () => {
        try {
          logger.error('broker:connect:success, call init()');
          await init();
        } catch (error) {
          logger.error('broker.on(connect:success) %j', error);
        }
      })
      .on('error', error => logger.error('broker.on(error) %j', error))
      ;

    const placeOrder = async (order) => {
      try {
        logger.error('order: %j', order);
        if (!['limitPrice', '1'].includes(order.ordertype)) {
          try {
            const subscriptions = [{
              symbol: order.instrumentid,
              resolution: 'snapshot',
              dataType: 'marketDepth',
            }];

            const lastMDsResponse = await marketData.getLastMarketDepths({ subscriptions });
            const lastMD = lastMDsResponse.marketDepths[0];
            logger.info('placeOrder getLastMarketDepths: %j', lastMD);

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
            logger.error('placeOrder(): %j', error);
            throw new Error(`Failed to get ${order.ordertype}`);
          }
        }

        if (order.exchangeid === '') {
          const product = dbProductStore.find(
            p => p.productid === order.instrumentid.replace(/[0-9]/g, ''));
          logger.error('product %j', product);
          order.exchangeid = product.exchangeid;
          logger.info('exchangeid %j', order.exchangeid);
        }

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
        logger.info('positionToClose: %j', positionToClose);

        if (order.offsetflag === 'close') {
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
              // Priotity to close yesterday positions if quantity sufficient
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
        } else if (order.offsetflag === 'closeyesterday') {
          order.volume = Math.min(order.volume, positionToClose.preholdposition);
        } else if (order.offsetflag === 'closetoday') {
          order.volume = Math.min(order.volume, positionToClose.todayholdposition);
        }

        const privatenoInt = await broker.order(order);

        const privateno = privatenoInt.toString();
        const placeOrderResponse = { privateno };

        return placeOrderResponse;
      } catch (error) {
        logger.error('placeOrder(): %j', error);
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
        logger.info('query mdGateway for positions symbols: %j', symbols);

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

        logger.info('marketDephts: %j', marketDepths.map(({ symbol, dataType }) => ({ symbol, dataType })));
        logger.info('instruments: %j', instrumentsRes.instruments.map(({ instrumentid, volumemultiple }) => ({ instrumentid, volumemultiple })));

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
        logger.error('calcLivePositions(): %j', error);
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
        logger.error('getLiveAccount(): %j', error);
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
        logger.error('getLiveEquity(): %j', error);
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
        logger.error('getNetValueAndEquityReport(): %j', error);
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
        logger.error('getPositionsLevelReport(): %j', error);
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
        logger.error('getPositionsLeverageReport(): %j', error);
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
        logger.error('getAllPeriodsDrawdownReport(): %j', error);
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
        logger.error('getCombinedReport(): %j', error);
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
    logger.error('createSmartwinFuturesFund(): %j', error);
    throw error;
  }
}
