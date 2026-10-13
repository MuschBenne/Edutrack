# BJB-AB
Project Repository for EduTrack

Astro app on Cloudflare Workers with a D1 (SQLite) database and Google sign-in.
See `docs/cloudflare-migration-plan.md` for the architecture and the move from Express/MongoDB.

# Setup

## Requirements
- Node.js 22.12 or later

No database needs to be installed: `npm run dev` and the tests use a local D1 (SQLite) database.

## Clone and install
```bash
git clone "https://github.com/FrickTown/BJB-AB.git" && cd BJB-AB
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
