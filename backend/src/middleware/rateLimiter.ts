import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../config/redis.js';

const globalLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:global',
  points: 60,
  duration: 60,
  blockDuration: 60,
  insuranceLimiter: undefined,
});

const shortenLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:shorten',
  points: 10,
  duration: 60,
  blockDuration: 120,
  insuranceLimiter: undefined,
});

function isRateLimitRejection(err: any): boolean {
  return err && typeof err === 'object' && 'remainingPoints' in err;
}

export function globalRateLimit(req: Request, res: Response, next: NextFunction) {
  if (redis.status !== 'ready') return next(); // fail open if Redis not connected

  globalLimiter
    .consume(req.ip || 'unknown')
    .then(() => next())
    .catch((err) => {
      if (isRateLimitRejection(err)) {
        res.set('Retry-After', '60');
        return res.status(429).json({ error: 'Too many requests. Slow down.' });
      }
      console.error('Rate limiter error, failing open:', err?.message || err);
      next();
    });
}

export function shortenRateLimit(req: Request, res: Response, next: NextFunction) {
  if (redis.status !== 'ready') return next();

  const key = (req as any).userId || req.ip || 'unknown';
  shortenLimiter
    .consume(key)
    .then(() => next())
    .catch((err) => {
      if (isRateLimitRejection(err)) {
        res.set('Retry-After', '120');
        return res.status(429).json({ error: 'Shorten limit reached. Max 10 links/min.' });
      }
      console.error('Rate limiter error, failing open:', err?.message || err);
      next();
    });
}