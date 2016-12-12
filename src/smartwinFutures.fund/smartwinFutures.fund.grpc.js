import createDebug from 'debug';
import grpcCan from './acl';

const debug = createDebug('app:smartwinFutures.fund.grpc');
const logError = createDebug('app:smartwinFutures.fund.grpc:error');
logError.log = console.error.bind(console);

let serviceName;
let funds;

function createCallID(call) {
  const sessionid = call.metadata.get('sessionid')[0];
  const fundid = call.request.fundid;
  const peer = call.getPeer();
  const streamID = `${sessionid.substr(0, 6)}:@${peer}>>@${fundid}`;
  return streamID;
}

async function getOrders(call, callback) {
  const callID = createCallID(call);
  try {
    const user = await grpcCan(call, 'read', 'getOrders');

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const orders = fund.getOrders();
    debug('orders %o', orders);

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

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const trades = fund.getTrades();
    debug('trades %o', trades);

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

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const account = fund.getAccount();
    debug('account %o', account);

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

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const positions = fund.getPositions();
    debug('positions %o', positions);

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

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const liveAccount = await fund.getLiveAccount();
    debug('liveAccount %o', liveAccount);

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

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const positionsLevelReport = await fund.getPositionsLevelReport();
    debug('positionsLevelReport %o', positionsLevelReport);

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

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const positionsLeverageReport = await fund.getPositionsLeverageReport();
    debug('positionsLeverageReport %o', positionsLeverageReport);

    callback(null, positionsLeverageReport);
  } catch (error) {
    logError('getPositionsLeverageReport(): callID: %o, %o', callID, error);
    callback(error);
  }
}

async function getCombinedReport(call, callback) {
  const callID = createCallID(call);
  try {
    const user = await grpcCan(call, 'read', 'getOrders');

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const combinedReport = await fund.getCombinedReport();
    debug('combinedReport %o', combinedReport);

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

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });
    const tradingday = await fund.getTradingday();

    callback(null, { tradingday });
  } catch (error) {
    logError('getTradingday(): callID: %o, %o', callID, error);
    callback(error);
  }
}

async function makeFundStream(stream, eventName) {
  try {
    const user = await grpcCan(stream, 'read', 'getOrders');

    const sessionid = stream.metadata.get('sessionid')[0];
    const fundid = stream.request.fundid;
    const peer = stream.getPeer();
    const streamID = `${sessionid.substr(0, 6)}:${user.userid}@${peer}>>${eventName}@${fundid}`;

    logError('streamID: %o, listening to %o event', streamID, eventName);

    const fund = funds.getFund({ serviceName, fundid });

    const listener = (eventData) => {
      try {
        stream.write(eventData);
        if (eventName === 'fund:tradingday') logError('streamID: %o, eventData() %o', streamID, eventData);
      } catch (error) {
        logError('streamID: %o, listener() %o', streamID, error);
      }
    };

    fund
      .on(eventName, listener)
      .on('error', error => logError('fund.on(error): streamID: %o, %o.onError: %o', streamID, eventName, error))
      ;

    stream
      .on('cancelled', () => {
        logError('streamID: %o, connection cancelled', streamID);
        fund.removeListener(eventName, listener);
      })
      .on('error', (error) => {
        logError('streamID: %o, %oStream.onError: %o', streamID, eventName, error);
        fund.removeListener(eventName, listener);
      })
      ;
  } catch (error) {
    logError('setMarketDataStream(): %o', error);
    stream.emit('error', error);
  }
}

async function getOrderStream(stream) {
  try {
    const eventName = 'broker:order';
    await makeFundStream(stream, eventName);
  } catch (error) {
    logError('getOrderStream(): %o', error);
    stream.emit('error', error);
  }
}

async function getTradeStream(stream) {
  try {
    const eventName = 'broker:trade';
    await makeFundStream(stream, eventName);
  } catch (error) {
    logError('getTradeStream(): %o', error);
    stream.emit('error', error);
  }
}

async function getAccountStream(stream) {
  try {
    const eventName = 'broker:account';
    await makeFundStream(stream, eventName);
  } catch (error) {
    logError('getAccountStream(): %o', error);
    stream.emit('error', error);
  }
}

async function getPositionsStream(stream) {
  try {
    const eventName = 'broker:positions';
    await makeFundStream(stream, eventName);
  } catch (error) {
    logError('getPositionsStream(): %o', error);
    stream.emit('error', error);
  }
}

async function getTradingdayStream(stream) {
  try {
    const eventName = 'fund:tradingday';
    await makeFundStream(stream, eventName);
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
