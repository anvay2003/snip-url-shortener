import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

db.on('error', (err) => {
  console.error('Unexpected DB error', err);
});

export async function initDB() {
  const client = await db.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email       TEXT UNIQUE NOT NULL,
        password    TEXT NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS links (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
        slug        TEXT UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        title       TEXT,
        expires_at  TIMESTAMPTZ,
        click_count BIGINT DEFAULT 0,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS links_slug_idx     ON links(slug);
      CREATE INDEX IF NOT EXISTS links_user_id_idx  ON links(user_id);

      CREATE TABLE IF NOT EXISTS click_events (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        link_id     UUID REFERENCES links(id) ON DELETE CASCADE,
        ip          TEXT,
        user_agent  TEXT,
        referer     TEXT,
        country     TEXT,
        device      TEXT,
        browser     TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS click_events_link_id_idx  ON click_events(link_id);
      CREATE INDEX IF NOT EXISTS click_events_created_idx  ON click_events(created_at);
    `);
    console.log('✅ Database initialized');
  } finally {
    client.release();
  }
}
