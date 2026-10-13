# BJB-AB
Project Repository for EduTrack

> Migration in progress: the app is being rebuilt with Astro on Cloudflare Workers and D1.
> See `docs/cloudflare-migration-plan.md`. The old Express/MongoDB app lives in `legacy/` until the migration is done.

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
