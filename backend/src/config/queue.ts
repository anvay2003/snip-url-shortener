import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { db } from './db.js';
import UAParser from 'ua-parser-js';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isRediss = redisUrl.startsWith('rediss://');

// BullMQ requires its own Redis connection with maxRetriesPerRequest: null
function createBullConnection() {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    ...(isRediss ? { tls: { rejectUnauthorized: false } } : {}),
  });
}

// ─── Queue ────────────────────────────────────────────────────────────────────
export const clickQueue = new Queue('click-events', {
  connection: createBullConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

clickQueue.on('error', (err) => {
  console.error('Queue error (non-fatal):', err.message);
});

export interface ClickJobData {
  linkId: string;
  ip: string;
  userAgent: string;
  referer: string;
}

export async function enqueueClick(data: ClickJobData) {
  try {
    await clickQueue.add('click', data, {
      jobId: `click-${data.linkId}-${Date.now()}`,
    });
  } catch (err: any) {
    console.error('Failed to enqueue click (non-fatal):', err.message);
  }
}

// ─── Worker ───────────────────────────────────────────────────────────────────
export function startClickWorker() {
  const worker = new Worker<ClickJobData>(
    'click-events',
    async (job) => {
      const { linkId, ip, userAgent, referer } = job.data;
      const parser = new UAParser(userAgent);
      const result = parser.getResult();

      await db.query(
        `INSERT INTO click_events (link_id, ip, user_agent, referer, device, browser)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          linkId,
          ip,
          userAgent,
          referer,
          result.device.type || 'desktop',
          result.browser.name || 'unknown',
        ]
      );

      await db.query(`UPDATE links SET click_count = click_count + 1 WHERE id = $1`, [linkId]);
    },
    {
      connection: createBullConnection(),
      concurrency: 10,
    }
  );

  worker.on('error', (err) => {
    console.error('Worker error (non-fatal):', err.message);
  });

  worker.on('failed', (job, err) => {
    console.error(`Click job ${job?.id} failed:`, err.message);
  });

  console.log('✅ Click worker started');
  return worker;
}