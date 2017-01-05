import createDebug from 'debug';
import { difference } from 'lodash';
import grpcCan from '../acl';
import { redis, redisSub } from '../redis';

const debug = createDebug('app:smartwinFutures.fund.grpc');
const logError = createDebug('app:smartwinFutures.fund.grpc:error');
logError.log = console.error.bind(console);

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

    debug('orphanRedisSessionIDs %o', orphanRedisSessionIDs);

    const removeReport = await redis.multi(allKeysHavingSessionIDs.map(key => (['SREM', key, ...orphanRedisSessionIDs])))
      .execAsync()
      ;
    debug('removeReport %o', removeReport);
  } catch (error) {
    logError('removeSessionIDsWithoutOpenStream(): %o', error);
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
    debug('allSubIDSessionIDsKeys %o', allSubIDSessionIDsKeys);

    const allDataTypeFilteredSessionIDs =
      allSubIDSessionIDsKeys.filter((fullKey) => {
        const [keyDataType] = redis.getSubKeysByNames(fullKey, 'dataType');
        return keyDataType === dataType;
      });
    debug('allDataTypeFilteredSessionIDs %o', allDataTypeFilteredSessionIDs);

    const isRemovedSessionID = await redis
      .multi(allDataTypeFilteredSessionIDs.map(elem => (['SREM', elem, sessionID])))
      .execAsync()
      ;

    const removedFromSessionIDs = allDataTypeFilteredSessionIDs.reduce((accu, curr, index) => {
      if (isRemovedSessionID[index]) accu.push(curr.substr(redis.SUBID_SESSIONIDS.length + 1));
      return accu;
    }, []);
    debug('stream %o left these rooms %o', sessionID, removedFromSessionIDs);
    return removedFromSessionIDs;
  } catch (error) {
    logError('removeSessionIDFromAllSubIDsByDataType(): %o', error);
    throw error;
  }
}

redisSub.on('message', async (room, message) => {
  try {
    const [keyNamespace, key, dataType] = redis.getSubKeysByNames(room, 'namespace', 'key', 'dataType');

    if (keyNamespace === redis.SUBID_BROKERDATA) {
      const subscribersSessionIDs =
        await redis.smembersAsync(redis.join(redis.SUBID_SESSIONIDS, key));

      for (const stream of grpcClientStreams) {
        if (
          stream.dataType === dataType
          && subscribersSessionIDs.includes(stream.sessionID)
        ) stream.write(JSON.parse(message));
      }
    }
  } catch (error) {
    logError('redisSub.on(message): %o', error);
  }
});

