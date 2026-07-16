import { getRedisConnection } from '../redis/connection';
import logger from '../logging/logger';

const IDEMPOTENCY_PREFIX = 'idempotency:';
const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60; // 24 hours

export class IdempotencyService {
  async checkAndStore(idempotencyKey: string, jobId: string): Promise<string | null> {
    const redis = getRedisConnection();
    const redisKey = `${IDEMPOTENCY_PREFIX}${idempotencyKey}`;

    const existingJobId = await redis.get(redisKey);

    if (existingJobId) {
      logger.info('Duplicate request detected', {
        idempotencyKey,
        existingJobId,
      });
      return existingJobId;
    }

    await redis.set(redisKey, jobId, 'EX', IDEMPOTENCY_TTL_SECONDS);

    logger.info('New idempotency key stored', {
      idempotencyKey,
      jobId,
      ttlSeconds: IDEMPOTENCY_TTL_SECONDS,
    });

    return null;
  }
}

export const idempotencyService = new IdempotencyService();
