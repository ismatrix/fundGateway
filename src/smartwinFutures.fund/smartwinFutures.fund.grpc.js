import logger from 'sw-common';
import { difference } from 'lodash';
import can from 'sw-can';
import crud from 'sw-mongodb-crud';
import { redis, redisSub } from '../redis';

const grpcClientStreams = new Set();
let serviceName;
let funds;

async function removeSessionIDsWithoutOpenStream() {
  try {
    const grpcClientStreamsArr = Array.from(grpcClientStreams);
    const allLocalSessionIDs = grpcClientStreamsArr.map(elem => elem.sessionID);

    const allKeysHavingSessionIDs = await redis.keysAsync(redis.SUBID_SESSIONIDS.concat(redis.NSANDKEYSEP, '*'));

    if (allKeysHavingSessionIDs.length === 0) return;

    const allRedisSessionIDs = await redis.sunionAsync(...allKeysHavingSessionIDs);

    const orphanRedisSessionIDs = difference(allRedisSessionIDs, allLocalSessionIDs);
    if (orphanRedisSessionIDs.length === 0) return;

    logger.debug('orphanRedisSessionIDs %j', orphanRedisSessionIDs);

    const removeReport = await redis.multi(allKeysHavingSessionIDs.map(key => (['SREM', key, ...orphanRedisSessionIDs])))
      .execAsync()
      ;
    logger.debug('removeReport %j', removeReport);
  } catch (error) {
    logger.error('removeSessionIDsWithoutOpenStream(): %j', error);
    throw error;
  }
}
// On node restart, clear redisOrphanSessionIDs
setTimeout(removeSessionIDsWithoutOpenStream, 30000);

function createCallID(call) {
  const sessionid = call.metadata.get('sessionid')[0];
  const fundid = call.request.fundid;
  const peer = call.getPeer();
  const callID = `${peer}@${sessionid.substr(0, 6)}@${fundid}`;
  return callID;
}

function createBetterCallID(callID, ...args) {
  return [callID, ...args].join('@');
}

function streamToSubID(stream, brokerName) {
  const subID = redis.joinSubKeys(brokerName, stream.request.fundid, stream.dataType);
  return subID;
}

async function removeSessionIDFromAllSubIDsByDataType(sessionID, dataType) {
  try {
    const allSubIDSessionIDsKeys = await redis.keysAsync(redis.SUBID_SESSIONIDS.concat(redis.NSANDKEYSEP, '*'));
    logger.debug('allSubIDSessionIDsKeys %j', allSubIDSessionIDsKeys);

    const allDataTypeFilteredSessionIDs =
      allSubIDSessionIDsKeys.filter((fullKey) => {
        const [keyDataType] = redis.getFullKeyParts(fullKey, 'dataType');
        return keyDataType === dataType;
      });
    logger.debug('allDataTypeFilteredSessionIDs %j', allDataTypeFilteredSessionIDs);

    const isRemovedSessionID = await redis
      .multi(allDataTypeFilteredSessionIDs.map(elem => (['SREM', elem, sessionID])))
      .execAsync()
      ;

    const removedFromSessionIDs = allDataTypeFilteredSessionIDs.reduce((accu, curr, index) => {
      if (isRemovedSessionID[index]) accu.push(curr.substr(redis.SUBID_SESSIONIDS.length + 1));
      return accu;
    }, []);
    logger.debug('stream %j left these rooms %j', sessionID, removedFromSessionIDs);
    return removedFromSessionIDs;
  } catch (error) {
    logger.error('removeSessionIDFromAllSubIDsByDataType(): %j', error);
    throw error;
  }
}

redisSub.on('message', async (room, message) => {
  try {
    const [keyNamespace, key, dataType] = redis.getFullKeyParts(room, 'namespace', 'key', 'dataType');

    if (keyNamespace === redis.SUBID_BROKERDATA) {
      const subscribersSessionIDs =
        await redis.smembersAsync(redis.join(redis.SUBID_SESSIONIDS, key));

      grpcClientStreams.forEach((stream) => {
        if (
          stream.dataType === dataType
          && subscribersSessionIDs.includes(stream.sessionID)
        ) stream.write(JSON.parse(message));
      });
    }
  } catch (error) {
    logger.error('redisSub.on(message): %j', error);
  }
});