async function getOrders(call, callback) {
  const callID = createCallID(call);
  try {
    const user = await grpcCan(call, 'read', 'getOrders');
    const betterCallID = createBetterCallID(callID, user.userid);
    debug('getOrders(): grpcCall from callID: %o', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const orders = fund.getOrders();
    // debug('orders %o', orders);

    callback(null, orders);
  } catch (error) {
    logError('getOrders(): callID: %o, %o', callID, error);
    callback(error);
  }
}

async function getTrades(call, callback) {
  const callID = createCallID(call);
  try {
    const user = await grpcCan(call, 'read', 'getOrders');
    const betterCallID = createBetterCallID(callID, user.userid);
    debug('getTrades(): grpcCall from callID: %o', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const trades = fund.getTrades();
    // debug('trades %o', trades);

    callback(null, trades);
  } catch (error) {
    logError('getTrades(): callID: %o, %o', callID, error);
    callback(error);
  }
}

async function getAccount(call, callback) {
  const callID = createCallID(call);
  try {
    const user = await grpcCan(call, 'read', 'getOrders');
    const betterCallID = createBetterCallID(callID, user.userid);
    debug('getAccount(): grpcCall from callID: %o', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const account = fund.getAccount();
    // debug('account %o', account);

    callback(null, account);
  } catch (error) {
    logError('getAccount(): callID: %o, %o', callID, error);
    callback(error);
  }
}

async function getPositions(call, callback) {
  const callID = createCallID(call);
  try {
    const user = await grpcCan(call, 'read', 'getOrders');
    const betterCallID = createBetterCallID(callID, user.userid);
    debug('getPositions(): grpcCall from callID: %o', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const positions = fund.getPositions();
    // debug('positions %o', positions);

    callback(null, positions);
  } catch (error) {
    logError('getPositions(): callID: %o, %o', callID, error);
    callback(error);
  }
}


async function getLiveAccount(call, callback) {
  const callID = createCallID(call);
  try {
    const user = await grpcCan(call, 'read', 'getOrders');
    const betterCallID = createBetterCallID(callID, user.userid);
    debug('getLiveAccount(): grpcCall from callID: %o', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const liveAccount = await fund.getLiveAccount();
    // debug('liveAccount %o', liveAccount);

    callback(null, liveAccount);
  } catch (error) {
    logError('getLiveAccount(): callID: %o, %o', callID, error);
    callback(error);
  }
}

async function getLivePositions(call, callback) {
  const callID = createCallID(call);
  try {
    const user = await grpcCan(call, 'read', 'getOrders');
    const betterCallID = createBetterCallID(callID, user.userid);
    debug('getLivePositions(): grpcCall from callID: %o', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const livePositions = await fund.getLivePositions();
    debug('livePositions %o', livePositions.map(({ instrumentid, positionprofit }) => ({ instrumentid, positionprofit })));

    callback(null, livePositions);
  } catch (error) {
    logError('getLivePositions(): callID: %o, %o', callID, error);
    callback(error);
  }
}

async function getNetValueAndEquityReport(call, callback) {
  const callID = createCallID(call);
  try {
    const user = await grpcCan(call, 'read', 'getOrders');
    const betterCallID = createBetterCallID(callID, user.userid);
    debug('getNetValueAndEquityReport(): grpcCall from callID: %o', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const netValueAndEquityReport = await fund.getNetValueAndEquityReport();
    debug('netValueAndEquityReport %o', netValueAndEquityReport);

    callback(null, netValueAndEquityReport);
  } catch (error) {
    logError('getNetValueAndEquityReport(): callID: %o, %o', callID, error);
    callback(error);
  }
}

async function getPositionsLevelReport(call, callback) {
  const callID = createCallID(call);
  try {
    const user = await grpcCan(call, 'read', 'getOrders');
    const betterCallID = createBetterCallID(callID, user.userid);
    debug('getPositionsLevelReport(): grpcCall from callID: %o', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const positionsLevelReport = await fund.getPositionsLevelReport();
    // debug('positionsLevelReport %o', positionsLevelReport);

    callback(null, positionsLevelReport);
  } catch (error) {
    logError('getPositionsLevelReport(): callID: %o, %o', callID, error);
    callback(error);
  }
}

async function getPositionsLeverageReport(call, callback) {
  const callID = createCallID(call);
  try {
    const user = await grpcCan(call, 'read', 'getOrders');
    const betterCallID = createBetterCallID(callID, user.userid);
    debug('getPositionsLeverageReport(): grpcCall from callID: %o', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const positionsLeverageReport = await fund.getPositionsLeverageReport();
    // debug('positionsLeverageReport %o', positionsLeverageReport);

    callback(null, positionsLeverageReport);
  } catch (error) {
    logError('getPositionsLeverageReport(): callID: %o, %o', callID, error);
    callback(error);
  }
}

async function getAllPeriodsDrawdownReport(call, callback) {
  const callID = createCallID(call);
  try {
    const user = await grpcCan(call, 'read', 'getOrders');
    const betterCallID = createBetterCallID(callID, user.userid);
    debug('getAllPeriodsDrawdownReport(): grpcCall from callID: %o', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const drawdownReport = await fund.getAllPeriodsDrawdownReport();

    callback(null, drawdownReport);
  } catch (error) {
    logError('getAllPeriodsDrawdownReport(): callID: %o, %o', callID, error);
    callback(error);
  }
}

async function getCombinedReport(call, callback) {
  const callID = createCallID(call);
  try {
    const user = await grpcCan(call, 'read', 'getOrders');
    const betterCallID = createBetterCallID(callID, user.userid);
    debug('getCombinedReport(): grpcCall from callID: %o', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const combinedReport = await fund.getCombinedReport();
    // debug('combinedReport %o', combinedReport);

    callback(null, combinedReport);
  } catch (error) {
    logError('getCombinedReport(): callID: %o, %o', callID, error);
    callback(error);
  }
}

async function placeOrder(call, callback) {
  const callID = createCallID(call);
  try {
    const user = await grpcCan(call, 'read', 'getOrders');
    const betterCallID = createBetterCallID(callID, user.userid);
    debug('placeOrder(): grpcCall from callID: %o', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    delete call.request.fundid;
    await fund.order(call.request);

    callback(null, {});
  } catch (error) {
    logError('placeOrder(): callID: %o, %o', callID, error);
    callback(error);
  }
}

async function cancelOrder(call, callback) {
  const callID = createCallID(call);
  try {
    const user = await grpcCan(call, 'read', 'getOrders');
    const betterCallID = createBetterCallID(callID, user.userid);
    debug('cancelOrder(): grpcCall from callID: %o', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const sessionid = call.request.sessionid;
    const instrumentid = call.request.instrumentid;
    const privateno = call.request.privateno;
    const orderid = call.request.orderid;

    await fund.cancelOrder(sessionid, instrumentid, privateno, orderid);

    callback(null, {});
  } catch (error) {
    logError('cancelOrder(): callID: %o, %o', callID, error);
    callback(error);
  }
}

async function getTradingday(call, callback) {
  const callID = createCallID(call);
  try {
    const user = await grpcCan(call, 'read', 'getOrders');
    const betterCallID = createBetterCallID(callID, user.userid);
    debug('getTradingday(): grpcCall from callID: %o', betterCallID);

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });
    const tradingday = await fund.getTradingday();

    callback(null, { tradingday });
  } catch (error) {
    logError('getTradingday(): callID: %o, %o', callID, error);
    callback(error);
  }
}

async function getFundStream(stream, eventName) {
  const callID = createCallID(stream);
  try {
    const user = await grpcCan(stream, 'read', 'getOrders');
    stream.user = user;
    stream.sessionID = stream.metadata.get('sessionid')[0];

    const betterCallID = createBetterCallID(callID, user.userid, eventName);
    debug('getFundStream(): grpcCall from callID: %o', betterCallID);

    grpcClientStreams.forEach((existingStream) => {
      if (
        existingStream.sessionID === stream.sessionID
        && existingStream.dataType === stream.dataType
      ) throw new Error(`you already opened a similar stream of type "${stream.dataType}"`);
    });

    stream
      .on('cancelled', async () => {
        try {
          logError('stream.on(cancelled): callID: %o', betterCallID);
          grpcClientStreams.delete(stream);
          await removeSessionIDFromAllSubIDsByDataType(stream.sessionID, stream.dataType);
        } catch (error) {
          logError('stream.on(cancelled): %o', error);
        }
      })
      .on('error', (error) => {
        logError('stream.on(error): callID: %o, %o', betterCallID, error);
        grpcClientStreams.delete(stream);
      })
      ;

    const fund = funds.getFund({ serviceName, fundid: stream.request.fundid });
    const subID = streamToSubID(stream, fund.config.broker.name);
    grpcClientStreams.add(stream);
    await redis.saddAsync(redis.join(redis.SUBID_SESSIONIDS, subID), stream.sessionID);
    await redisSub.subscribeAsync(redis.join(redis.SUBID_BROKERDATA, subID));
  } catch (error) {
    logError('getFundStream(): callID: %o, %o', callID, error);
    stream.emit('error', error);
  }
}

async function getOrderStream(stream) {
  try {
    stream.dataType = 'order';
    await getFundStream(stream);
  } catch (error) {
    logError('getOrderStream(): %o', error);
    stream.emit('error', error);
  }
}

async function getTradeStream(stream) {
  try {
    stream.dataType = 'trade';
    await getFundStream(stream);
  } catch (error) {
    logError('getTradeStream(): %o', error);
    stream.emit('error', error);
  }
}

async function getAccountStream(stream) {
  try {
    stream.dataType = 'account';
    await getFundStream(stream);
  } catch (error) {
    logError('getAccountStream(): %o', error);
    stream.emit('error', error);
  }
}

async function getPositionsStream(stream) {
  try {
    stream.dataType = 'positions';
    await getFundStream(stream);
  } catch (error) {
    logError('getPositionsStream(): %o', error);
    stream.emit('error', error);
  }
}

async function getTradingdayStream(stream) {
  try {
    stream.dataType = 'tradingday';
    await getFundStream(stream);
  } catch (error) {
    logError('getTradingdayStream(): %o', error);
    stream.emit('error', error);
  }
}

const fundGrpcInterface = {
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
    logError('createGrpcInterface(): %o', error);
    throw error;
  }
}
