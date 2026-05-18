import { Router } from 'express';
import { register, login } from '../controllers/authController.js';
import { createLink, getLinks, deleteLink, getLinkAnalytics } from '../controllers/linksController.js';
import { authenticate } from '../middleware/auth.js';
import { shortenRateLimit } from '../middleware/rateLimiter.js';
import { db } from '../config/db.js';
import { redis, CACHE_KEYS, CACHE_TTL } from '../config/redis.js';

export const authRouter = Router();
authRouter.post('/register', register);
authRouter.post('/login', login);

export const linksRouter = Router();
linksRouter.use(authenticate);
linksRouter.get('/', getLinks);
linksRouter.post('/', shortenRateLimit, createLink);
linksRouter.delete('/:id', deleteLink);
linksRouter.get('/:id/analytics', getLinkAnalytics);

// Public stats — no auth required
export const publicStatsRouter = Router();
publicStatsRouter.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  const link = await db.query(
    `SELECT id, slug, original_url, title, click_count, created_at FROM links WHERE slug = $1`,
    [slug]
  );

  if (link.rows.length === 0) return res.status(404).json({ error: 'Link not found' });

  const l = link.rows[0];

  const [timeline, devices, browsers] = await Promise.all([
    db.query(
      `SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as clicks
       FROM click_events WHERE link_id = $1 AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY date ORDER BY date`,
      [l.id]
    ),
    db.query(
      `SELECT device, COUNT(*) as count FROM click_events WHERE link_id = $1 GROUP BY device ORDER BY count DESC`,
      [l.id]
    ),
    db.query(
      `SELECT browser, COUNT(*) as count FROM click_events WHERE link_id = $1 GROUP BY browser ORDER BY count DESC LIMIT 5`,
      [l.id]
    ),
  ]);

  res.json({
    slug: l.slug,
    originalUrl: l.original_url,
    title: l.title,
    totalClicks: Number(l.click_count),
    createdAt: l.created_at,
    timeline: timeline.rows,
    devices: devices.rows,
    browsers: browsers.rows,
  });
});