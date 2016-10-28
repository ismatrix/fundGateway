import createDebug from 'debug';
import through from 'through2';
import createDataFeed from './dataFeed';

const debug = createDebug('marketData');

const dataFeedsStore = [];
const marketDataStore = [];
const subscriptionsStore = [];

function getMarketData() {
  return marketDataStore;
}

function getSubscriptions() {
  return subscriptionsStore;
}

const feedStore = through.obj((data, enc, callback) => {
  try {
    const index = marketDataStore.findIndex(elem =>
      (elem.symbol === data.symbol && elem.resolution === data.resolution)
    );
    if (index === -1) {
      marketDataStore.push(data);
    } else {
      marketDataStore[index] = data;
    }
    callback(null, data);
  } catch (error) {
    debug('Error feedStore(): %o', error);
    callback(error);
  }
});

async function addDataFeed(config) {
  try {
    const {
      datafeed,
    } = config;

    if (dataFeedsStore.map(elem => elem.config.datafeed.name).includes(datafeed.name)) return;

    const newDataFeed = createDataFeed(config);
    newDataFeed.config = config;

    await newDataFeed.connect();
    newDataFeed.getDataFeed()
      .pipe(feedStore)
      .on('error', (error) => {
        debug('Error newDataFeed.getDataFeed().pipe(feedStore): %o', error);
        throw error;
      });
    dataFeedsStore.push(newDataFeed);
  } catch (error) {
    debug('Error addDataFeed(): %o', error);
  }
}

async function subscribe(newSub) {
  try {
    const {
      datafeed = 'iceLive',
      symbol,
      resolution,
    } = newSub;

    const similarSubs = subscriptionsStore
      .filter(sub => (sub.symbol === symbol && sub.resolution === resolution))
      ;

    if (similarSubs.length === 0) {
      const theDataFeed = dataFeedsStore.find(elem => elem.datafeed === datafeed);
      if (theDataFeed === undefined) throw new Error('no existing dataFeed');

      await theDataFeed.subscribe(symbol, resolution);
      subscriptionsStore.push(newSub);
    }
  } catch (error) {
    debug('Error subscribe(): %o', error);
  }
}

async function unsubscribe(newSub) {
  try {
    const {
      datafeed = 'iceLive',
      symbol,
      resolution,
    } = newSub;

    const similarSubIndex = subscriptionsStore
      .findIndex(sub => (sub.symbol === symbol && sub.resolution === resolution))
      ;

    if (similarSubIndex !== -1) {
      const theDataFeed = dataFeedsStore.find(elem => elem.datafeed === datafeed);
      if (theDataFeed === undefined) throw new Error('no dataFeed datafeed');

      await theDataFeed.unsubscribe(symbol, resolution);
      subscriptionsStore.splice(similarSubIndex, similarSubIndex + 1);
    }
  } catch (error) {
    debug('Error unsubscribe(): %o', error);
  }
}

const marketData = {
  addDataFeed,
  subscribe,
  unsubscribe,
  getMarketData,
  getSubscriptions,
};

export default marketData;
