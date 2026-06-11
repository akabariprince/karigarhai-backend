import Redis from 'ioredis';
import { env } from './env';

let redis: Redis | null = null;

if (env.REDIS_URL && env.REDIS_ENABLED === 'true') {
  redis = new Redis(env.REDIS_URL);

  redis.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  redis.on('connect', () => {
    console.log('Redis connected');
  });
}

export default redis;