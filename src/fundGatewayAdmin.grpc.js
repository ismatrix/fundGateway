import logger from 'sw-common';
import can from 'sw-can';
import funds from './funds';

async function getFundsConfigs(call, callback) {
  try {
    logger.debug('getFundsConfigs()');
    await can.grpc(call, 'get', 'fundGateway/configs');

    const fundsConfigs = funds.getFundsConfigs();
    logger.debug('fundsConfigs %j', fundsConfigs);
    callback(null, { fundsConfigs });
  } catch (error) {
    logger.error('getFundsConfigs(): %j', error);
    callback(error);
  }
}

async function addFund(call, callback) {
  try {
    logger.debug('addFund()');
    await can.grpc(call, 'add', 'fundGateway/fund');

    const fundConfig = call.request;
    await funds.addAndGetFund(fundConfig);
    callback(null, {});
  } catch (error) {
    logger.error('addFund(): %j', error);
    callback(error);
  }
}

const fundGatewayAdmin = {
  getFundsConfigs,
  addFund,
};

export default fundGatewayAdmin;
