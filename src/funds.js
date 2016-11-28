import createDebug from 'debug';
import createBroker from './broker';
import marketDatas from './marketDatas';
import createSmartwinFuturesFund from './smartwinFutures.fund/smartwinFutures.fund';

const debug = createDebug('funds');

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
        throw new Error('No fund interface for this serviceName: %o', config.serviceName);
    }

    fundsArr.push(newFund);
    return newFund;
  } catch (error) {
    debug('Error addAndGetFund(): %o', error);
  }
}

function getFund(config) {
  try {
    const {
      serviceName,
      fundid,
    } = config;
    debug('getFund(%o)', { serviceName, fundid });
    const existingFund = fundsArr.find(matchFund(config));
    if (existingFund !== undefined) return existingFund;

    throw new Error(`fund ${fundid}@${serviceName} not found`);
  } catch (error) {
    debug('Error getFund(): %o', error);
    throw error;
  }
}

function getFunds() {
  try {
    return fundsArr;
  } catch (error) {
    debug('Error getFunds(): %o', error);
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
    debug('Error get(): %o', error);
  }
}


function getFundsConfigs() {
  try {
    const allFunds = getFunds();
    const fundsConfigs = allFunds.map(elem => elem.config);

    return fundsConfigs;
  } catch (error) {
    debug('Error getFundsConfigs(): %o', error);
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
