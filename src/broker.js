import logger from 'sw-common';
import createIceBroker from 'sw-broker-ice';

logger.error.log = console.error.bind(console);
// 创建链接
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
    logger.error('createBroker(): %j', error);
    throw error;
  }
}