async function getOrders(call, callback) {
  const callID = createCallID(call);
  try {
    // const user = await can.grpc(call, 'get', 'fundid:all/basics');
    // const betterCallID = createBetterCallID(callID, user.userid);
    // logger.debug('getOrders(): grpcCall from callID: %j', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const orders = fund.getOrders();
    // logger.debug('orders %j', orders);

    callback(null, { orders });
  } catch (error) {
    logger.error('getOrders(): callID: %j, %j', callID, error);
    callback(error);
  }
}

async function getTrades(call, callback) {
  const callID = createCallID(call);
  try {
    // const user = await can.grpc(call, 'get', 'fundid:all/basics');
    // const betterCallID = createBetterCallID(callID, user.userid);
    // logger.debug('getTrades(): grpcCall from callID: %j', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const trades = fund.getTrades();
    // logger.debug('trades %j', trades);

    callback(null, { trades });
  } catch (error) {
    logger.error('getTrades(): callID: %j, %j', callID, error);
    callback(error);
  }
}

async function getAccount(call, callback) {
  const callID = createCallID(call);
  try {
    // const user = await can.grpc(call, 'get', 'fundid:all/basics');
    // const betterCallID = createBetterCallID(callID, user.userid);
    // logger.debug('getAccount(): grpcCall from callID: %j', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const account = fund.getAccount();
    // logger.debug('account %j', account);

    callback(null, account);
  } catch (error) {
    logger.error('getAccount(): callID: %j, %j', callID, error);
    callback(error);
  }
}

async function getPositions(call, callback) {
  const callID = createCallID(call);
  try {
    // const user = await can.grpc(call, 'get', 'fundid:all/basics');
    // const betterCallID = createBetterCallID(callID, user.userid);
    // logger.debug('getPositions(): grpcCall from callID: %j', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const positions = fund.getPositions();
    // logger.debug('positions %j', positions);

    callback(null, { positions });
  } catch (error) {
    logger.error('getPositions(): callID: %j, %j', callID, error);
    callback(error);
  }
}

async function getPastOrders(call, callback) {
  const callID = createCallID(call);
  try {
    // const user = await can.grpc(call, 'get', 'fundid:all/basics');
    // const betterCallID = createBetterCallID(callID, user.userid);
    // logger.debug('getPastOrders(): grpcCall from callID: %j', betterCallID);

    const fundid = call.request.fundid;
    const startDate = call.request.startDate.split('-').join();
    const endDate = call.request.endDate.split('-').join();

    const pastOrders = await crud.order.getList({
      fundid,
      tradingday: { $gte: startDate, $lte: endDate },
    });

    const orders = pastOrders.reduce((accu, curr) => accu.concat(curr.order), []);

    callback(null, { orders });
  } catch (error) {
    logger.error('getPastOrders(): callID: %j, %j', callID, error);
    callback(error);
  }
}

async function getPastTrades(call, callback) {
  const callID = createCallID(call);
  try {
    // const user = await can.grpc(call, 'get', 'fundid:all/basics');
    // const betterCallID = createBetterCallID(callID, user.userid);
    // logger.debug('getPastTrades(): grpcCall from callID: %j', betterCallID);

    const fundid = call.request.fundid;
    const startDate = call.request.startDate.split('-').join();
    const endDate = call.request.endDate.split('-').join();

    const pastTrades = await crud.done.getList({
      fundid,
      tradingday: { $gte: startDate, $lte: endDate },
    });

    const trades = pastTrades.reduce((accu, curr) => accu.concat(curr.done), []);
    // logger.debug('trades %j', trades);

    callback(null, { trades });
  } catch (error) {
    logger.error('getPastTrades(): callID: %j, %j', callID, error);
    callback(error);
  }
}

async function getPastAccounts(call, callback) {
  const callID = createCallID(call);
  try {
    // const user = await can.grpc(call, 'get', 'fundid:all/basics');
    // const betterCallID = createBetterCallID(callID, user.userid);
    // logger.debug('getPastAccounts(): grpcCall from callID: %j', betterCallID);

    const fundid = call.request.fundid;
    const startDate = call.request.startDate.split('-').join();
    const endDate = call.request.endDate.split('-').join();

    const pastAccounts = await crud.account.getList({
      fundid,
      tradingday: { $gte: startDate, $lte: endDate },
    });

    const accounts = pastAccounts.reduce((accu, curr) => accu.concat(curr.account), []);

    callback(null, { accounts });
  } catch (error) {
    logger.error('getPastAccounts(): callID: %j, %j', callID, error);
    callback(error);
  }
}

