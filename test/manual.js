import logger from 'sw-common';
import fs from 'fs';
import path from 'path';
import createGrpcClient from 'sw-grpc-client';

const jwtoken = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1NzZhNDNjNjUyNmRjZWRjMDcwMjg4YjMiLCJ1c2VyaWQiOiJ2aWN0b3IiLCJkcHQiOlsi57O757uf6YOoIl0sImlhdCI6MTQ2NzE2NDg5Mn0.-ousXclNcnTbIDTJPJWnAkVVPErPw418TMKDqpWlZO0';

const sslCaCrtPath = path.join(__dirname, '../crt/rootCA.pem');
const sslCaCrt = fs.readFileSync(sslCaCrtPath);

const fund = createGrpcClient({
  serviceName: 'smartwinFuturesFund',
  fundid: '081679',
  server: {
    // ip: 'funds.quantowin.com',
    ip: 'localhost',
    port: '50051',
  },
  jwtoken,
  sslCaCrt,
});

// const streams = fund.getStreams('tradingday', 'order', 'positions', 'account', 'trade');
// streams
//   .on('tradingday', tradingday => logger.debug('tradingday %j', tradingday))
//   .on('order', order => logger.debug('order %j', order))
//   .on('positions', positions => logger.debug('positions %j', positions))
//   .on('account', account => logger.debug('account %j', account))
//   .on('trade', trade => logger.debug('trade %j', trade))
//   ;

async function main() {
  // const placeOrderResponse = await fund.placeOrder({
  //   exchangeid: 'SHFE',
  //   instrumentid: 'ag1706',
  //   ordertype: 'bestPrice',
  //   direction: 'sell',
  //   offsetflag: 'close',
  //   price: 4257,
  //   volume: 4,
  //   strategyid: 'test',
  //   userid: '',
  //   signalname: 'test',
  // });
  // logger.debug('placeOrderResponse: %j', placeOrderResponse);

  const td = await fund.getTradingday();
  logger.debug('td %j', td);

  const livePositions = await fund.getLivePositions();
  logger.debug('livePositions %j', livePositions);
}
main();
