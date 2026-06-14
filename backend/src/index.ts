import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { initDB } from './config/db.js';
import { startClickWorker } from './config/queue.js';
import { authRouter, linksRouter, publicStatsRouter } from './routes/index.js';
import { redirect } from './controllers/redirectController.js';
import { globalRateLimit } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', ts: new Date().toISOString() }));

app.set('trust proxy', 1);
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // temporarily allow all while debugging
    }
  },
  credentials: true,
}));
app.use(compression());
app.use(express.json());
app.use(globalRateLimit);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/links', linksRouter);
app.use('/api/stats', publicStatsRouter);

// Redirect — must be last (catches /:slug)
app.get('/:slug', redirect);

// ── Boot ──────────────────────────────────────────────────────────────────────
async function boot() {
  try {
    console.log('Connecting to DB...');
    await initDB();
    console.log('✅ Database initialized');
  } catch (err) {
    console.error('❌ DB failed:', err);
    process.exit(1);
  }

  try {
    startClickWorker();
    console.log('✅ Click worker started');
  } catch (err) {
    console.error('❌ Worker failed:', err);
  }

  const server = app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} in use`);
      process.exit(1);
    }
  });
}

boot().catch((err) => {
  console.error('Boot failed:', err);
  process.exit(1);
});
export default app;