async function getPastPositions(call, callback) {
  const callID = createCallID(call);
  try {
    // const user = await can.grpc(call, 'get', 'fundid:all/basics');
    // const betterCallID = createBetterCallID(callID, user.userid);
    // logger.debug('getPastPositions(): grpcCall from callID: %j', betterCallID);

    const fundid = call.request.fundid;
    const startDate = call.request.startDate.split('-').join('');
    const endDate = call.request.endDate.split('-').join('');

    const pastPositions = await crud.position.getList({
      fundid,
      tradingday: { $gte: startDate, $lte: endDate },
    });

    const positions = pastPositions.reduce((accu, curr) => {
      curr.positions.forEach((pos) => { pos.tradingday = curr.tradingday; });
      return accu.concat(curr.positions);
    }, []);

    callback(null, { positions });
  } catch (error) {
    logger.error('getPastPositions(): callID: %j, %j', callID, error);
    callback(error);
  }
}

async function getLiveAccount(call, callback) {
  const callID = createCallID(call);
  try {
    // const user = await can.grpc(call, 'get', 'fundid:all/basics');
    // const betterCallID = createBetterCallID(callID, user.userid);
    // logger.debug('getLiveAccount(): grpcCall from callID: %j', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const liveAccount = await fund.getLiveAccount();
    // logger.debug('liveAccount %j', liveAccount);

    callback(null, liveAccount);
  } catch (error) {
    logger.error('getLiveAccount(): callID: %j, %j', callID, error);
    callback(error);
  }
}

async function getLivePositions(call, callback) {
  const callID = createCallID(call);
  try {
    // const user = await can.grpc(call, 'get', 'fundid:all/basics');
    // const betterCallID = createBetterCallID(callID, user.userid);
    // logger.debug('getLivePositions(): grpcCall from callID: %j', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const livePositions = await fund.getLivePositions();
    // logger.debug('livePositions %j',
      // livePositions.map(({ instrumentid, positionprofit, positionprofitbytrade }) => (
        // { instrumentid, positionprofit, positionprofitbytrade })));

    callback(null, { positions: livePositions });
  } catch (error) {
    logger.error('getLivePositions(): callID: %j, %j', callID, error);
    callback(error);
  }
}

async function getNetValueAndEquityReport(call, callback) {
  const callID = createCallID(call);
  try {
    // const user = await can.grpc(call, 'get', 'fundid:all/basics');
    // const betterCallID = createBetterCallID(callID, user.userid);
    // logger.debug('getNetValueAndEquityReport(): grpcCall from callID: %j', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const netValueAndEquityReport = await fund.getNetValueAndEquityReport();
    // logger.debug('netValueAndEquityReport %j', netValueAndEquityReport);

    callback(null, netValueAndEquityReport);
  } catch (error) {
    logger.error('getNetValueAndEquityReport(): callID: %j, %j', callID, error);
    callback(error);
  }
}

async function getNetValueAndEquityReports(call, callback) {
  const callID = createCallID(call);
  try {
    // const user = await can.grpc(call, 'get', 'fundid:all/basics');
    // const betterCallID = createBetterCallID(callID, user.userid);
    // logger.debug('getNetValueAndEquityReports(): grpcCall from callID: %j', betterCallID);

    const fundid = call.request.fundid;

    const netValueAndEquityReports = await crud.equity.getNetLines(fundid);
    // logger.debug('netValueAndEquityReports %j', netValueAndEquityReports[0]);

    callback(null, { netValueAndEquityReports });
  } catch (error) {
    logger.error('getNetValueAndEquityReports(): callID: %j, %j', callID, error);
    callback(error);
  }
}

