import createDebug from 'debug';
import createIceBroker from 'sw-broker-ice';

// 创建链接
const logError = createDebug('app:broker:error');
logError.log = console.error.bind(console);

export default function createBroker(config) {
  try {
    const {
      name,
    } = config.broker;

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
    logError('createBroker(): %o', error);
    throw error;
  }
}
