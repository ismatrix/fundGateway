'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
const jwtSecret = exports.jwtSecret = 'Ci23fWtahDYE3dfirAHrJhzrUEoslIxqwcDN9VNhRJCWf8Tyc1F1mqYrjGYF';

const mongodbUrl = exports.mongodbUrl = 'mongodb://127.0.0.1:27017/smartwin';

const marketData = exports.marketData = [{
  market: 'futures',
  type: 'quotes',
  datafeed: {
    name: 'iceLive',
    server: {
      ip: '120.76.98.94',
      port: '4502'
    }
  }
}];

const funds = exports.funds = [{
  fundid: '068074',
  broker: {
    name: 'ice',
    server: {
      ip: '120.76.98.94',
      port: '20029'
    }
  }
}, {
  fundid: '1248',
  broker: {
    name: 'ice',
    server: {
      ip: '120.76.98.94',
      port: '20028'
    }
  }
}, {
  fundid: '3000380',
  broker: {
    name: 'ice',
    server: {
      ip: '127.0.0.1',
      port: '20001'
    }
  }
}, {
  fundid: '50202303',
  broker: {
    name: 'ice',
    server: {
      ip: '127.0.0.1',
      port: '20025'
    }
  }
}, {
  fundid: '1339',
  broker: {
    name: 'ice',
    server: {
      ip: '127.0.0.1',
      port: '20007'
    }
  }
}, {
  fundid: '222959',
  broker: {
    name: 'ice',
    server: {
      ip: '127.0.0.1',
      port: '20018'
    }
  }
}];