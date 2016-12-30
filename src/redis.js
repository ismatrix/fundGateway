import createDebug from 'debug';
import createRedis from 'redis';
import bluebird from 'bluebird';
import { redisConfig } from './config';

// const debug = createDebug('app:redis');
const logError = createDebug('app:redis:error');
logError.log = console.error.bind(console);

bluebird.promisifyAll(createRedis.RedisClient.prototype);
bluebird.promisifyAll(createRedis.Multi.prototype);

// Redis separators definitions
const ns = {
  KEYDEFANDVALUEDEFSEP: '|',
  NSANDKEYSEP: '-',
  SUBKEYSSEP: ':',
  NSVARSEP: '_',
  NAMESPACE: 'namespace',
  KEYDEF: 'keyDef',
  VALUEDEF: 'valueDef',
  KEY: 'key',
};

function joinNamespace(keyDefinition, valueDefinition) {
  return [keyDefinition, valueDefinition].join(ns.KEYDEFANDVALUEDEFSEP);
}

function joinFullKey(namespace, key) {
  return [namespace, key].join(ns.NSANDKEYSEP);
}

function joinSubKeys(...subKeys) {
  return [...subKeys].join(ns.SUBKEYSSEP);
}

function getNamespace(fullKey) {
  return fullKey.split(ns.NSANDKEYSEP)[0];
}

function getKey(fullKey) {
  return fullKey.split(ns.NSANDKEYSEP)[1];
}

function getKeyDef(fullKey) {
  return fullKey.split(ns.KEYDEFANDVALUEDEFSEP)[0];
}

function getSubKeys(fullKey) {
  return getKey(fullKey).split(ns.SUBKEYSSEP);
}
// Redis fullKey = keyNamespace + '-' + key
// Redis keyNamespace = keyDefinition + '|' + valueDefinition
// Redis key = subKey1 + ':' + subKey2 + ':' + subKey3

const redisKeyDefs = Object.keys(redisConfig.keys);

redisKeyDefs.reduce((accu, keyDef) => {
  for (const valueDef of redisConfig.keys[keyDef].valueDefs) {
    accu[''.concat(keyDef.toUpperCase(), ns.NSVARSEP, valueDef.toUpperCase())] = joinNamespace(keyDef, valueDef);
  }
  return accu;
}, ns);

function getSubKeysByNames(fullKey, ...subKeyNames) {
  try {
    const keyDef = getKeyDef(fullKey);
    const subKeys = getSubKeys(fullKey);

    return subKeyNames.map((subKeyName) => {
      if (subKeyName === ns.NAMESPACE) {
        return getNamespace(fullKey);
      } else if (subKeyName === ns.KEYDEF) {
        return keyDef;
      } else if (subKeyName === ns.VALUEDEF) {
        return getKeyDef(fullKey);
      } else if (subKeyName === ns.KEY) {
        return getKey(fullKey);
      }
      const indexOfSubKey = redisConfig.keys[keyDef].composition.indexOf(subKeyName);
      if (indexOfSubKey !== -1) return subKeys[indexOfSubKey];
      throw new Error(`cannot find the subkey ${subKeyName}`);
    });
  } catch (error) {
    logError('getSubKeysByNames(): %o', error);
    throw error;
  }
}

const redisTools = {
  joinNamespace,
  joinFullKey,
  joinSubKeys,
  getSubKeysByNames,
  getSubKeys,
  getNamespace,
  getKey,
  getKeyDef,
};

const redisBase = createRedis.createClient({ port: redisConfig.port });
export const redis = Object.assign(redisBase, redisTools, ns);
export const redisSub = Object.assign(redis.duplicate(), redisTools, ns);
