import createDebug from 'debug';
import fsCb from 'fs';
import path from 'path';
import Promise from 'bluebird';
import createGrpcClient from 'sw-grpc-client';

const debug = createDebug('marketDatas');
const fs = Promise.promisifyAll(fsCb);

const marketDataClients = [];

const matchMarketDataClient = newConfig => elem => (
  elem.config.serviceName === newConfig.serviceName
);

async function addAndGetMarketData(config) {
  const {
    serviceName,
    server,
    jwtoken,
    sslCaCrtPath,
  } = config;
  try {
    const existingClient = marketDataClients.find(matchMarketDataClient(config));
    if (existingClient !== undefined) return existingClient;

    const sslCaCrtAbsolutePath = path.join(__dirname, sslCaCrtPath);
    const sslCaCrt = await fs.readFileAsync(sslCaCrtAbsolutePath);
    const newMDGatewayClient = createGrpcClient({
      serviceName,
      server,
      sslCaCrt,
      jwtoken,
    });

    marketDataClients.push(newMDGatewayClient);
    return newMDGatewayClient;
  } catch (error) {
    debug('Error addMarketData(): %o', error);
  }
}

function getMarketData(config) {
  try {
    const existingClient = marketDataClients.find(matchMarketDataClient(config));
    if (existingClient !== undefined) return existingClient;

    throw new Error('marketDataClient not found');
  } catch (error) {
    debug('Error getMarketData(): %o', error);
  }
}

const marketDatas = {
  addAndGetMarketData,
  getMarketData,
};

export default marketDatas;
