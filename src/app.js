import logger from 'sw-common';
import fs from 'fs';
import path from 'path';
import grpc from 'grpc';
import program from 'commander';
import { upperFirst, uniq } from 'lodash';
import mongodb from 'sw-mongodb';
import crud from 'sw-mongodb-crud';
import can from 'sw-can';
import fundGatewayGrpc from './fundGateway.grpc';
import funds from './funds';
import config from './config';

program
  .version('1.0.2')
  .option('-c, --credentials-name [value]', 'the name of the server ssl credentials .crt/.key')
  .option('-f, --fund-configs-source [value]', 'config.js|mongodb')
  .parse(process.argv);

const grpcUrl = `${config.grpcConfig.ip}:${config.grpcConfig.port}`;

async function init(fundConfigs) {
  try {
    await Promise.all([].concat(
      fundConfigs.map(fundConfig => funds.addAndGetFund(fundConfig)),
    ));
  } catch (error) {
    logger.error('init(): %j', error);
  }
}

async function main() {
  try {
    logger.debug('config %j', config);
    const dbInstance = await mongodb.getDB(config.mongodbURL);
    crud.setDB(dbInstance);

    // init can module with ACL
    const acl = await dbInstance.collection('ACL').find().toArray();
    can.init({ jwtSecret: config.jwtSecret, acl });

    const fundConfigsSource = program.fundConfigsSource || 'config.js';

    let fundConfigs;
    if (fundConfigsSource === 'config.js') {
      fundConfigs = config.fundConfigs;
    } else {
      const dbFunds = await crud.fund.getList({ state: 'online' }, {});
      logger.debug('dbFunds %j', dbFunds.map(f => f.fundid));
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
    logger.debug('fundConfigs %j', fundConfigs.map(f => f.fundid));

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
      true,
    );

    const server = new grpc.Server();

    // load fundGatewayAdmin service
    server.addService(
      fundProto.fundGatewayAdmin.FundGatewayAdmin.service,
      fundGatewayGrpc.fundGatewayAdmin,
    );

    // load unique fund interface service
    const grpcUniqueServiceNames = uniq(funds.getFunds().map(elem => elem.config.serviceName));
    grpcUniqueServiceNames.forEach((serviceName) => {
      server.addService(
        fundProto[serviceName][upperFirst(serviceName)].service,
        fundGatewayGrpc[serviceName](serviceName, funds),
      );
    });

    server.bind(`${grpcUrl}`, sslCreds);
    server.bind(`${config.grpcConfig.ip}:60051`, grpc.ServerCredentials.createInsecure());
    server.start();
  } catch (error) {
    logger.error('main(): %j', error);
  }
}
main();
