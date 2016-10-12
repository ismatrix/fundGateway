# Fund gateway
This is the gateway to a fund account, providing API to place order, check capital, and positions.
## Install
```
npm i -g pm2
npm install
```

## Dev
```
DEBUG=*,-babel DEBUG_COLORS=true pm2 start src/index.js --watch --no-autorestart --name fundGateway
pm2 logs fundGateway --raw
```

## Prod
```
npm run compile
DEBUG=*,-babel DEBUG_COLORS=true pm2 start build/app.js --name fundGateway
```
