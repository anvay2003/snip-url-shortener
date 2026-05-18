import { Queue, Worker, QueueEvents } from 'bullmq';
import { redis } from './redis.js';
import { db } from './db.js';
import UAParser from 'ua-parser-js';

const connection = { host: redis.options.host || 'localhost', port: Number(redis.options.port) || 6379 };

// ─── Queue ────────────────────────────────────────────────────────────────────
export const clickQueue = new Queue('click-events', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export interface ClickJobData {
  linkId: string;
  ip: string;
  userAgent: string;
  referer: string;
}

export async function enqueueClick(data: ClickJobData) {
  await clickQueue.add('click', data, {
    jobId: `click-${data.linkId}-${Date.now()}`, // idempotency prefix
  });
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

      // Increment counter atomically
      await db.query(`UPDATE links SET click_count = click_count + 1 WHERE id = $1`, [linkId]);
    },
    {
      connection,
      concurrency: 10,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`Click job ${job?.id} failed:`, err.message);
  });

  console.log('✅ Click worker started');
  return worker;
}
