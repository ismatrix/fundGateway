import createDebug from 'debug';
import createFund from './fund';
import marketData from './marketData';

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
    const allPositions = allFunds
      .map(elem => elem.getPositions())
      .reduce((acc, cur) => acc.concat(cur), []);
    return allPositions;
  } catch (error) {
    debug('Error get(): %o', error);
  }
}

function allPositionsToMdSubscriptions() {
  try {
    const allFundsPositions = getFundsPositions();
    debug('allFundsPositions %o', allFundsPositions);

    const allUniqueSymbols = allFundsPositions
      .map(elem => elem.instrumentid)
      .filter((symbol, index, arr) => arr.indexOf(symbol) === index)
      ;
    debug('allUniqueSymbols %o', allUniqueSymbols);

    const needUnsubscribeSymbols = allUniqueSymbols
      .filter(symbol =>
        !allFundsPositions
          .filter(fund => fund.instrumentid === symbol)
          .reduce((acc, cur) => acc + cur.position, 0)
      )
      ;
    debug('needUnsubscribeSymbols: %o', needUnsubscribeSymbols);
    needUnsubscribeSymbols.map(symbol => marketData.unsubscribe({
      symbol,
      resolution: 'tick',
    }));

    const needSubscribeSymbols = allUniqueSymbols
      .filter(symbol => !needUnsubscribeSymbols.includes(symbol))
      ;
    debug('needSubscribeSymbols: %o', needSubscribeSymbols);
    needSubscribeSymbols.map(symbol => marketData.subscribe({
      symbol,
      resolution: 'tick',
    }));
  } catch (error) {
    debug('Error allPositionsToMdSubscriptions(): %o', error);
  }
}

const funds = {
  getFund,
  getFunds,
  addFund,
  allPositionsToMdSubscriptions,
};

export default funds;
