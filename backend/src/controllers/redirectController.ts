import { Request, Response } from 'express';
import { db } from '../config/db.js';
import { redis, CACHE_KEYS, CACHE_TTL } from '../config/redis.js';
import { enqueueClick } from '../config/queue.js';

async function safeRedis<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err: any) {
    console.error('Redis op failed (continuing without cache):', err.message);
    return null;
  }
}

export async function redirect(req: Request, res: Response) {
  const { slug } = req.params;
  const start = Date.now();

  // ── 1. Cache hit (the hot path) ──────────────────────────────────────────
  const cached = await safeRedis(() => redis.get(CACHE_KEYS.slug(slug)));
  if (cached) {
    res.set('X-Cache', 'HIT');
    res.set('X-Response-Time', `${Date.now() - start}ms`);

    db.query('SELECT id FROM links WHERE slug = $1', [slug])
      .then(async (r) => {
        if (r.rows[0]) {
          await enqueueClick({
            linkId: r.rows[0].id,
            ip: req.ip || '',
            userAgent: req.headers['user-agent'] || '',
            referer: req.headers['referer'] || '',
          }).catch(() => {});
        }
      })
      .catch(() => {});

    return res.redirect(301, cached);
  }

  // ── 2. Cache miss — hit DB ────────────────────────────────────────────────
  const result = await db.query(
    `SELECT id, original_url, expires_at FROM links WHERE slug = $1`,
    [slug]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Link not found' });
  }

  const link = result.rows[0];

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return res.status(410).json({ error: 'Link has expired' });
  }

  await safeRedis(() => redis.set(CACHE_KEYS.slug(slug), link.original_url, 'EX', CACHE_TTL.slug));

  enqueueClick({
    linkId: link.id,
    ip: req.ip || '',
    userAgent: req.headers['user-agent'] || '',
    referer: req.headers['referer'] || '',
  }).catch(() => {});

  res.set('X-Cache', 'MISS');
  res.set('X-Response-Time', `${Date.now() - start}ms`);
  return res.redirect(301, link.original_url);
}