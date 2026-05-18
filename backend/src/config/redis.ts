import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
  tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

export const CACHE_KEYS = {
  slug: (slug: string) => `slug:${slug}`,
  userLinks: (userId: string) => `user:${userId}:links`,
  analytics: (linkId: string) => `analytics:${linkId}`,
} as const;

export const CACHE_TTL = {
  slug: 60 * 60 * 24,
  userLinks: 60 * 5,
  analytics: 60 * 2,
} as const;