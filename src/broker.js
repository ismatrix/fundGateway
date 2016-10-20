import createDebug from 'debug';
import createIceBroker from 'sw-broker-ice';

export default function createBroker(config) {
  const {
    fundid,
    brokerName,
    server,
  } = config;

  const debug = createDebug(`${fundid}@${brokerName}@${server.ip}:${server.port}@broker`);

  try {
    let broker;
    switch (brokerName) {
      case 'ice':
        broker = createIceBroker(config);
        break;
      default:
        throw new Error('Missing broker paramater');
    }

    return broker;
  } catch (error) {
    debug('Error createBroker(): %o', error);
  }
}
