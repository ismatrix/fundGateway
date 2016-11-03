import createDebug from 'debug';
import fs from 'fs';
import path from 'path';
import createMarketDataGateway from 'sw-datafeed-market-data-gateway';
import { isEqual } from 'lodash';

const debug = createDebug('marketDatas');

const marketDataClients = [];

async function addMarketData(config) {
  const {
    name,
    server,
    jwtoken,
    sslCaCrtPath,
  } = config;
  try {
    const existingClient = marketDataClients.find(mdClient => isEqual(mdClient.config, config));
    if (existingClient) return;

    const sslCaCrtAbsolutePath = path.join(__dirname, sslCaCrtPath);
    const sslCaCrt = fs.readFileSync(sslCaCrtAbsolutePath);
    const newMDGatewayClient = createMarketDataGateway({
      name,
      server,
      sslCaCrt,
      jwtoken,
    });
    marketDataClients.push(newMDGatewayClient);
  } catch (error) {
    debug('Error addMarketData(): %o', error);
  }
}

function getMarketData(config) {
  try {
    const existingClient = marketDataClients.find(mdClient => isEqual(mdClient.config, config));
    if (existingClient) return existingClient;

    throw new Error('marketDataClient not found');
  } catch (error) {
    debug('Error getMarketData(): %o', error);
  }
}

const marketDatas = {
  addMarketData,
  getMarketData,
};

export default marketDatas;
