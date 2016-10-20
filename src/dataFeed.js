import createDebug from 'debug';
import createIceLiveDataFeed from 'sw-datafeed-icelive';

export default function (config) {
  const {
    provider,
    server,
  } = config;
  const debug = createDebug(`dataFeed ${provider}@${server.ip}:${server.port}@`);
  try {
    let dataFeed;

    switch (provider) {
      case 'iceLive':
        dataFeed = createIceLiveDataFeed({ server });
        dataFeed.provider = 'iceLive';
        break;
      default:
        throw new Error('Missing dataFeed provider paramater');
    }

    return dataFeed;
  } catch (error) {
    debug('createDataFeed() Error: %o', error);
  }
}
