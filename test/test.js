// import createDebug from 'debug';
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
    ip: 'localhost',
    port: '50051',
  },
  jwtoken,
  sslCaCrt,
});

const symbols = ['ag1712'];

const marketDepthSubscriptions = [
    { symbol: 'ag1712', resolution: 'snapshot', dataType: 'marketDepth' },
];
const barSubscriptions = [
    { symbol: 'ag1712', resolution: 'minute', dataType: 'bar' },
];
const tickerSubscriptions = [
    { symbol: 'ag1712', resolution: 'snapshot', dataType: 'ticker' },
];
const dayBarSubscriptions = [
    { symbol: 'ag1712', resolution: 'snapshot', dataType: 'dayBar' },
];

describe('#getOrders()', () => {
  it('success', () => md.getOrders());
});

describe('#getTrades()', () => {
  it('success', () => md.getTrades());
});

describe('#getAccount()', () => {
  it('success', () => md.getAccount());
});

describe('#getPositions()', () => {
  it('success', () => md.getPositions());
});

describe('#getLiveAccount()', () => {
  it('success', () => md.getLiveAccount());
});

describe('#getLivePositions()', () => {
  it('success', () => md.getLivePositions());
});

describe('#getNetValueAndEquityReport()', () => {
  it('success', () => md.getNetValueAndEquityReport());
});

describe('#getPositionsLevelReport()', () => {
  it('success', () => md.getPositionsLevelReport());
});

describe('#getPositionsLeverageReport()', () => {
  it('success', () => md.getPositionsLeverageReport());
});

describe('#getCombinedReport()', () => {
  it('success', () => md.getCombinedReport());
});

describe('#placeOrder()', () => {
  it('success', () => md.placeOrder({
    exchangeid: 'SHFE',
    instrumentid: 'ag1712',
    ordertype: '1',
    direction: 'buy',
    offsetflag: 'open',
    price: 4242,
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
