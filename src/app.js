import debugModule from 'debug';
import fs from 'fs';
import path from 'path';
import grpc from 'grpc';
import fundMethods from './grpcFundMethods';
import mongodb from './mongodb';
import { mongodbUrl, funds as fundsDB } from './config';
import funds from './funds';

const debug = debugModule('app');

async function init() {
  try {
    mongodb.connect(mongodbUrl);
  } catch (error) {
    debug('Error init(): %o', error);
  }
}

async function main() {
  try {
    debug('app.js main');
    await init();
    await funds.addFund(fundsDB[0]);
    const fundProto = grpc.load(__dirname.concat('/fund.proto'));

    const sslServerCrtPath = path.join(__dirname, '../crt/server.crt');
    const sslServerKeyPath = path.join(__dirname, '../crt/server.key');
    const sslServerCrt = fs.readFileSync(sslServerCrtPath);
    const sslServerKey = fs.readFileSync(sslServerKeyPath);

    const sslCreds = grpc.ServerCredentials.createSsl(
      null,
      [{ private_key: sslServerKey, cert_chain: sslServerCrt }],
      true
    );

    const server = new grpc.Server();
    server.addProtoService(fundProto.fundPackage.FundService.service, fundMethods);

    server.bind('0.0.0.0:50051', sslCreds);
    server.start();
  } catch (error) {
    debug('Error main(): %o', error);
  }
}
main();
