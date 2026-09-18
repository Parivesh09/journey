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

## Reminders

GitHub Actions runs the reminder workflow every four hours from `.github/workflows/reminders.yml`. The app selects only the earliest incomplete task scheduled for today. It creates one task-and-slot record, so the same task cannot be fanned out twice for the same four-hour slot. After a task is completed, the next scheduled run selects the next incomplete task; completed and skipped tasks are never reminded.

Set these production variables:

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-sender@example.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=your-sender@example.com
LINQ_ENABLED=true
LINQ_API_KEY=your-linq-api-key
LINQ_API_BASE_URL=https://api.linqapp.com/api/partner/v3
LINQ_TO=+919302998876
CRON_SECRET=a-long-random-secret
```

Email and SMS are sent server-side. Chrome notifications are delivered while the app is open in a browser tab: the browser listener polls for the same deduplicated reminder and requires notification permission. A browser tab that is fully closed needs Web Push/VAPID infrastructure, which is not included in this simple first release.

For a safe manual scheduler test, call `/api/notifications/remind?dryRun=true` with `Authorization: Bearer $CRON_SECRET`. It reports the next task, dedupe slot, channel readiness, and provider configuration without sending anything. Calling `/api/notifications/remind` without `dryRun=true` can send real email and SMS when a new four-hour slot is available.

## GitHub Actions scheduler

Add these repository secrets in **GitHub → Settings → Secrets and variables → Actions**:

```text
CRON_URL=https://your-deployed-app.example.com/api/cron/reminders
CRON_SECRET=the-same-value-as-your-production-CRON_SECRET
```

The workflow sends a request every four hours. The application-side dedupe key prevents duplicate reminders and keeps the four-hour reminder policy in one place.
