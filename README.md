# Fund gateway
This is the gateway to a fund account, providing API to place order, check capital, and positions.
## Install
```
npm i -g pm2
npm install
```

## Dev
```
NODE_ENV=development DEBUG_FD=1 DEBUG=*,-babel DEBUG_COLORS=true pm2 start src/index.js --watch --no-autorestart --log-date-format="MM-DD HH:mm:ss" --name fundGateway --node-args="--inspect=9230" -- --fund-configs-source config.js --credentials-name localhost
```

## Prod
```
npm run compile
NODE_ENV=production DEBUG_FD=1 DEBUG=*,-babel,-sw-fund-smartwin-futures-calculations:* DEBUG_COLORS=true pm2 start dist/app.js --log-date-format="MM-DD HH:mm:ss" --name fundGateway --node-args="--inspect=9240" -- --fund-configs-source mongodb --credentials-name funds.invesmart.net
```

## Logs
```
pm2 logs fundGateway --lines 1000
```

## Auth examples
  * http://www.grpc.io/docs/guides/auth.html
  * client: https://github.com/grpc/grpc/blob/5098508d2d41a116113f7e333c516cd9ef34a943/src/node/performance/benchmark_client.js
  * server: https://github.com/grpc/grpc/blob/5098508d2d41a116113f7e333c516cd9ef34a943/src/node/performance/benchmark_server.js
