import createRedis from 'redis';
import bluebird from 'bluebird';
import { redisPort } from './config';

bluebird.promisifyAll(createRedis.RedisClient.prototype);
bluebird.promisifyAll(createRedis.Multi.prototype);
export const redis = createRedis.createClient({ port: redisPort });
export const redisSub = redis.duplicate();