async function getPositionsLevelReport(call, callback) {
  const callID = createCallID(call);
  try {
    // const user = await can.grpc(call, 'get', 'fundid:all/basics');
    // const betterCallID = createBetterCallID(callID, user.userid);
    // logger.debug('getPositionsLevelReport(): grpcCall from callID: %j', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const positionsLevelReport = await fund.getPositionsLevelReport();
    // logger.debug('positionsLevelReport %j', positionsLevelReport);

    callback(null, positionsLevelReport);
  } catch (error) {
    logger.error('getPositionsLevelReport(): callID: %j, %j', callID, error);
    callback(error);
  }
}

async function getPositionsLeverageReport(call, callback) {
  const callID = createCallID(call);
  try {
    // const user = await can.grpc(call, 'get', 'fundid:all/basics');
    // const betterCallID = createBetterCallID(callID, user.userid);
    // logger.debug('getPositionsLeverageReport(): grpcCall from callID: %j', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const positionsLeverageReport = await fund.getPositionsLeverageReport();
    // logger.debug('positionsLeverageReport %j', positionsLeverageReport);

    callback(null, positionsLeverageReport);
  } catch (error) {
    logger.error('getPositionsLeverageReport(): callID: %j, %j', callID, error);
    callback(error);
  }
}

async function getAllPeriodsDrawdownReport(call, callback) {
  const callID = createCallID(call);
  try {
    // const user = await can.grpc(call, 'get', 'fundid:all/basics');
    // const betterCallID = createBetterCallID(callID, user.userid);
    // logger.debug('getAllPeriodsDrawdownReport(): grpcCall from callID: %j', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const drawdownReport = await fund.getAllPeriodsDrawdownReport();

    callback(null, drawdownReport);
  } catch (error) {
    logger.error('getAllPeriodsDrawdownReport(): callID: %j, %j', callID, error);
    callback(error);
  }
}

async function getCombinedReport(call, callback) {
  const callID = createCallID(call);
  try {
    // const user = await can.grpc(call, 'get', 'fundid:all/basics');
    // const betterCallID = createBetterCallID(callID, user.userid);
    // logger.debug('getCombinedReport(): grpcCall from callID: %j', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const combinedReport = await fund.getCombinedReport();
    // logger.debug('combinedReport %j', combinedReport);

    callback(null, combinedReport);
  } catch (error) {
    logger.error('getCombinedReport(): callID: %j, %j', callID, error);
    callback(error);
  }
}

async function placeOrder(call, callback) {
  const callID = createCallID(call);
  try {
    const fundid = call.request.fundid;
    const user = await can.grpc(call, 'add', `fundid:${fundid}/order`);
    const betterCallID = createBetterCallID(callID, user.userid);
    logger.debug('placeOrder(): grpcCall from callID: %j', betterCallID);

    const fund = funds.getFund({ serviceName, fundid });

    delete call.request.fundid;
    call.request.userid = user.userid;

    const placeOrderResponse = await fund.placeOrder(call.request);

    callback(null, placeOrderResponse);
  } catch (error) {
    logger.error('placeOrder(): callID: %j, %j', callID, error);
    callback(error);
  }
}

async function cancelOrder(call, callback) {
  const callID = createCallID(call);
  try {
    const fundid = call.request.fundid;
    const user = await can.grpc(call, 'delete', `fundid:${fundid}/order`);
    const betterCallID = createBetterCallID(callID, user.userid);
    logger.debug('cancelOrder(): grpcCall from callID: %j', betterCallID);

    const fund = funds.getFund({ serviceName, fundid });

    const sessionid = call.request.sessionid;
    const instrumentid = call.request.instrumentid;
    const privateno = call.request.privateno;
    const orderid = call.request.orderid;

    await fund.cancelOrder(sessionid, instrumentid, privateno, orderid);

    callback(null, {});
  } catch (error) {
    logger.error('cancelOrder(): callID: %j, %j', callID, error);
    callback(error);
  }
}

async function getTradingday(call, callback) {
  const callID = createCallID(call);
  try {
    // const user = await can.grpc(call, 'get', 'fundid:all/basics');
    // const betterCallID = createBetterCallID(callID, user.userid);
    // logger.debug('getTradingday(): grpcCall from callID: %j', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    logger.debug('broker listeners for tradingday %j', fund.listeners('tradingday').map(elem => elem.toString()));
    logger.debug('broker listeners for order %j', fund.listeners('order').map(elem => elem.toString()));
    logger.debug('broker listenersCount for tradingday %j', fund.listenerCount('tradingday'));
    logger.debug('broker listenersCount for order %j', fund.listenerCount('order'));
    const tradingday = await fund.getTradingday();

    callback(null, { tradingday });
  } catch (error) {
    logger.error('getTradingday(): callID: %j, %j', callID, error);
    callback(error);
  }
}

