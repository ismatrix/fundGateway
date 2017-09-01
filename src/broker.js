import createIceBroker from 'sw-broker-ice';
import logger from 'sw-common';
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
