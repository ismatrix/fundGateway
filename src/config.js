const marketDataConfig = {
  serviceName: 'smartwinFuturesMd',
  server: {
    ip: 'markets.quantowin.com',
    port: '50052',
  },
  jwtoken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1NzZhNDNjNjUyNmRjZWRjMDcwMjg4YjMiLCJ1c2VyaWQiOiJ2aWN0b3IiLCJkcHQiOlsi57O757uf6YOoIl0sImlhdCI6MTQ2NzE2NDg5Mn0.-ousXclNcnTbIDTJPJWnAkVVPErPw418TMKDqpWlZO0',
};

const productionConfig = {
  jwtSecret: 'Ci23fWtahDYE3dfirAHrJhzrUEoslIxqwcDN9VNhRJCWf8Tyc1F1mqYrjGYF',
  mongodbURL: 'mongodb://127.0.0.1:27017/smartwin',
  grpcConfig: {
    ip: '0.0.0.0',
    port: '50051',
  },
  redisConfig: {
    port: 6380,
    keys: {
      subID: {
        subKeyDefs: ['brokerName', 'fundID', 'dataType'],
        valueDefs: ['sessionIDs', 'brokerData'],
      },
    },
  },
  marketDataConfig,
};

const developmentConfig = Object.assign({},
  productionConfig,
  {
    mongodbURL: 'mongodb://127.0.0.1:27018/smartwin',
  },
);

const config = process.env.NODE_ENV === 'development' ? developmentConfig : productionConfig;

export default config;
