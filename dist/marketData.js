'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

let addDataFeed = (() => {
  var _ref = _asyncToGenerator(function* (config) {
    try {
      const {
        datafeed
      } = config;

      if (dataFeedsStore.map(function (elem) {
        return elem.config.datafeed.name;
      }).includes(datafeed.name)) return;

      const newDataFeed = (0, _dataFeed2.default)(config);
      newDataFeed.config = config;

      yield newDataFeed.connect();
      newDataFeed.getDataFeed().pipe(feedStore).on('error', function (error) {
        debug('Error newDataFeed.getDataFeed().pipe(feedStore): %o', error);
        throw error;
      });
      dataFeedsStore.push(newDataFeed);
    } catch (error) {
      debug('Error addDataFeed(): %o', error);
    }
  });

  return function addDataFeed(_x) {
    return _ref.apply(this, arguments);
  };
})();

let subscribe = (() => {
  var _ref2 = _asyncToGenerator(function* (newSub) {
    try {
      const {
        datafeed = 'iceLive',
        symbol,
        resolution
      } = newSub;

      const similarSubs = subscriptionsStore.filter(function (sub) {
        return sub.symbol === symbol && sub.resolution === resolution;
      });

      if (similarSubs.length === 0) {
        const theDataFeed = dataFeedsStore.find(function (elem) {
          return elem.datafeed === datafeed;
        });
        if (theDataFeed === undefined) throw new Error('no existing dataFeed');

        yield theDataFeed.subscribe(symbol, resolution);
        subscriptionsStore.push(newSub);
      }
    } catch (error) {
      debug('Error subscribe(): %o', error);
    }
  });

  return function subscribe(_x2) {
    return _ref2.apply(this, arguments);
  };
})();

let unsubscribe = (() => {
  var _ref3 = _asyncToGenerator(function* (newSub) {
    try {
      const {
        datafeed = 'iceLive',
        symbol,
        resolution
      } = newSub;

      const similarSubIndex = subscriptionsStore.findIndex(function (sub) {
        return sub.symbol === symbol && sub.resolution === resolution;
      });

      if (similarSubIndex !== -1) {
        const theDataFeed = dataFeedsStore.find(function (elem) {
          return elem.datafeed === datafeed;
        });
        if (theDataFeed === undefined) throw new Error('no dataFeed datafeed');

        yield theDataFeed.unsubscribe(symbol, resolution);
        subscriptionsStore.splice(similarSubIndex, similarSubIndex + 1);
      }
    } catch (error) {
      debug('Error unsubscribe(): %o', error);
    }
  });

  return function unsubscribe(_x3) {
    return _ref3.apply(this, arguments);
  };
})();

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _dataFeed = require('./dataFeed');

var _dataFeed2 = _interopRequireDefault(_dataFeed);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = (0, _debug2.default)('marketData');

const dataFeedsStore = [];
const marketDataStore = [];
const subscriptionsStore = [];

function getMarketData() {
  return marketDataStore;
}

function getSubscriptions() {
  return subscriptionsStore;
}

const feedStore = _through2.default.obj((data, enc, callback) => {
  try {
    const index = marketDataStore.findIndex(elem => elem.symbol === data.symbol && elem.resolution === data.resolution);
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

const marketData = {
  addDataFeed,
  subscribe,
  unsubscribe,
  getMarketData,
  getSubscriptions
};

exports.default = marketData;