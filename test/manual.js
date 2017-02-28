import createDebug from 'debug';
import fs from 'fs';
import path from 'path';
import createGrpcClient from 'sw-grpc-client';

const debug = createDebug('manual');
const jwtoken = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1NzZhNDNjNjUyNmRjZWRjMDcwMjg4YjMiLCJ1c2VyaWQiOiJ2aWN0b3IiLCJkcHQiOlsi57O757uf6YOoIl0sImlhdCI6MTQ2NzE2NDg5Mn0.-ousXclNcnTbIDTJPJWnAkVVPErPw418TMKDqpWlZO0';

const sslCaCrtPath = path.join(__dirname, '../crt/rootCA.pem');
const sslCaCrt = fs.readFileSync(sslCaCrtPath);

const fund = createGrpcClient({
  serviceName: 'smartwinFuturesFund',
  fundid: '068074-sub1',
  server: {
    // ip: 'funds.invesmart.net',
    ip: 'localhost',
    port: '50051',
  },
  jwtoken,
  sslCaCrt,
});

const streams = fund.getStreams('tradingday', 'order', 'positions', 'account', 'trade');
streams
  .on('tradingday', tradingday => debug('tradingday %o', tradingday))
  .on('order', order => debug('order %o', order))
  .on('positions', positions => debug('positions %o', positions))
  .on('account', account => debug('account %o', account))
  .on('trade', trade => debug('trade %o', trade))
  ;

// async function main() {
//   const placeOrderResponse = await fund.placeOrder({
//     exchangeid: 'SHFE',
//     instrumentid: 'ag1712',
//     ordertype: 'bestPrice',
//     direction: 'buy',
//     offsetflag: 'open',
//     price: 4257,
//     volume: 1,
//     strategyid: 'test',
//     userid: '',
//     signalname: 'test',
//   });
//
//   debug('placeOrderResponse: %o', placeOrderResponse);
// }
// main();
