# fundGateway
This is the gateway to a fund account, providing API to place order, check capital, and positions.
<p align="center">
    <img src ="https://img.shields.io/badge/version-3.0.0-blueviolet.svg"/>
    <img src ="https://img.shields.io/badge/platform-windows|linux|macos-yellow.svg"/>
    <img src ="https://img.shields.io/badge/nodejs-6.0+-blue.svg" />
    <img src ="https://img.shields.io/github/workflow/status/vnpy/vnpy/Python%20application/master"/>
    <img src ="https://img.shields.io/github/license/vnpy/vnpy.svg?color=orange"/>
</p>

商品期货交易服务，上游通过 [zeroice](https://zeroc.com/) 接入 [china-future-exchange-ctp](https://github.com/ismatrix/china-future-exchange-ctp)， 通过[gRPC]对外提供账户及交易接口

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
