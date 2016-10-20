import debugModule from 'debug';
import createBroker from './broker';

export default function createFund(config) {
  const {
    fundid,
  } = config;
  const debug = debugModule(`${fundid}@fund`);
  debug('config %o', config);

  try {
    const orders = [];
    const trades = [];
    let account = {};
    let positions = [];
    const liveAccount = [];
    const livePositions = [];

    const broker = createBroker(config);
    broker
      .on('order', (data) => { orders.push(data); })
      .on('trade', (data) => { trades.push(data); })
      .on('account', (data) => { account = data; })
      .on('positions', (data) => { positions = data; });

    const getOrders = () => orders;
    const getTrades = () => trades;
    const getAccount = () => account;
    const getPositions = () => positions;

    const getLiveAccount = () => liveAccount;
    const getLivePositions = () => livePositions;

    const fundBase = {
      fundid,
      getOrders,
      getTrades,
      getAccount,
      getPositions,
      getLiveAccount,
      getLivePositions,
    };
    const fund = Object.assign(Object.create(broker), fundBase);
    return fund;
  } catch (error) {
    debug('Error createFund(): %o', error);
  }
}
