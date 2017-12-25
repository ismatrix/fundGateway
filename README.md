# Fund gateway
This is the gateway to a fund account, providing API to place order, check capital, and positions.

## Install
```
npm i -g pm2
npm install
```

## Prod
```
NODE_ENV=production DEBUG_FD=1 DEBUG=*,-babel,-sw-fund-smartwin-futures-calculations:* DEBUG_COLORS=true pm2 start /opt/fundGateway/src/index.js --log-date-format="MM-DD HH:mm:ss" --name fundGateway -- --fund-configs-source mongodb --credentials-name funds.quantowin.com
```

## 重启
```
pm2 restart gateway
```

## 日志
```
pm2 logs fundGateway
~/.pm2/logs  # 日志文件路径
```

## 架构介绍

fundGateway启起来后要做这些事情:
* 链数据库 (mongodb)
* 链每一只基金的后台服务 (ice: ip+端口)
* 下载最新账户信息 (account, order...等等)
* 对外提供获取账户信息 (grpc接口)
