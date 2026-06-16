import { db } from './db.js';
import UAParser from 'ua-parser-js';

export interface ClickJobData {
  linkId: string;
  ip: string;
  userAgent: string;
  referer: string;
}

// Simplified: process clicks directly instead of via BullMQ queue.
// (Free-tier Upstash Redis connection limits caused instability with
// BullMQ's persistent blocking connections in this environment.)
export async function enqueueClick(data: ClickJobData) {
  try {
    const parser = new UAParser(data.userAgent);
    const result = parser.getResult();

    await db.query(
      `INSERT INTO click_events (link_id, ip, user_agent, referer, device, browser)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        data.linkId,
        data.ip,
        data.userAgent,
        data.referer,
        result.device.type || 'desktop',
        result.browser.name || 'unknown',
      ]
    );

    await db.query(`UPDATE links SET click_count = click_count + 1 WHERE id = $1`, [data.linkId]);
  } catch (err: any) {
    console.error('Failed to record click (non-fatal):', err.message);
  }
}

export function startClickWorker() {
  console.log('✅ Click processing ready (synchronous mode)');
  return null;
}