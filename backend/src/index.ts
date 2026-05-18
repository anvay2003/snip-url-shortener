import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { db, initDB } from './config/db.js';
import { redis } from './config/redis.js';
import { startClickWorker } from './config/queue.js';
import { authRouter, linksRouter, publicStatsRouter } from './routes/index.js';
import { redirect } from './controllers/redirectController.js';
import { globalRateLimit } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3000', 'http://localhost:3002'],
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(globalRateLimit);

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));
app.use('/api/auth', authRouter);
app.use('/api/links', linksRouter);
app.use('/api/stats', publicStatsRouter);

// Redirect — must be last (catches /:slug)
app.get('/:slug', redirect);

// ── Boot ──────────────────────────────────────────────────────────────────────
async function boot() {
  await redis.connect();
  await initDB();
  startClickWorker();
  const server = app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
  
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} in use. Run: lsof -ti:${PORT} | xargs kill -9`);
      process.exit(1);
    }
  });
}

boot().catch((err) => {
  console.error('Boot failed:', err);
  process.exit(1);
});

export default app;
