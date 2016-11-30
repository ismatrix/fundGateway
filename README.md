# Fund gateway
This is the gateway to a fund account, providing API to place order, check capital, and positions.
## Install
```
npm i -g pm2
npm install
```

## Dev
```
DEBUG_FD=1 DEBUG=*,-babel DEBUG_COLORS=true pm2 start src/index.js --watch --no-autorestart --log-date-format="MM-DD HH:mm:ss" --name fundGateway -- --credentials-name invesmart.win
```

## Prod
```
npm run compile
DEBUG_FD=1 DEBUG=*,-babel DEBUG_COLORS=true pm2 start dist/app.js --log-date-format="MM-DD HH:mm:ss" --name fundGateway -- --credentials-name invesmart.win
```

## Logs
```
pm2 logs fundGateway --lines 1000
```

## gRPC SSL credentials
the device can be a server or a client.
```
openssl genrsa -out rootCA.key 2048
openssl req -x509 -new -nodes -key rootCA.key -sha256 -days 1024 -out rootCA.pem
openssl genrsa -out device.key 2048
openssl req -new -key device.key -out device.csr
openssl x509 -req -in device.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out device.crt -days 500 -sha256
```

## Auth examples
  * http://www.grpc.io/docs/guides/auth.html
  * client: https://github.com/grpc/grpc/blob/5098508d2d41a116113f7e333c516cd9ef34a943/src/node/performance/benchmark_client.js
  * server: https://github.com/grpc/grpc/blob/5098508d2d41a116113f7e333c516cd9ef34a943/src/node/performance/benchmark_server.js
