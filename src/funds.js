import createBroker from './broker';
import marketDatas from './marketDatas';
import createSmartwinFuturesFund from './smartwinFutures.fund/smartwinFutures.fund';
import logger from 'sw-common';

// 管理funds (fund是一个broker的封装)

const fundsArr = [];

const matchFund = newConfig => elem => (
  elem.config.serviceName === newConfig.serviceName &&
  elem.config.fundid === newConfig.fundid
);

async function addAndGetFund(config) {
  try {
    const existingFund = fundsArr.find(matchFund(config));
    if (existingFund !== undefined) return existingFund;

    const marketData = await marketDatas.addAndGetMarketData(config.marketData);
    const broker = createBroker(config);

    let newFund;

    switch (config.serviceName) {
      case 'smartwinFuturesFund':
        newFund = createSmartwinFuturesFund(config, broker, marketData);
        break;
      default:
        throw new Error('No fund interface for this serviceName: %j', config.serviceName);
    }

    fundsArr.push(newFund);

    return newFund;
  } catch (error) {
    logger.error('addAndGetFund(): %j', error);
    throw error;
  }
}

function getFund(config) {
  try {
    const {
      serviceName,
      fundid,
    } = config;
    // logger.info('getFund(%j)', { serviceName, fundid });
    const existingFund = fundsArr.find(matchFund(config));
    if (existingFund !== undefined) return existingFund;

    throw new Error(`fund ${fundid}@${serviceName} not found`);
  } catch (error) {
    logger.error('getFund(): %j', error);
    throw error;
  }
}

function getFunds() {
  try {
    return fundsArr;
  } catch (error) {
    logger.error('getFunds(): %j', error);
    throw error;
  }
}

function getFundsPositions() {
  try {
    const allFunds = getFunds();
    const allPositions = allFunds
      .map(elem => elem.getPositions())
      .reduce((acc, cur) => acc.concat(cur), []);
    return allPositions;
  } catch (error) {
    logger.error('get(): %j', error);
    throw error;
  }
}


function getFundsConfigs() {
  try {
    const allFunds = getFunds();
    const fundsConfigs = allFunds.map(elem => elem.config);

    return fundsConfigs;
  } catch (error) {
    logger.error('getFundsConfigs(): %j', error);
    throw error;
  }
}

const funds = {
  addAndGetFund,
  getFund,
  getFunds,
  getFundsPositions,
  getFundsConfigs,
};

export default funds;
