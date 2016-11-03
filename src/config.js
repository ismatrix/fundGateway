export const jwtSecret = 'Ci23fWtahDYE3dfirAHrJhzrUEoslIxqwcDN9VNhRJCWf8Tyc1F1mqYrjGYF';

export const mongodbUrl = 'mongodb://127.0.0.1:27017/smartwin';

export const fundGatewayConfig = {
  ip: '0.0.0.0',
  port: '50051',
};

export const funds = [
  {
    fundid: '068074',
    broker: {
      name: 'ice',
      server: {
        ip: '120.76.98.94',
        port: '20029',
      },
    },
    marketData: {
      name: 'smartwinFutures',
      server: {
        ip: 'localhost',
        port: '50052',
      },
      jwtoken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1NzZhNDNjNjUyNmRjZWRjMDcwMjg4YjMiLCJ1c2VyaWQiOiJ2aWN0b3IiLCJkcHQiOlsi57O757uf6YOoIl0sImlhdCI6MTQ2NzE2NDg5Mn0.-ousXclNcnTbIDTJPJWnAkVVPErPw418TMKDqpWlZO0',
      sslCaCrtPath: '../crt/rootCA.pem',
    },
  },
  {
    fundid: '1248',
    broker: {
      name: 'ice',
      server: {
        ip: '120.76.98.94',
        port: '20028',
      },
    },
  },
  {
    fundid: '3000380',
    broker: {
      name: 'ice',
      server: {
        ip: '127.0.0.1',
        port: '20001',
      },
    },
  },
  {
    fundid: '50202303',
    broker: {
      name: 'ice',
      server: {
        ip: '127.0.0.1',
        port: '20025',
      },
    },
  },
  {
    fundid: '1339',
    broker: {
      name: 'ice',
      server: {
        ip: '127.0.0.1',
        port: '20007',
      },
    },
  },
  {
    fundid: '222959',
    broker: {
      name: 'ice',
      server: {
        ip: '127.0.0.1',
        port: '20018',
      },
    },
  },
];
