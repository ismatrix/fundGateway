# Fund gateway
This is the gateway to a fund account, providing API to place order, check capital, and positions.

## Install
```
npm i -g pm2
npm install
```

## Dev
```
NODE_ENV=development DEBUG_FD=1 DEBUG=*,-babel DEBUG_COLORS=true pm2 start src/index.js --watch src --no-autorestart --log-date-format="MM-DD HH:mm:ss" --name fundGateway --node-args="--inspect=9230" -- --fund-configs-source config.js --credentials-name localhost
```

## Prod
```
npm run compile
NODE_ENV=production DEBUG_FD=1 DEBUG=*,-babel,-sw-fund-smartwin-futures-calculations:* DEBUG_COLORS=true pm2 start dist/app.js --log-date-format="MM-DD HH:mm:ss" --name fundGateway -- --fund-configs-source mongodb --credentials-name funds.invesmart.net
```

## 重启
```
pm2 restart gateway
```

## 架构介绍

fundGateway启起来后要做这些事情:
* 链数据库 (mongodb)
* 链每一只基金的后台服务 (ice: ip+端口)
* 下载最新账户信息 (account, order...等等)
* 对外提供获取账户信息 (grpc接口)
