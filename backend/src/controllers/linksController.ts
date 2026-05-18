import { Response } from 'express';
import { db } from '../config/db.js';
import { redis, CACHE_KEYS, CACHE_TTL } from '../config/redis.js';
import { AuthRequest } from '../middleware/auth.js';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const createSchema = z.object({
  url: z.string().url('Invalid URL'),
  slug: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  title: z.string().max(100).optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function createLink(req: AuthRequest, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const { url, title, expiresAt } = parsed.data;
  const slug = parsed.data.slug || nanoid(7);

  // Check slug collision
  const existing = await db.query('SELECT id FROM links WHERE slug = $1', [slug]);
  if (existing.rows.length > 0) return res.status(409).json({ error: 'Slug already taken' });

  const result = await db.query(
    `INSERT INTO links (user_id, slug, original_url, title, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, slug, original_url, title, expires_at, click_count, created_at`,
    [req.userId, slug, url, title || null, expiresAt || null]
  );

  const link = result.rows[0];

  // Warm the cache immediately
  await redis.set(CACHE_KEYS.slug(slug), url, 'EX', CACHE_TTL.slug);

  // Invalidate user links cache
  await redis.del(CACHE_KEYS.userLinks(req.userId!));

  res.status(201).json({
    ...link,
    shortUrl: `${process.env.BASE_URL}/${slug}`,
  });
}

export async function getLinks(req: AuthRequest, res: Response) {
  const cacheKey = CACHE_KEYS.userLinks(req.userId!);
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  const result = await db.query(
    `SELECT id, slug, original_url, title, expires_at, click_count, created_at
     FROM links WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.userId]
  );

  const links = result.rows.map((l) => ({
    ...l,
    shortUrl: `${process.env.BASE_URL}/${l.slug}`,
  }));

  await redis.set(cacheKey, JSON.stringify(links), 'EX', CACHE_TTL.userLinks);
  res.json(links);
}

export async function deleteLink(req: AuthRequest, res: Response) {
  const { id } = req.params;

  const result = await db.query(
    'DELETE FROM links WHERE id = $1 AND user_id = $2 RETURNING slug',
    [id, req.userId]
  );

  if (result.rows.length === 0) return res.status(404).json({ error: 'Link not found' });

  const { slug } = result.rows[0];
  await redis.del(CACHE_KEYS.slug(slug));
  await redis.del(CACHE_KEYS.userLinks(req.userId!));

  res.status(204).send();
}

export async function getLinkAnalytics(req: AuthRequest, res: Response) {
  const { id } = req.params;

  // Verify ownership
  const link = await db.query('SELECT id, slug, click_count FROM links WHERE id = $1 AND user_id = $2', [id, req.userId]);
  if (link.rows.length === 0) return res.status(404).json({ error: 'Link not found' });

  const cacheKey = CACHE_KEYS.analytics(id);
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  const [devices, browsers, referers, timeline] = await Promise.all([
    db.query(
      `SELECT device, COUNT(*) as count FROM click_events WHERE link_id = $1 GROUP BY device ORDER BY count DESC`,
      [id]
    ),
    db.query(
      `SELECT browser, COUNT(*) as count FROM click_events WHERE link_id = $1 GROUP BY browser ORDER BY count DESC LIMIT 5`,
      [id]
    ),
    db.query(
      `SELECT COALESCE(referer, 'Direct') as referer, COUNT(*) as count
       FROM click_events WHERE link_id = $1 GROUP BY referer ORDER BY count DESC LIMIT 10`,
      [id]
    ),
    db.query(
      `SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as clicks
       FROM click_events WHERE link_id = $1 AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY date ORDER BY date`,
      [id]
    ),
  ]);

  const analytics = {
    totalClicks: Number(link.rows[0].click_count),
    devices: devices.rows,
    browsers: browsers.rows,
    referers: referers.rows,
    timeline: timeline.rows,
  };

  await redis.set(cacheKey, JSON.stringify(analytics), 'EX', CACHE_TTL.analytics);
  res.json(analytics);
}