async function getFundStream(stream) {
  const callID = createCallID(stream);
  try {
    const user = await can.grpc(stream, 'get', 'fundid:all/basics');
    stream.user = user;
    stream.sessionID = stream.metadata.get('sessionid')[0];

    const betterCallID = createBetterCallID(callID, user.userid);
    logger.debug('get%jStream(): grpcCall from callID: %j', stream.dataType, betterCallID);

    grpcClientStreams.forEach((existingStream) => {
      if (
        existingStream.sessionID === stream.sessionID
        && existingStream.dataType === stream.dataType
      ) throw new Error(`you already opened a similar stream of type "${stream.dataType}"`);
    });

    stream
      .on('cancelled', async () => {
        try {
          logger.error('stream.on(cancelled): callID: %j', betterCallID);
          grpcClientStreams.delete(stream);
          await removeSessionIDFromAllSubIDsByDataType(stream.sessionID, stream.dataType);
        } catch (error) {
          logger.error('stream.on(cancelled): %j', error);
        }
      })
      .on('error', (error) => {
        logger.error('stream.on(error): callID: %j, %j', betterCallID, error);
        grpcClientStreams.delete(stream);
      })
      ;

    const fund = funds.getFund({ serviceName, fundid: stream.request.fundid });
    const subID = streamToSubID(stream, fund.config.broker.name);
    grpcClientStreams.add(stream);
    await redis.saddAsync(redis.join(redis.SUBID_SESSIONIDS, subID), stream.sessionID);
    await redisSub.subscribeAsync(redis.join(redis.SUBID_BROKERDATA, subID));
  } catch (error) {
    logger.error('getFundStream(): callID: %j, %j', callID, error);
    stream.emit('error', error);
  }
}

async function getOrderStream(stream) {
  try {
    stream.dataType = 'order';
    await getFundStream(stream);
  } catch (error) {
    logger.error('getOrderStream(): %j', error);
    stream.emit('error', error);
  }
}

async function getTradeStream(stream) {
  try {
    stream.dataType = 'trade';
    await getFundStream(stream);
  } catch (error) {
    logger.error('getTradeStream(): %j', error);
    stream.emit('error', error);
  }
}

async function getAccountStream(stream) {
  try {
    stream.dataType = 'account';
    await getFundStream(stream);
  } catch (error) {
    logger.error('getAccountStream(): %j', error);
    stream.emit('error', error);
  }
}

async function getPositionsStream(stream) {
  try {
    stream.dataType = 'positions';
    await getFundStream(stream);
  } catch (error) {
    logger.error('getPositionsStream(): %j', error);
    stream.emit('error', error);
  }
}

async function getTradingdayStream(stream) {
  try {
    stream.dataType = 'tradingday';
    await getFundStream(stream);
  } catch (error) {
    logger.error('getTradingdayStream(): %j', error);
    stream.emit('error', error);
  }
}

const fundGrpcInterface = {
  getOrders,
  getTrades,
  getAccount,
  getPositions,

  getPastOrders,
  getPastTrades,
  getPastAccounts,
  getPastPositions,

  getLiveAccount,
  getLivePositions,
  getNetValueAndEquityReport,
  getNetValueAndEquityReports,
  getPositionsLevelReport,
  getPositionsLeverageReport,
  getAllPeriodsDrawdownReport,
  getCombinedReport,

  placeOrder,
  cancelOrder,

  getTradingday,

  getOrderStream,
  getTradeStream,
  getAccountStream,
  getPositionsStream,
  getTradingdayStream,
};

export default function createGrpcInterface(uniqueServiceName, fundsModule) {
  try {
    serviceName = uniqueServiceName;
    funds = fundsModule;
    return fundGrpcInterface;
  } catch (error) {
    logger.error('createGrpcInterface(): %j', error);
    throw error;
  }
}
