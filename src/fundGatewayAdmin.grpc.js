import createDebug from 'debug';
import grpcCan from './acl';
import funds from './funds';

const debug = createDebug('app:fundGatewayAdmin.grpc');
const logError = createDebug('app:fundGatewayAdmin.grpc:error');
logError.log = console.error.bind(console);

async function getFundsConfigs(call, callback) {
  try {
    debug('getFundsConfigs()');
    await grpcCan(call, 'read', 'getOrders');

    const fundsConfigs = funds.getFundsConfigs();
    debug('fundsConfigs %o', fundsConfigs);
    callback(null, { fundsConfigs });
  } catch (error) {
    debug('Error getFundsConfigs(): %o', error);
    callback(error);
  }
}

async function addFund(call, callback) {
  try {
    debug('addFund()');
    await grpcCan(call, 'read', 'getOrders');

    const fundConfig = call.request;
    await funds.addAndGetFund(fundConfig);
    callback(null, {});
  } catch (error) {
    debug('Error addFund(): %o', error);
    callback(error);
  }
}

const fundGatewayAdmin = {
  getFundsConfigs,
  addFund,
};

export default fundGatewayAdmin;
