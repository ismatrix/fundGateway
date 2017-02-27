import fs from 'fs';
import path from 'path';
import createGrpcClient from 'sw-grpc-client';

const jwtoken = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1NzZhNDNjNjUyNmRjZWRjMDcwMjg4YjMiLCJ1c2VyaWQiOiJ2aWN0b3IiLCJkcHQiOlsi57O757uf6YOoIl0sImlhdCI6MTQ2NzE2NDg5Mn0.-ousXclNcnTbIDTJPJWnAkVVPErPw418TMKDqpWlZO0';

const sslCaCrtPath = path.join(__dirname, '../crt/rootCA.pem');
const sslCaCrt = fs.readFileSync(sslCaCrtPath);

const md = createGrpcClient({
  serviceName: 'smartwinFuturesFund',
  fundid: '068074',
  server: {
    // ip: 'funds.invesmart.net',
    ip: 'localhost',
    port: '50051',
  },
  jwtoken,
  sslCaCrt,
});

describe('#getOrders()', () => {
  it('getOrders', () => md.getOrders());
});

describe('#getTrades()', () => {
  it('getTrades', () => md.getTrades());
});

describe('#getAccount()', () => {
  it('getAccount', () => md.getAccount());
});

describe('#getPositions()', () => {
  it('getPositions', () => md.getPositions());
});

describe('#getLiveAccount()', () => {
  it('getLiveAccount', () => md.getLiveAccount());
});

describe('#getLivePositions()', () => {
  it('getLivePositions', () => md.getLivePositions());
});

describe('#getNetValueAndEquityReport()', () => {
  it('getNetValueAndEquityReport', () => md.getNetValueAndEquityReport());
});

describe('#getPositionsLevelReport()', () => {
  it('getPositionsLevelReport', () => md.getPositionsLevelReport());
});

describe('#getPositionsLeverageReport()', () => {
  it('getPositionsLeverageReport', () => md.getPositionsLeverageReport());
});

describe('#getCombinedReport()', () => {
  it('getCombinedReport', () => md.getCombinedReport());
});

describe('#placeOrder()', () => {
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

describe('#getTradingday()', () => {
  it('success', () => md.getTradingday());
});

describe('#getOrderStream()', () => {
  it('success', () => md.getOrderStream({}).on('data', () => {}));
});

describe('#getTradeStream()', () => {
  it('success', () => md.getTradeStream({}).on('data', () => {}));
});

describe('#getAccountStream()', () => {
  it('success', () => md.getAccountStream({}).on('data', () => {}));
});

describe('#getPositionsStream()', () => {
  it('success', () => md.getPositionsStream({}).on('data', () => {}));
});

describe('#getTradingdayStream()', () => {
  it('success', () => md.getPositionsStream({}).on('data', () => {}));
});
