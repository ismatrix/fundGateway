import createDebug from 'debug';
import through from 'through2';
import createDataFeed from './dataFeed';

const debug = createDebug('marketData');

const dataFeeds = [];
const marketDataArr = [];

const mdThrough = () => through.obj((data, enc, callback) => {
  callback(null, data);
});

async function addDataFeed(config) {
  try {
    const {
      provider,
    } = config;

    if (dataFeeds.map(elem => elem.provider).includes(provider)) return;

    const newDataFeed = createDataFeed(config);
    await newDataFeed.connect();
    newDataFeed.getDataFeed().pipe(mdThrough);
    dataFeeds.push(newDataFeed);
  } catch (error) {
    debug('Error addDataFeed(): %o', error);
  }
}

async function subscribe(params) {
  try {
    const {
      provider = 'iceLive',
      symbol,
      resolution,
    } = params;

    const theDataFeed = dataFeeds.find(elem => elem.provider === provider);
    if (theDataFeed === undefined) throw new Error('no dataFeed provider');

    theDataFeed.subscribe(symbol, resolution);
  } catch (error) {
    debug('Error subscribe(): %o', error);
  }
}

async function unsubscribe(params) {
  try {
    const {
      provider = 'iceLive',
      symbol,
      resolution,
    } = params;

    const theDataFeed = dataFeeds.find(elem => elem.provider === provider);
    if (theDataFeed === undefined) throw new Error('no dataFeed provider');

    theDataFeed.subscribe(symbol, resolution);
  } catch (error) {
    debug('Error unsubscribe(): %o', error);
  }
}

const marketData = {
  addDataFeed,
  subscribe,
  unsubscribe,
};

export default marketData;
