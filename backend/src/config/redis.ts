import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

// Cache key helpers
export const CACHE_KEYS = {
  slug: (slug: string) => `slug:${slug}`,
  userLinks: (userId: string) => `user:${userId}:links`,
  analytics: (linkId: string) => `analytics:${linkId}`,
} as const;

export const CACHE_TTL = {
  slug: 60 * 60 * 24,     // 24h for redirects — the hot path
  userLinks: 60 * 5,       // 5 min for dashboard lists
  analytics: 60 * 2,       // 2 min for analytics charts
} as const;
