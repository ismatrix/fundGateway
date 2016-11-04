import createDebug from 'debug';
import createFund from './fund';

const debug = createDebug('funds');

const fundsArr = [];

async function addFund(config) {
  try {
    if (fundsArr.map(elem => elem.config.fundid).includes(config.fundid)) return;

    const newFund = createFund(config);
    newFund.config = config;
    await newFund.connect();

    fundsArr.push(newFund);
  } catch (error) {
    debug('Error addFund(): %o', error);
  }
}

function getFund(fundid) {
  try {
    const theFund = fundsArr.find(elem => elem.fundid === fundid);
    if (theFund !== undefined) return theFund;

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
  addFund,
  getFund,
  getFunds,
  getFundsPositions,
};

export default funds;
