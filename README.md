# Snip — URL Shortener & Analytics Platform

> Production-grade URL shortener with Redis caching, sliding-window rate limiting, async click processing via BullMQ, and a real-time analytics dashboard.

**[Live Demo](#)** | Built with Node.js · Next.js · PostgreSQL · Redis · BullMQ

---

## Architecture

```
Browser → GET /:slug
              │
              ▼
         Redis cache ──HIT──→ 301 redirect (~8ms)
              │ MISS
              ▼
         PostgreSQL ──────────→ 301 redirect (~30ms)
              │
              ▼ (fire-and-forget)
         BullMQ Queue
              │
              ▼
         Worker → INSERT click_events → UPDATE click_count
```

**Key design decisions:**
- Redirect path never blocks on DB writes — clicks are enqueued async
- Redis sliding-window rate limiter (10 shortens/min per user, 60 req/min global)
- Cache warmed immediately on link creation (zero cold-start on first click)
- BullMQ workers retry failed jobs with exponential backoff + dead-letter queue

---

## Local Setup

### Prerequisites
- Node.js 20+
- PostgreSQL (or [Neon](https://neon.tech) free tier)
- Redis (or [Upstash](https://upstash.com) free tier)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, REDIS_URL, JWT_SECRET
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev
```

### Run tests

```bash
cd backend
npm test              # all tests with coverage
npm run test:unit     # unit tests only
```

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| Backend API | [Railway](https://railway.app) | Add Redis plugin, set env vars |
| Frontend | [Vercel](https://vercel.com) | Set `NEXT_PUBLIC_API_URL` to Railway URL |
| Database | [Neon](https://neon.tech) | Free tier, serverless Postgres |

### Steps
1. Push to GitHub
2. Create Railway project → deploy from GitHub → add Redis plugin
3. Create Vercel project → import same repo → set `/frontend` as root directory
4. Add all env vars from `.env.example` to each platform
5. CI/CD via GitHub Actions runs tests on every PR, deploys on merge to main

---

## API Reference

```
POST /api/auth/register   { email, password }
POST /api/auth/login      { email, password }

GET    /api/links                     → list user's links
POST   /api/links                     { url, slug?, title? }
DELETE /api/links/:id
GET    /api/links/:id/analytics

GET    /:slug             → 301 redirect (the hot path)
```

---

## Resume Bullets

> Built a production URL shortener handling redirects in <10ms via Redis caching; implemented sliding-window rate limiting and async click-event processing using BullMQ + PostgreSQL.
>
> Designed decoupled write path (queue → worker → DB) eliminating hot-path DB writes; achieved 80%+ test coverage with Jest unit and integration tests.
>
> Deployed on Railway + Vercel with GitHub Actions CI/CD; per-user analytics dashboard with device, browser, and referrer breakdown. [[Live Demo](#)]
