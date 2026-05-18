import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../config/redis.js';

// Global: 60 req/min per IP (unauthenticated)
const globalLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:global',
  points: 60,
  duration: 60,
  blockDuration: 60,
});

// Shorten endpoint: 10 links/min per user/IP
const shortenLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:shorten',
  points: 10,
  duration: 60,
  blockDuration: 120,
});

export function globalRateLimit(req: Request, res: Response, next: NextFunction) {
  globalLimiter
    .consume(req.ip || 'unknown')
    .then(() => next())
    .catch(() => {
      res.set('Retry-After', '60');
      res.status(429).json({ error: 'Too many requests. Slow down.' });
    });
}

export function shortenRateLimit(req: Request, res: Response, next: NextFunction) {
  const key = (req as any).userId || req.ip || 'unknown';
  shortenLimiter
    .consume(key)
    .then(() => next())
    .catch(() => {
      res.set('Retry-After', '120');
      res.status(429).json({ error: 'Shorten limit reached. Max 10 links/min.' });
    });
}
