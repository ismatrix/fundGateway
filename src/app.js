import createDebug from 'debug';
import fs from 'fs';
import path from 'path';
import grpc from 'grpc';
import fundMethods from './fund.grpc';
import mongodb from './mongodb';
import {
  mongodbUrl,
  fundConfigs,
  grpcConfig,
} from './config';
import funds from './funds';
import marketDatas from './marketDatas';

const grpcUrl = `${grpcConfig.ip}:${grpcConfig.port}`;
const debug = createDebug(`app ${grpcUrl}`);

async function init() {
  try {
    await Promise.all([].concat(
      fundConfigs.map(config => marketDatas.addMarketData(config.marketData)),
    ));
    await Promise.all([].concat(
      mongodb.connect(mongodbUrl),
      fundConfigs.map(config => funds.addFund(config)),
    ));
  } catch (error) {
    debug('Error init(): %o', error);
  }
}

async function main() {
  try {
    debug('app.js main');
    await init();

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

    server.bind(`${grpcUrl}`, sslCreds);
    server.start();
  } catch (error) {
    debug('Error main(): %o', error);
  }
}
main();
