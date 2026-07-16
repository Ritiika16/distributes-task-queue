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

/**
 * Dedicated Redis connection for BullMQ workers.
 * BullMQ requires maxRetriesPerRequest: null because it uses blocking commands
 * (BRPOPLPUSH, BLPOP) for job processing. These commands should not be retried
 * as they are designed to wait indefinitely for a response. Retrying blocking
 * commands would cause BullMQ's job processing mechanism to fail.
 */
let workerRedisConnection: Redis | null = null;

export const getWorkerRedisConnection = (): Redis => {
  if (workerRedisConnection) {
    return workerRedisConnection;
  }

  workerRedisConnection = new Redis({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    lazyConnect: true,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: null, // Required for BullMQ blocking commands
  });

  workerRedisConnection.on('connect', () => {
    logger.info('Worker Redis connected');
  });

  workerRedisConnection.on('reconnecting', () => {
    logger.warn('Worker Redis reconnecting');
  });

  workerRedisConnection.on('ready', () => {
    logger.info('Worker Redis ready');
  });

  workerRedisConnection.on('error', (err) => {
    logger.error('Worker Redis error', { error: err.message });
  });

  workerRedisConnection.on('end', () => {
    logger.warn('Worker Redis connection ended');
  });

  return workerRedisConnection;
};

export const closeWorkerRedisConnection = async (): Promise<void> => {
  if (workerRedisConnection) {
    await workerRedisConnection.quit();
    workerRedisConnection = null;
  }
};
