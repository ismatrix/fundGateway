import createDebug from 'debug';
import createIceLiveDataFeed from 'sw-datafeed-icelive';

export default function (config) {
  const {
    name,
    server,
  } = config.datafeed;

  const debug = createDebug(`dataFeed ${name}@${server.ip}:${server.port}@`);
  try {
    let dataFeed;

    switch (name) {
      case 'iceLive':
        dataFeed = createIceLiveDataFeed(config);
        break;
      default:
        throw new Error('Missing dataFeed provider paramater');
    }

    return dataFeed;
  } catch (error) {
    debug('createDataFeed() Error: %o', error);
  }
}
