import createDebug from 'debug';
import fs from 'fs';
import path from 'path';
import grpc from 'grpc';
import program from 'commander';
import { upperFirst, uniq } from 'lodash';
import mongodb from 'sw-mongodb';
import crud from 'sw-mongodb-crud';
import fundGatewayGrpc from './fundGateway.grpc';
import funds from './funds';
import config from './config';

program
  .version('1.0.2')
  .option('-c, --credentials-name [value]', 'the name of the server ssl credentials .crt/.key')
  .option('-f, --fund-configs-source [value]', 'config.js|mongodb')
  .parse(process.argv);

const grpcUrl = `${config.grpcConfig.ip}:${config.grpcConfig.port}`;
const debug = createDebug(`app:main:${grpcUrl}`);
const logError = createDebug(`app:main:${grpcUrl}`);
logError.log = console.error.bind(console);
process
 .on('uncaughtException', error => logError('process.on(uncaughtException): %o', error))
 .on('warning', warning => logError('process.on(warning): %o', warning))
 ;

async function init(fundConfigs) {
  try {
    await Promise.all([].concat(
      fundConfigs.map(fundConfig => funds.addAndGetFund(fundConfig)),
    ));
  } catch (error) {
    logError('init(): %o', error);
  }
}

async function main() {
  try {
    debug('app.js main');
    debug('config %o', config);
    const dbInstance = await mongodb.getDB(config.mongodbURL);
    crud.setDB(dbInstance);

    const fundConfigsSource = program.fundConfigsSource || 'config.js';

    let fundConfigs;
    if (fundConfigsSource === 'config.js') {
      fundConfigs = config.fundConfigs;
    } else {
      const dbFunds = await crud.fund.getList({ state: 'online' }, {});
      debug('dbFunds %o', dbFunds.map(f => f.fundid));
      fundConfigs = dbFunds.map(dbFund => ({
        fundid: dbFund.fundid,
        serviceName: 'smartwinFuturesFund',
        broker: {
          name: 'ice',
          server: {
            ip: dbFund.service.ip,
            port: dbFund.service.port,
          },
        },
        marketData: config.marketDataConfig,
      }));
    }
    debug('fundConfigs %o', fundConfigs.map(f => f.fundid));

    await init(fundConfigs);

    const fundProto = grpc.load(__dirname.concat('/fundGateway.proto'));

    const credentialsName = program.credentialsName || 'localhost';
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
