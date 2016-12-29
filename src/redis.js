import createDebug from 'debug';
import createRedis from 'redis';
import bluebird from 'bluebird';
import { redisPort } from './config';

const logError = createDebug('app:redis:error');
logError.log = console.error.bind(console);

bluebird.promisifyAll(createRedis.RedisClient.prototype);
bluebird.promisifyAll(createRedis.Multi.prototype);
export const redis = createRedis.createClient({ port: redisPort });
export const redisSub = redis.duplicate();

// Redis separators definitions
export const KEYDEFANDVALUEDEFSEP = '|';
export const NSANDKEYSEP = '-';
export const SUBKEYSSEP = ':';
export const NAMESPACE = 'namespace';
export const KEYDEF = 'keyDef';
export const VALUEDEF = 'valueDef';
export const KEY = 'key';

function joinNamespace(keyDefinition, valueDefinition) {
  return [keyDefinition, valueDefinition].join(KEYDEFANDVALUEDEFSEP);
}

function joinFullKey(namespace, key) {
  return [namespace, key].join(NSANDKEYSEP);
}

function joinSubKeys(...subKeys) {
  return [...subKeys].join(SUBKEYSSEP);
}

function getNamespace(fullKey) {
  return fullKey.split(NSANDKEYSEP)[0];
}

function getKey(fullKey) {
  return fullKey.split(NSANDKEYSEP)[1];
}

function getKeyDef(fullKey) {
  return fullKey.split(KEYDEFANDVALUEDEFSEP)[0];
}

function getSubKeys(fullKey) {
  return getKey(fullKey).split(SUBKEYSSEP);
}
// Redis fullKey = keyNamespace + '-' + key
// Redis keyNamespace = keyDefinition + '|' + valueDefinition
// Redis key = subKey1 + ':' + subKey2 + ':' + subKey3

// Redis keyDefinition
const SUBID = 'subID';

// Redis valueDefinitions
const SESSIONIDS = 'sessionIDs';
const BROKERDATA = 'brokerData';

// Redis keyNamespaces
export const SUBID_SESSIONIDS = joinNamespace(SUBID, SESSIONIDS);
export const SUBID_BROKERDATA = joinNamespace(SUBID, BROKERDATA);

// Redis subKeys definitions
const keyComposition = {};
keyComposition[SUBID] = ['brokerName', 'fundID', 'dataType'];

function getSubKeysByNames(fullKey, ...subKeyNames) {
  try {
    const keyDef = getKeyDef(fullKey);
    const subKeys = getSubKeys(fullKey);
    return subKeyNames.map((subKeyName) => {
      if (subKeyName === NAMESPACE) {
        return getNamespace(fullKey);
      } else if (subKeyName === KEYDEF) {
        return keyDef;
      } else if (subKeyName === VALUEDEF) {
        return getKeyDef(fullKey);
      } else if (subKeyName === KEY) {
        return getKey(fullKey);
      }
      const indexOfSubKey = keyComposition[keyDef].indexOf(subKeyName);
      if (indexOfSubKey !== -1) return subKeys[indexOfSubKey];
      throw new Error(`cannot find the subkey ${subKeyName}`);
    });
  } catch (error) {
    logError('getSubKeysByNames(): %o', error);
    throw error;
  }
}

export const redisTools = {
  getSubKeysByNames,
  getSubKeys,
  joinNamespace,
  joinFullKey,
  joinSubKeys,
  getNamespace,
  getKey,
  getKeyDef,
};
