import createDebug from 'debug';
import createFund from './fund';

const debug = createDebug('funds');

const fundsArr = [];

async function addFund(config) {
  try {
    const {
      fundid,
    } = config;

    if (fundsArr.map(elem => elem.fundid).includes(fundid)) return;

    const newFund = createFund(config);
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
    const allPositions = allFunds.map(elem => a);
    // const
    // for (const fund of funds) {};
    // return fundsArr;
  } catch (error) {
    debug('Error get(): %o', error);
  }
}

const funds = {
  addFund,
  getFund,
  getFunds,
};

export default funds;
