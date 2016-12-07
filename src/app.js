import createDebug from 'debug';
import fs from 'fs';
import path from 'path';
import grpc from 'grpc';
import program from 'commander';
import pmx from 'pmx';
import { upperFirst, uniq } from 'lodash';
import fundGatewayGrpc from './fundGateway.grpc';
import mongodb from './mongodb';
import {
  mongodbUrl,
  fundConfigs,
  grpcConfig,
} from './config';
import funds from './funds';

program
  .version('1.0.2')
  .option('-c, --credentials-name [value]', 'the name of the server ssl credentials .crt/.key')
  .parse(process.argv);

const grpcUrl = `${grpcConfig.ip}:${grpcConfig.port}`;
const debug = createDebug(`app:main:${grpcUrl}`);
const logError = createDebug(`app:main:${grpcUrl}`);
logError.log = console.error.bind(console);

pmx.init({
  network: true,
  ports: true,
});

async function init() {
  try {
    await Promise.all([].concat(
      mongodb.connect(mongodbUrl),
      fundConfigs.map(config => funds.addAndGetFund(config)),
    ));
  } catch (error) {
    logError('init(): %o', error);
  }
}

async function main() {
  try {
    debug('app.js main');
    await init();

    const fundProto = grpc.load(__dirname.concat('/fundGateway.proto'));

    const credentialsName = program.credentialsName || 'server';
    const sslServerCrtPath = path.join(__dirname, `../crt/${credentialsName}.crt`);
    const sslServerKeyPath = path.join(__dirname, `../crt/${credentialsName}.key`);
    const sslServerCrt = fs.readFileSync(sslServerCrtPath);
    const sslServerKey = fs.readFileSync(sslServerKeyPath);

    const sslCreds = grpc.ServerCredentials.createSsl(
      null,
      [{ private_key: sslServerKey, cert_chain: sslServerCrt }],
      true
    );

    const server = new grpc.Server();

    // load fundGatewayAdmin service
    server.addProtoService(
      fundProto.fundGatewayAdmin.FundGatewayAdmin.service,
      fundGatewayGrpc.fundGatewayAdmin,
    );

    // load unique fund interface service
    const grpcUniqueServiceNames = uniq(funds.getFunds().map(elem => elem.config.serviceName));
    for (const serviceName of grpcUniqueServiceNames) {
      server.addProtoService(
        fundProto[serviceName][upperFirst(serviceName)].service,
        fundGatewayGrpc[serviceName](serviceName, funds),
      );
    }

    server.bind(`${grpcUrl}`, sslCreds);
    server.start();
  } catch (error) {
    logError('main(): %o', error);
  }
}
main();
