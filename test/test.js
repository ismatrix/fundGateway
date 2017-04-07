import fs from 'fs';
import path from 'path';
import createGrpcClient from 'sw-grpc-client';

const jwtoken = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1NzZhNDNjNjUyNmRjZWRjMDcwMjg4YjMiLCJ1c2VyaWQiOiJ2aWN0b3IiLCJkcHQiOlsi57O757uf6YOoIl0sImlhdCI6MTQ2NzE2NDg5Mn0.-ousXclNcnTbIDTJPJWnAkVVPErPw418TMKDqpWlZO0';

const sslCaCrtPath = path.join(__dirname, '../crt/rootCA.pem');
const sslCaCrt = fs.readFileSync(sslCaCrtPath);

const md = createGrpcClient({
  serviceName: 'smartwinFuturesFund',
  fundid: '081679',
  server: {
    // ip: 'funds.invesmart.net',
    ip: 'localhost',
    port: '50051',
  },
  jwtoken,
  sslCaCrt,
});

const pastRequest = {
  startDate: '20170301',
  endDate: '20170301',
};

describe('#FUND()', () => {
  it('getOrders', () => md.getOrders());
  it('getTrades', () => md.getTrades());
  it('getAccount', () => md.getAccount());
  it('getPositions', () => md.getPositions());

  it('getPastOrders', () => md.getPastOrders(pastRequest));
  it('getPastTrades', () => md.getPastTrades(pastRequest));
  it('getPastAccounts', () => md.getPastAccounts(pastRequest));
  it('getPastPositions', () => md.getPastPositions(pastRequest));

  it('getLiveAccount', () => md.getLiveAccount());
  it('getLivePositions', () => md.getLivePositions());
  it('getTradingday', () => md.getTradingday());
});

describe('#REPORTS', () => {
  it('getNetValueAndEquityReport', () => md.getNetValueAndEquityReport());
  it('getNetValueAndEquityReports', () => md.getNetValueAndEquityReports());
  it('getPositionsLevelReport', () => md.getPositionsLevelReport());
  it('getPositionsLeverageReport', () => md.getPositionsLeverageReport());
  it('getCombinedReport', () => md.getCombinedReport());
});


describe('#ORDERS()', () => {
  it('placeLimitOrder', () => md.placeOrder({
    exchangeid: 'SHFE',
    instrumentid: 'ag1712',
    ordertype: '1',
    direction: 'buy',
    offsetflag: 'open',
    price: 4257,
    volume: 1,
    strategyid: 'test',
    userid: '',
    signalname: 'test',
  }));
  it('placeBestPriceOrder', () => md.placeOrder({
    exchangeid: 'SHFE',
    instrumentid: 'ag1712',
    ordertype: 'bestPrice',
    direction: 'buy',
    offsetflag: 'open',
    price: 4257,
    volume: 1,
    strategyid: 'test',
    userid: '',
    signalname: 'test',
  }));
});

// describe('#cancelOrder()', () => {
//   it('success', () => md.cancelOrder());
// });

describe('#STREAMS()', () => {
  it('getOrderStream', () => md.getOrderStream().on('data', () => {}));
  it('getTradeStream', () => md.getTradeStream().on('data', () => {}));
  it('getAccountStream', () => md.getAccountStream().on('data', () => {}));
  it('getPositionsStream', () => md.getPositionsStream().on('data', () => {}));
  it('getTradingdayStream', () => md.getPositionsStream().on('data', () => {}));
});
