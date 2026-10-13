# EduTrack
Project Repository for EduTrack

Astro app on Cloudflare Workers with a D1 (SQLite) database and Google sign-in.
Live at https://edutrack.rosenbergab.com.

# Setup

## Requirements
- Node.js 22.12 or later

No database needs to be installed: `npm run dev` and the tests use a local D1 (SQLite) database.

## Clone and install
```bash
git clone "https://github.com/MuschBenne/Edutrack.git" && cd Edutrack
npm install
npm run db:migrate:local   # creates the local database tables
```

Create `.dev.vars` in the project root (never commit it):
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ADMIN_EMAILS=you@example.com
```
The Google OAuth client needs `http://localhost:4321/api/auth/google/callback` and `https://edutrack.rosenbergab.com/api/auth/google/callback` as authorized redirect URIs.

# Running
```bash
npm run dev       # dev server at http://localhost:4321
npm run build     # production build
```

# Testing
```bash
npm test          # Vitest, runs inside the Workers runtime against a fresh local D1
npm run check     # type checking
```

# Deploying
```bash
npm run db:migrate:remote   # apply new migrations to the production database first
npm run deploy              # build and upload to Cloudflare
```
Secrets are set once with `npx wrangler secret put GOOGLE_CLIENT_ID` (and `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAILS`).

# Architecture

- **Stack:** Astro (`output: 'server'`) on Cloudflare Workers, D1 (SQLite, Western Europe) for all data, Google sign-in via Arctic. Schema in `migrations/`, queries in `src/db/`, pages and form endpoints in `src/pages/`.
- **Sign-in:** a random session token in an HttpOnly cookie; only its SHA-256 hash is stored (`auth_sessions`). New users sit in `pending_signups` (15 min) until they pick username, university and programme. `ADMIN_EMAILS` decides who is admin and is re-checked on every login.
- **Forms:** plain HTML forms that POST and redirect (303) with a message or error code. Astro's origin check blocks cross-site POSTs; the middleware adds security headers.
- **Charts:** `src/scripts/courseCharts.ts` (Chart.js from npm, bundled by Astro). The page only embeds date, minutes and type per session (`src/lib/chartData.ts`).

## Courses
- A course is unique per university, code and term (`1dl 201` is stored as `1DL201`). Creating one that exists just registers you to it, keeping its name and grading scale.
- Users can create at most 5 new courses per day (`MAX_COURSES_PER_DAY`); admins are exempt. Admins can rename, delete and change the grading scale of courses (grades not on the new scale are cleared).
- Grading scales: U/G, U/G/VG, U/3/4/5 and A–F. Final grades live in `enrollments.final_grade`.

## Personal data
- Wellbeing ratings count as health data (GDPR art. 9), so they are optional (`migrations/0004_optional_wellbeing.sql`) and never sent to the charts.
- Users can unregister from a course or delete their account; related rows go with `ON DELETE CASCADE`. Keep `src/pages/privacy.astro` in sync with what is stored.

## Staying on the free tier
| Resource | Free limit | Notes |
| --- | --- | --- |
| Worker requests | 100,000 / day | Static files in `public/` and `/_astro/` don't count |
| CPU time | ~10 ms / request | No password hashing; one D1 round trip per page via `db.batch()` |
| D1 reads / writes | 5M / 100k rows per day | Stats are computed in SQL on indexed columns |
| D1 storage | 5 GB | A few MB |

Anonymous visits never query D1 (the middleware only looks up a session when the cookie exists), and expired logins are cleaned up on each new login, so no cron job is needed. KV is not used.
