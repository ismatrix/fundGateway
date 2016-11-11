import createDebug from 'debug';
import createFund from './fund';

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

    const newFund = createFund(config);
    newFund.config = config;
    await newFund.connect();

    fundsArr.push(newFund);
    return newFund;
  } catch (error) {
    debug('Error addFund(): %o', error);
  }
}

function getFund(config) {
  try {
    const existingFund = fundsArr.find(matchFund(config));
    if (existingFund !== undefined) return existingFund;

    throw new Error('fund not found');
  } catch (error) {
    debug('Error getFund(): %o', error);
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

const funds = {
  addAndGetFund,
  getFund,
  getFunds,
  getFundsPositions,
};

export default funds;
