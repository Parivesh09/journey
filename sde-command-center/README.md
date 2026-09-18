# SDE Command Center

A small Next.js application for tracking a software engineering preparation roadmap. The roadmap source is `../sde-master-roadmap.json`; seeded tasks, categories, study sessions, and completion state are stored in PostgreSQL through Prisma.

## Local setup

Requirements: Node.js 20+, Docker, and npm.

```bash
npm install
docker compose up -d
npm run prisma migrate dev -- --name init
npm run seed
npm run dev
```

Open `http://localhost:3000`. The local PostgreSQL container uses port `5433` because port `5432` is already occupied on this machine.

## Daily maintenance

Use `/tasks` to work through the imported roadmap. Clicking a task status persists completion directly to PostgreSQL. Re-run `npm run seed` only when you intentionally want to refresh the imported roadmap; it recreates the seeded task list for the demo user.

Useful checks:

```bash
npm run lint
npm test
npm run build
curl http://localhost:3000/api/health
```

## Production deployment

The app is ready for a managed Next.js host such as Vercel and a managed PostgreSQL provider such as Neon, Supabase, or Railway.

1. Create a production PostgreSQL database and set `DATABASE_URL` to its connection string.
2. Set a strong random `AUTH_SECRET` and `NEXT_PUBLIC_APP_URL` in the host environment.
3. Deploy the repository with the default Next.js build command: `npm run build`.
4. Run `npm run db:migrate:deploy` against the production database.
5. Run `npm run seed` once from a machine where `sde-master-roadmap.json` is available.
6. Verify `/api/health` returns `{ "status": "ok", "database": "connected" }`.

Do not commit `.env`; it contains credentials. The current task routes use the seeded personal demo user and should remain behind private deployment access until authentication is enabled.
