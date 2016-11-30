import createDebug from 'debug';
import fsCb from 'fs';
import path from 'path';
import Promise from 'bluebird';
import createGrpcClient from 'sw-grpc-client';

const logError = createDebug('app:marketDatas:error');
logError.log = console.error.bind(console);
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

    let sslCaCrt;
    if (typeof sslCaCrtPath === 'string') {
      const sslCaCrtAbsolutePath = path.join(__dirname, sslCaCrtPath);
      sslCaCrt = await fs.readFileAsync(sslCaCrtAbsolutePath);
    }
    const newMDGatewayClient = createGrpcClient({
      serviceName,
      server,
      sslCaCrt,
      jwtoken,
    });

    marketDataClients.push(newMDGatewayClient);
    return newMDGatewayClient;
  } catch (error) {
    logError('addMarketData(): %o', error);
  }
}

function getMarketData(config) {
  try {
    const existingClient = marketDataClients.find(matchMarketDataClient(config));
    if (existingClient !== undefined) return existingClient;

    throw new Error('marketDataClient not found');
  } catch (error) {
    logError('getMarketData(): %o', error);
  }
}

const marketDatas = {
  addAndGetMarketData,
  getMarketData,
};

export default marketDatas;
