import createDebug from 'debug';
import grpcCan from './acl';

const debug = createDebug('smartwinFutures.fund.grpc');

let serviceName;
let funds;

async function getOrders(call, callback) {
  try {
    await grpcCan(call, 'read', 'getOrders');

    debug('call.metadata %o', call.metadata.get('Authorization'));
    await grpcCan(call, 'read', 'getOrders');

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const orders = fund.getOrders();
    debug('orders %o', orders);
    callback(null, orders);
  } catch (error) {
    debug('Error getOrders(): %o', error);
    callback(error);
  }
}

async function getTrades(call, callback) {
  try {
    await grpcCan(call, 'read', 'getOrders');

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const trades = fund.getTrades();
    debug('trades %o', trades);
    callback(null, trades);
  } catch (error) {
    debug('Error getTrades(): %o', error);
    callback(error);
  }
}

async function getAccount(call, callback) {
  try {
    await grpcCan(call, 'read', 'getOrders');

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const account = fund.getAccount();
    debug('account %o', account);
    callback(null, account);
  } catch (error) {
    debug('Error getAccount(): %o', error);
    callback(error);
  }
}

async function getPositions(call, callback) {
  try {
    await grpcCan(call, 'read', 'getOrders');

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const positions = fund.getPositions();
    debug('positions %o', positions);
    callback(null, positions);
  } catch (error) {
    debug('Error getPositions(): %o', error);
    callback(error);
  }
}


async function getLiveAccount(call, callback) {
  try {
    await grpcCan(call, 'read', 'getOrders');

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });
    const liveAccount = await fund.getLiveAccount();
    debug('liveAccount %o', liveAccount);
    callback(null, liveAccount);
  } catch (error) {
    debug('Error getLiveAccount(): %o', error);
    callback(error);
  }
}

async function getLivePositions(call, callback) {
  try {
    await grpcCan(call, 'read', 'getOrders');

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });
    const livePositions = await fund.getLivePositions();
    debug('livePositions %o', livePositions.map(({ instrumentid, positionprofit }) => ({ instrumentid, positionprofit })));
    callback(null, livePositions);
  } catch (error) {
    debug('Error getLivePositions(): %o', error);
    callback(error);
  }
}

async function placeOrder(call, callback) {
  try {
    await grpcCan(call, 'read', 'getOrders');

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    delete call.request.fundid;
    await fund.order(call.request);

    callback(null, {});
  } catch (error) {
    debug('Error placeOrder(): %o', error);
    callback(error);
  }
}

async function cancelOrder(call, callback) {
  try {
    await grpcCan(call, 'read', 'getOrders');

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });

    const sessionid = call.request.sessionid;
    const instrumentid = call.request.instrumentid;
    const privateno = call.request.privateno;
    const orderid = call.request.orderid;

    await fund.cancelOrder(sessionid, instrumentid, privateno, orderid);

    callback(null, {});
  } catch (error) {
    debug('Error cancelOrder(): %o', error);
    callback(error);
  }
}

async function getTradingday(call, callback) {
  try {
    await grpcCan(call, 'read', 'getOrders');

    const fundid = call.request.fundid;
    const fund = funds.getFund({ serviceName, fundid });
    const tradingday = await fund.getTradingday();

    callback(null, { tradingday });
  } catch (error) {
    debug('Error getTradingday(): %o', error);
    callback(error);
  }
}

async function makeFundStream(stream, eventName) {
  const user = await grpcCan(stream, 'read', 'getOrders');

  const sessionid = stream.metadata.get('sessionid')[0];
  const fundid = stream.request.fundid;
  const streamDebug = createDebug(`${eventName}@${fundid}@${user.userid}:${sessionid.substr(0, 6)}@smartwinFuturesFund.grpc`);

  try {
    const peer = stream.getPeer();
    streamDebug('peer %o get%oStream()', peer, eventName);
    const fund = funds.getFund({ serviceName, fundid });

    const listener = (eventData) => {
      try {
        stream.write(eventData);
      } catch (error) {
        streamDebug('Error listener() %o', error);
      }
    };

    fund
      .on(eventName, listener)
      .on('error', error => streamDebug('%o.onError: %o', eventName, error))
      ;

    stream
      .on('cancelled', () => {
        streamDebug('connection cancelled');
        fund.removeListener(eventName, listener);
      })
      .on('error', (error) => {
        streamDebug('%oStream.onError: %o', eventName, error);
        fund.removeListener(eventName, listener);
      })
      ;
  } catch (error) {
    streamDebug('Error setMarketDataStream() %o', error);
    stream.emit('error', error);
  }
}

async function getOrderStream(stream) {
  try {
    const eventName = 'broker:order';
    await makeFundStream(stream, eventName);
  } catch (error) {
    debug('Error getOrderStream(): %o', error);
    stream.emit('error', error);
  }
}

async function getTradeStream(stream) {
  try {
    const eventName = 'broker:trade';
    await makeFundStream(stream, eventName);
  } catch (error) {
    debug('Error getTradeStream(): %o', error);
    stream.emit('error', error);
  }
}

async function getAccountStream(stream) {
  try {
    const eventName = 'broker:account';
    await makeFundStream(stream, eventName);
  } catch (error) {
    debug('Error getAccountStream(): %o', error);
    stream.emit('error', error);
  }
}

async function getPositionsStream(stream) {
  try {
    const eventName = 'broker:positions';
    await makeFundStream(stream, eventName);
  } catch (error) {
    debug('Error getPositionsStream(): %o', error);
    stream.emit('error', error);
  }
}

async function getTradingdayStream(stream) {
  try {
    const eventName = 'fund:tradingday';
    await makeFundStream(stream, eventName);
  } catch (error) {
    debug('Error getTradingdayStream(): %o', error);
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
    debug('Error createGrpcInterface %o', error);
  }
}
