import createDebug from 'debug';

const debug = createDebug('sw-broker-ice:calculations');

function calcPositionProfit(position, marketData, instrument) {
  try {
    debug('position %o', {
      instrumentid: position.instrumentid,
      preholdposition: position.preholdposition,
      todayholdposition: position.todayholdposition,
      opencost: position.opencost,
    });
    debug('marketData %o', {
      price: marketData.lastPrice,
      presettlement: marketData.preSettlementPrice,
    });
    debug('instrument %o', {
      volumemultiple: instrument.volumemultiple,
    });
    const volumeMultiple = instrument.volumemultiple;

    const prevContractUnitsQuantity = position.preholdposition * volumeMultiple;
    const todayContractsQuantity = position.todayholdposition * volumeMultiple;

    let prevPriceDiff;
    let todayPriceDiff;

    if (position.direction === 'long') {
      prevPriceDiff = marketData.lastPrice - marketData.preSettlementPrice;
      todayPriceDiff = marketData.lastPrice - position.opencost;
    } else if (position.direction === 'short') {
      prevPriceDiff = marketData.preSettlementPrice - marketData.lastPrice;
      todayPriceDiff = position.opencost - marketData.lastPrice;
    } else {
      throw new Error('position.direction not defined');
    }

    const prePositionProfit = prevPriceDiff * prevContractUnitsQuantity;
    const todayPositionProfit = todayPriceDiff * todayContractsQuantity;

    const positionProfit = prePositionProfit + todayPositionProfit;
    debug('%o + %o = positionProfit: %o', prePositionProfit, todayPositionProfit, positionProfit);

    return positionProfit;
  } catch (error) {
    debug('calcPositionProfit() Error:', error);
    throw error;
  }
}

function calcLivePositions({ positions, marketDatas, instruments }) {
  try {
    // debug('calcLivePositions() positions %o, marketDatas %o, instruments %o', positions, marketDatas, instruments);
    const livePositions = positions.map((position) => {
      const marketData = marketDatas.find(elem => elem.symbol === position.instrumentid);
      // debug('marketData %o', marketData);
      const instrument = instruments.find(
        elem => elem.instrumentid === position.instrumentid);
      // debug('instrument %o', instrument);
      if (marketData && instrument) {
        position.positionprofit = calcPositionProfit(position, marketData, instrument);
      }

      return position;
    });
    return livePositions;
  } catch (error) {
    debug('calcLivePositions() Error:', error);
    throw error;
  }
}

const calculations = {
  calcLivePositions,
  calcPositionProfit,
};

export default calculations;
