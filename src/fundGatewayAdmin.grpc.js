import createDebug from 'debug';
import can from 'sw-can';
import funds from './funds';

const debug = createDebug('app:fundGatewayAdmin.grpc');
const logError = createDebug('app:fundGatewayAdmin.grpc:error');
logError.log = console.error.bind(console);

async function getFundsConfigs(call, callback) {
  try {
    debug('getFundsConfigs()');
    await can.grpc(call, 'get', 'fundid:all/configs');

    const fundsConfigs = funds.getFundsConfigs();
    debug('fundsConfigs %o', fundsConfigs);
    callback(null, { fundsConfigs });
  } catch (error) {
    logError('getFundsConfigs(): %o', error);
    callback(error);
  }
}

async function addFund(call, callback) {
  try {
    debug('addFund()');
    await can.grpc(call, 'add', 'fundGateway/fund');

    const fundConfig = call.request;
    await funds.addAndGetFund(fundConfig);
    callback(null, {});
  } catch (error) {
    logError('addFund(): %o', error);
    callback(error);
  }
}

const fundGatewayAdmin = {
  getFundsConfigs,
  addFund,
};

export default fundGatewayAdmin;
