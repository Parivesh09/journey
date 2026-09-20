# SDE Command Center

A multi-user SDE preparation and accountability app. Every user gets their own
copy of the default SDE roadmap, daily plans, progress, study sessions, settings,
and notification preferences — with strict server-side data isolation.

## Architecture

```text
SYSTEM DATA
  Roadmap templates (sde-master-roadmap.json)  →  per-user task instances
  Default daily-plan blocks                     →  per-user daily tasks
  Default configuration (all notifications OFF)

USER (per account)
  Tasks / Progress · Daily plans · Study sessions
  Notification preferences · Settings · Reminders
```

The master roadmap is the immutable source of truth. A user's roadmap is created
by copying the template into rows owned by that user (`tasks.sourceId` =
template id). Users edit, delete, reschedule, and mark their own instances;
templates are never mutated.

Authentication uses a signed, expiring, HTTP-only session cookie
(`lib/auth.ts`). Every user-owned API handler resolves the authenticated user
from the session cookie (`requireUser()`); client-supplied user identifiers are
never trusted for ownership. All reads/writes are scoped with `userId`.

## Local setup

Requirements: Node.js 20+, Docker, npm.

```bash
npm install
docker compose up -d          # PostgreSQL (5433) + Redis (6379) with volumes
npm run db:migrate:deploy      # apply migrations
npm run seed                   # dev-only user + default roadmap (optional)
npm run dev                    # http://localhost:3000
```

open `http://localhost:3000`, create an account, and sign in.

## Commands

| Task               | Command                          |
| ------------------ | -------------------------------- |
| Install            | `npm install`                    |
| Database startup   | `docker compose up -d`           |
| Migration (apply)  | `npm run db:migrate:deploy`      |
| Migration (dev)    | `npm run prisma migrate dev`     |
| Seed (dev-only)    | `npm run seed`                   |
| Development        | `npm run dev`                    |
| Lint               | `npm run lint`                   |
| Typecheck          | `npx tsc --noEmit`               |
| Test               | `npm test` (vitest)              |
| Build              | `npm run build`                  |

## Multi-user behavior

- Sign up → the default roadmap is provisioned as *your* tasks; nothing you do
  ever touches another account.
- All task/plan/session/progress/notification queries are scoped to the
  authenticated user on the backend.
- ID tampering (e.g. `/api/tasks/<someone-else's-id>`) returns 404.
- Notifications are **opt-in**: every channel defaults to OFF. A phone number
  alone never triggers SMS — the matching channel must be enabled.
- Reminders are computed per user in their own timezone and deduplicated per
  `(userId, date, slot, type)`. Four reminder types exist: **daily** (today's
  tasks), **missedTasks** (overdue), **revisionReview** (revision due today),
  and **weeklySummary** (past-7-days stats, fired only on the user's chosen
  weekday). Sending always checks: active user → reminder type enabled →
  channel enabled → valid contact → opted in → not already sent.

## Reminder cron

The scheduled job (`/api/notifications/remind`, guarded by `CRON_SECRET`) loops
over active users and sends only to enabled channels. Manual dry run:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/notifications/remind?dryRun=true
```

Browser reminders are delivered to an open tab only when the user enables the
browser channel (see `app/notifications/browser-listener.tsx`).

## Production notes

- Set a strong `AUTH_SECRET` and `CRON_SECRET`.
- Do not commit `.env`; use `.env.example` as the template.
- Run migrations with `npm run db:migrate:deploy` — never edit the database by
  hand.
- Existing single-user data (previously owned by `user@sdecommand.center`)
  remains owned by that account; keep its existing data by seeding a password
  for it with `SEED_USER_EMAIL`/`SEED_USER_PASSWORD`, or leave it untouched.
- Redis is provisioned for future rate-limiting/queue work; it is not required
  by the current reminder flow (HTTP cron).
- External delivery (email via `SMTP_*`, SMS via Linq) is
  only unit/dry-run tested: without live credentials the providers return clean
  "disabled" results. The cron is effectively a dry run until those credentials
  are configured in the runtime environment.