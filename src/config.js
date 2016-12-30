export const jwtSecret = 'Ci23fWtahDYE3dfirAHrJhzrUEoslIxqwcDN9VNhRJCWf8Tyc1F1mqYrjGYF';

export const wechatConfig = {
  encodingAESKey: 'zC5bDgdQObhGEAOSQT2T0fzBQ6iCYgxObD5DgKH4GrS',
  token: 'DrmqwVk',
  corpId: 'wxf81392ac6d39f547',
  corpSecret: 'cWd1SUkX8hU-sLyuGovGwvFzHcVqpXfufpomDhOtc_5hcGVUKc6wJJTb4yo3k3tJ',
  authorizeCallbackURL: 'https://api.invesmart.net/api/public/weixin/qy/id=13/callback',
};

export const mongodbUrl = 'mongodb://127.0.0.1:27017/smartwin';

export const redisConfig = {
  port: 6380,
  keys: {
    subID: {
      subKeyDefs: ['brokerName', 'fundID', 'dataType'],
      valueDefs: ['sessionIDs', 'brokerData'],
    },
  },
};

export const grpcConfig = {
  ip: '0.0.0.0',
  port: '50051',
};

export const marketDataConfig = {
  serviceName: 'smartwinFuturesMd',
  server: {
    ip: 'markets.invesmart.net',
    port: '50052',
  },
  jwtoken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1NzZhNDNjNjUyNmRjZWRjMDcwMjg4YjMiLCJ1c2VyaWQiOiJ2aWN0b3IiLCJkcHQiOlsi57O757uf6YOoIl0sImlhdCI6MTQ2NzE2NDg5Mn0.-ousXclNcnTbIDTJPJWnAkVVPErPw418TMKDqpWlZO0',
};

export const fundConfigs = [
  {
    fundid: '068074',
    serviceName: 'smartwinFuturesFund',
    broker: {
      name: 'ice',
      server: {
        ip: '120.76.98.94',
        port: '20002',
      },
    },
    marketData: marketDataConfig,
  },
  {
    fundid: '075697',
    serviceName: 'smartwinFuturesFund',
    broker: {
      name: 'ice',
      server: {
        ip: '120.76.98.94',
        port: '20034',
      },
    },
    marketData: marketDataConfig,
  },
  {
    fundid: '1330',
    serviceName: 'smartwinFuturesFund',
    broker: {
      name: 'ice',
      server: {
        ip: '120.76.98.94',
        port: '20032',
      },
    },
    marketData: marketDataConfig,
  },
  // {
  //   fundid: '1333',
  //   serviceName: 'smartwinFuturesFund',
  //   broker: {
  //     name: 'ice',
  //     server: {
  //       ip: '120.76.98.94',
  //       port: '20033',
  //     },
  //   },
  //   marketData: marketDataConfig,
  // },
  // {
  //   fundid: '3000380',
  //   serviceName: 'smartwinFuturesFund',
  //   broker: {
  //     name: 'ice',
  //     server: {
  //       ip: '127.0.0.1',
  //       port: '20005',
  //     },
  //   },
  //   marketData: marketDataConfig,
  // },
  // {
  //   fundid: '80000528',
  //   serviceName: 'smartwinFuturesFund',
  //   broker: {
  //     name: 'ice',
  //     server: {
  //       ip: '127.0.0.1',
  //       port: '20010',
  //     },
  //   },
  //   marketData: marketDataConfig,
  // },
  // {
  //   fundid: '1339',
  //   serviceName: 'smartwinFuturesFund',
  //   broker: {
  //     name: 'ice',
  //     server: {
  //       ip: '127.0.0.1',
  //       port: '20011',
  //     },
  //   },
  //   marketData: marketDataConfig,
  // },
  // {
  //   fundid: '890831',
  //   serviceName: 'smartwinFuturesFund',
  //   broker: {
  //     name: 'ice',
  //     server: {
  //       ip: '127.0.0.1',
  //       port: '20017',
  //     },
  //   },
  //   marketData: marketDataConfig,
  // },
  // {
  //   fundid: '1285',
  //   serviceName: 'smartwinFuturesFund',
  //   broker: {
  //     name: 'ice',
  //     server: {
  //       ip: '127.0.0.1',
  //       port: '20020',
  //     },
  //   },
  //   marketData: marketDataConfig,
  // },
  // {
  //   fundid: '1448',
  //   serviceName: 'smartwinFuturesFund',
  //   broker: {
  //     name: 'ice',
  //     server: {
  //       ip: '127.0.0.1',
  //       port: '20020',
  //     },
  //   },
  //   marketData: marketDataConfig,
  // },
  // {
  //   fundid: '82660',
  //   serviceName: 'smartwinFuturesFund',
  //   broker: {
  //     name: 'ice',
  //     server: {
  //       ip: '127.0.0.1',
  //       port: '20022',
  //     },
  //   },
  //   marketData: marketDataConfig,
  // },
  // {
  //   fundid: '222959',
  //   serviceName: 'smartwinFuturesFund',
  //   broker: {
  //     name: 'ice',
  //     server: {
  //       ip: '127.0.0.1',
  //       port: '20023',
  //     },
  //   },
  //   marketData: marketDataConfig,
  // },
  // {
  //   fundid: '1160020',
  //   serviceName: 'smartwinFuturesFund',
  //   broker: {
  //     name: 'ice',
  //     server: {
  //       ip: '127.0.0.1',
  //       port: '20024',
  //     },
  //   },
  //   marketData: marketDataConfig,
  // },
  // {
  //   fundid: '120100588',
  //   serviceName: 'smartwinFuturesFund',
  //   broker: {
  //     name: 'ice',
  //     server: {
  //       ip: '127.0.0.1',
  //       port: '20025',
  //     },
  //   },
  //   marketData: marketDataConfig,
  // },
  // {
  //   fundid: '0292',
  //   serviceName: 'smartwinFuturesFund',
  //   broker: {
  //     name: 'ice',
  //     server: {
  //       ip: '127.0.0.1',
  //       port: '20027',
  //     },
  //   },
  //   marketData: marketDataConfig,
  // },
  // {
  //   fundid: '50202468',
  //   serviceName: 'smartwinFuturesFund',
  //   broker: {
  //     name: 'ice',
  //     server: {
  //       ip: '127.0.0.1',
  //       port: '20030',
  //     },
  //   },
  //   marketData: marketDataConfig,
  // },
];
