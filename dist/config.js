'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
const jwtSecret = exports.jwtSecret = 'Ci23fWtahDYE3dfirAHrJhzrUEoslIxqwcDN9VNhRJCWf8Tyc1F1mqYrjGYF';

const mongodbUrl = exports.mongodbUrl = 'mongodb://127.0.0.1:27017/smartwin';

const grpcConfig = exports.grpcConfig = {
  ip: '0.0.0.0',
  port: '50051'
};

const marketData = {
  serviceName: 'smartwinFuturesMd',
  server: {
    ip: 'localhost',
    port: '50052'
  },
  jwtoken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1NzZhNDNjNjUyNmRjZWRjMDcwMjg4YjMiLCJ1c2VyaWQiOiJ2aWN0b3IiLCJkcHQiOlsi57O757uf6YOoIl0sImlhdCI6MTQ2NzE2NDg5Mn0.-ousXclNcnTbIDTJPJWnAkVVPErPw418TMKDqpWlZO0'
};

const fundConfigs = exports.fundConfigs = [{
  fundid: '068074',
  serviceName: 'smartwinFuturesFund',
  broker: {
    name: 'ice',
    server: {
      ip: '120.76.98.94',
      port: '20002'
    }
  },
  marketData
}];