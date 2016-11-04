import createDebug from 'debug';
import grpcCan from './acl';
import funds from './funds';

const debug = createDebug('fund.grpc');

async function getOrders(call, callback) {
  try {
    debug('call.metadata %o', call.metadata.get('Authorization'));
    await grpcCan(call, 'read', 'getOrders');

    const fund = funds.getFund(call.request.fundid);
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
    const fund = funds.getFund(call.request.fundid);
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
    const fund = funds.getFund(call.request.fundid);
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
    const fund = funds.getFund(call.request.fundid);
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
    const fund = funds.getFund(call.request.fundid);
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
    const fund = funds.getFund(call.request.fundid);
    const livePositions = await fund.getLivePositions();
    debug('livePositions %o', livePositions);
    callback(null, livePositions);
  } catch (error) {
    debug('Error getLivePositions(): %o', error);
    callback(error);
  }
}

async function placeOrder(call, callback) {
  try {
    const fund = funds.getFund(call.request.fundid);

    await fund.order(call.request);

    callback(null, {});
  } catch (error) {
    debug('Error placeOrder(): %o', error);
    callback(error);
  }
}

async function cancelOrder(call, callback) {
  try {
    const fund = funds.getFund(call.request.fundid);

    const instrumentid = call.request.instrumentid;
    const privateno = call.request.privateno;
    const orderid = call.request.orderid;

    await fund.cancelOrder(instrumentid, privateno, orderid);

    callback(null, {});
  } catch (error) {
    debug('Error cancelOrder(): %o', error);
    callback(error);
  }
}

async function getOrderStream(stream) {
  try {
    const fund = funds.getFund(stream.request.fundid);

    fund.on('order', (eventData) => {
      stream.write(eventData);
    });
  } catch (error) {
    debug('Error getOrderStream(): %o', error);
  }
}

async function getTradeStream(stream) {
  try {
    const fund = funds.getFund(stream.request.fundid);

    fund.on('trade', (eventData) => {
      stream.write(eventData);
    });
  } catch (error) {
    debug('Error getTradeStream(): %o', error);
  }
}

async function getAccountStream(stream) {
  try {
    const fund = funds.getFund(stream.request.fundid);

    fund.on('account', (eventData) => {
      stream.write(eventData);
    });
  } catch (error) {
    debug('Error getAccountStream(): %o', error);
  }
}

async function getPositionsStream(stream) {
  try {
    const fund = funds.getFund(stream.request.fundid);
    debug('getPositionsStream fund: %o', fund);

    fund.on('positions', (eventData) => {
      stream.write(eventData);
    });
  } catch (error) {
    debug('Error getPositionsStream(): %o', error);
  }
}

const fundMethods = {
  getOrders,
  getTrades,
  getAccount,
  getPositions,

  getLiveAccount,
  getLivePositions,

  placeOrder,
  cancelOrder,

  getOrderStream,
  getTradeStream,
  getAccountStream,
  getPositionsStream,
};

export default fundMethods;
