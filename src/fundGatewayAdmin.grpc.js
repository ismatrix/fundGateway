import can from 'sw-can';
import funds from './funds';
import logger from 'sw-common';


async function getFundsConfigs(call, callback) {
  try {
    logger.info('getFundsConfigs()');
    await can.grpc(call, 'get', 'fundGateway/configs');

    const fundsConfigs = funds.getFundsConfigs();
    logger.info('fundsConfigs %j', fundsConfigs);
    callback(null, { fundsConfigs });
  } catch (error) {
    logger.error('getFundsConfigs(): %j', error);
    callback(error);
  }
}

async function addFund(call, callback) {
  try {
    logger.info('addFund()');
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
