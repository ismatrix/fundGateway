import createDebug from 'debug';
import createIceBroker from 'sw-broker-ice';

export default function createBroker(config) {
  const {
    fundid,
  } = config;
  const {
    name,
    server,
  } = config.broker;

  const debug = createDebug(`${fundid}@${name}@${server.ip}:${server.port}@broker`);

  try {
    let broker;
    switch (name) {
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
