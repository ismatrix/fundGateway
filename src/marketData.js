import createDebug from 'debug';
import through from 'through2';
import createDataFeed from './dataFeed';

const debug = createDebug('marketData');

const dataFeeds = [];
const marketDataStore = [];
const subscriptions = [];

function getMarketDataStore() {
  return marketDataStore;
}

function getSubscriptions() {
  return subscriptions;
}

const feedStore = () => through.obj((data, enc, callback) => {
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
      provider,
    } = config;

    if (dataFeeds.map(elem => elem.provider).includes(provider)) return;

    const newDataFeed = createDataFeed(config);
    await newDataFeed.connect();
    newDataFeed.getDataFeed().pipe(feedStore);
    dataFeeds.push(newDataFeed);
  } catch (error) {
    debug('Error addDataFeed(): %o', error);
  }
}

async function subscribe(newSub) {
  try {
    const {
      provider = 'iceLive',
      symbol,
      resolution,
    } = newSub;

    const similarSubs = subscriptions
      .filter(sub => (sub.symbol === symbol && sub.resolution === resolution))
      ;

    if (similarSubs.length === 0) {
      const theDataFeed = dataFeeds.find(elem => elem.provider === provider);
      if (theDataFeed === undefined) throw new Error('no dataFeed provider');

      await theDataFeed.subscribe(symbol, resolution);
      subscriptions.push(newSub);
    }
  } catch (error) {
    debug('Error subscribe(): %o', error);
  }
}

async function unsubscribe(newSub) {
  try {
    const {
      provider = 'iceLive',
      symbol,
      resolution,
    } = newSub;

    const similarSubIndex = subscriptions
      .findIndex(sub => (sub.symbol === symbol && sub.resolution === resolution))
      ;

    if (similarSubIndex !== -1) {
      const theDataFeed = dataFeeds.find(elem => elem.provider === provider);
      if (theDataFeed === undefined) throw new Error('no dataFeed provider');

      await theDataFeed.unsubscribe(symbol, resolution);
      subscriptions.splice(similarSubIndex, similarSubIndex + 1);
    }
  } catch (error) {
    debug('Error unsubscribe(): %o', error);
  }
}

const marketData = {
  addDataFeed,
  subscribe,
  unsubscribe,
  getMarketDataStore,
  getSubscriptions,
};

export default marketData;
