import debugModule from 'debug';
import createIceBroker from 'sw-broker-ice';
import grpc from 'grpc';

const debug = debugModule('app');

const fundProto = grpc.load(__dirname.concat('/fund.proto')).fund;

async function getAccount(call, callback) {
  try {
    const iceBroker = createIceBroker('068074');
    debug('iceBroker %o', iceBroker);

    const account = await iceBroker.queryAccounts();
    debug('account %o', account);
    callback(null, account);
  } catch (error) {
    debug('Error getAccount(): %o', error);
  }
}

async function main() {
  try {
    debug('app.js main');

    const server = new grpc.Server();
    server.addProtoService(fundProto.Fund.service, { getAccount });
    server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());
    server.start();
  } catch (error) {
    debug('Error main(): %o', error);
  }
}
main();
