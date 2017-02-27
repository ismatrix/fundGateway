import createDebug from 'debug';
import fs from 'fs';
import path from 'path';
import createGrpcClient from 'sw-grpc-client';

const debug = createDebug('manual');
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

async function main() {
  const placeOrderResponse = await md.placeOrder({
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
  });

  debug('placeOrderResponse: %o', placeOrderResponse);
}
main();
