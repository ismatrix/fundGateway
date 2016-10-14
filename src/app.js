import debugModule from 'debug';
import fs from 'fs';
import grpc from 'grpc';
import createIceBroker from 'sw-broker-ice';

const debug = debugModule('app');

const fundProto = grpc.load(__dirname.concat('/fund.proto'));

async function getOrders(call, callback) {
  try {
    const iceBroker = createIceBroker('068074');
    debug('iceBroker %o', iceBroker);

    const orders = await iceBroker.queryOrders();
    debug('orders %o', orders);
    callback(null, orders);
  } catch (error) {
    debug('Error getOrders(): %o', error);
    callback(error);
  }
}

async function getTrades(call, callback) {
  try {
    const iceBroker = createIceBroker(call.request.fundid);

    const trades = await iceBroker.queryTrades();
    debug('trades %o', trades);
    callback(null, trades);
  } catch (error) {
    debug('Error getTrades(): %o', error);
    callback(error);
  }
}

async function getAccounts(call, callback) {
  try {
    const iceBroker = createIceBroker(call.request.fundid);

    const accounts = await iceBroker.queryAccounts();
    debug('accounts %o', accounts);
    callback(null, accounts);
  } catch (error) {
    debug('Error getAccounts(): %o', error);
    callback(error);
  }
}

async function getPositions(call, callback) {
  try {
    const iceBroker = createIceBroker(call.request.fundid);

    const positions = await iceBroker.queryPositions();
    debug('positions %o', positions);
    callback(null, positions);
  } catch (error) {
    debug('Error getPositions(): %o', error);
    callback(error);
  }
}

async function placeOrder(call, callback) {
  try {
    const iceBroker = createIceBroker(call.request.fundid);
    debug('iceBroker %o', iceBroker);

    await iceBroker.order(call.request);

    callback(null, {});
  } catch (error) {
    debug('Error placeOrder(): %o', error);
    callback(error);
  }
}

async function cancelOrder(call, callback) {
  try {
    const iceBroker = createIceBroker(call.request.fundid);
    debug('iceBroker %o', iceBroker);
    const instrumentid = call.request.instrumentid;
    const privateno = call.request.privateno;
    const orderid = call.request.orderid;

    await iceBroker.cancelOrder(instrumentid, privateno, orderid);

    callback(null, {});
  } catch (error) {
    debug('Error cancelOrder(): %o', error);
    callback(error);
  }
}

async function subscribeOrder(stream) {
  try {
    const iceBroker = createIceBroker(stream.request.fundid);
    debug('iceBroker %o', iceBroker);

    iceBroker.connect();

    iceBroker.on('order', (eventData) => {
      stream.write(eventData);
    });
  } catch (error) {
    debug('Error subscribeOrder(): %o', error);
  }
}

async function subscribeTrade(stream) {
  try {
    const iceBroker = createIceBroker(stream.request.fundid);
    debug('iceBroker %o', iceBroker);

    iceBroker.connect();

    iceBroker.on('trade', (eventData) => {
      stream.write(eventData);
    });
  } catch (error) {
    debug('Error subscribeTrade(): %o', error);
  }
}

async function subscribeAccount(stream) {
  try {
    const iceBroker = createIceBroker(stream.request.fundid);
    debug('iceBroker %o', iceBroker);

    iceBroker.connect();

    iceBroker.on('account', (eventData) => {
      stream.write(eventData);
    });
  } catch (error) {
    debug('Error subscribeAccount(): %o', error);
  }
}

async function subscribePositions(stream) {
  try {
    const iceBroker = createIceBroker(stream.request.fundid);
    debug('iceBroker %o', iceBroker);

    iceBroker.connect();

    iceBroker.on('positions', (eventData) => {
      stream.write(eventData);
    });
  } catch (error) {
    debug('Error subscribePositions(): %o', error);
  }
}

async function main() {
  try {
    debug('app.js main');
    // const sslCaCrtPath = '/home/victor/Documents/smartwin/fundGateway/crt/ca.crt';
    // const sslServerCrtPath = '/home/victor/Documents/smartwin/fundGateway/crt/server.crt';
    // const sslServerKeyPath = '/home/victor/Documents/smartwin/fundGateway/crt/server.crt';
    // const sslCaCrt = fs.readFileSync(sslCaCrtPath);
    // const sslServerCrt = fs.readFileSync(sslServerCrtPath);
    // const sslServerKey = fs.readFileSync(sslServerKeyPath);

    const sslServerCrtPath = '/home/victor/Documents/smartwin/fundGateway/crt/device.crt';
    const sslServerKeyPath = '/home/victor/Documents/smartwin/fundGateway/crt/device.key';
    const sslServerCrt = fs.readFileSync(sslServerCrtPath);
    const sslServerKey = fs.readFileSync(sslServerKeyPath);

    // const sslCreds = grpc.credentials.createSsl(sslCaCrt, sslServerCrt, sslServerKey);
    const sslCreds = grpc.ServerCredentials.createSsl(
      null,
      [{ private_key: sslServerKey, cert_chain: sslServerCrt }],
      true
    );

    const server = new grpc.Server();
    server.addProtoService(fundProto.fundPackage.FundService.service, {
      getOrders,
      getTrades,
      getAccounts,
      getPositions,
      placeOrder,
      cancelOrder,
      subscribeOrder,
      subscribeTrade,
      subscribeAccount,
      subscribePositions,
    });

    server.bind('0.0.0.0:50051', sslCreds);
    server.start();
  } catch (error) {
    debug('Error main(): %o', error);
  }
}
main();
