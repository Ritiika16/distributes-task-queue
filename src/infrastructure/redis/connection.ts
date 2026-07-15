import Redis from 'ioredis';
import logger from '../logging/logger';
import config from '../../config';

let redisConnection: Redis | null = null;

export const getRedisConnection = (): Redis => {
  if (redisConnection) {
    return redisConnection;
  }

  redisConnection = new Redis({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    lazyConnect: true,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });

  redisConnection.on('connect', () => {
    logger.info('Redis connected');
  });

  redisConnection.on('reconnecting', () => {
    logger.warn('Redis reconnecting');
  });

  redisConnection.on('ready', () => {
    logger.info('Redis ready');
  });

  redisConnection.on('error', (err) => {
    logger.error('Redis error', { error: err.message });
  });

  redisConnection.on('end', () => {
    logger.warn('Redis connection ended');
  });

  return redisConnection;
};

export const closeRedisConnection = async (): Promise<void> => {
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
  }
};
