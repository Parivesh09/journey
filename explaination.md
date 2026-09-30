# SDE Command Center - Project Overview

## Executive Summary

The SDE Command Center is a sophisticated multi-user Software Development Engineer (SDE) preparation and accountability platform designed for self-directed professionals preparing for product company interviews. The product operates under the **"Lamp-Lit Response Sheet" philosophy** — a calm, print-inspired workspace optimized for late-night study sessions where users work solo on laptops with 3.5 focused hours daily (roughly 100 minutes DSA, 75 minutes main subject, 35 minutes revision).

The platform delivers a **single source of truth roadmap system** that gates milestones based on real prerequisite completion, ensuring users always know the next concrete action without overwhelming interface distractions. All data is strictly isolated per account with server-side authentication and no client-trusted identifiers.

## Core Architecture

### Data Model & Architecture

```
SYSTEM DATA → per-user task instances → daily plans → progress tracking
  │
  ├─ Master roadmap templates (sde-master-roadmap.json)
  ├─ Default study plan (lib/data/mock-data.ts)
  ├─ User configuration (notifications OFF by default)
  └─ Per-user task instances (tasks.sourceId = template id)
```

### Technology Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Database**: Prisma + PostgreSQL with @prisma/adapter-pg
- **State Management**: Redux Toolkit + React-Redux
- **Styling**: Tailwind CSS 4 with custom design tokens
- **Authentication**: NextAuth.js with HTTP-only session cookies
- **Icons**: lucide-react
- **Validation**: Zod for runtime type safety

### Multi-User Behavior

- Sign up → default roadmap auto-provisioned as _your_ tasks only
- All backend queries scoped by authenticated `userId` server-side
- ID tampering attempts return 404 (no client-trusted identifiers)
- Notification channels opt-in by default (OFF)
- Reminders deduplicated per `(userId, date, slot, type)`

## Key Systems

### 1. Authentication & Authorization

- **Mechanism**: Signed, expiring HTTP-only session cookies (`lib/auth.ts`)
- **Security**: `requireUser()` middleware resolves users server-side
- **Isolation**: All reads/writes scoped by userId, no client-provided identifiers
- **Session**: 7-day expiration, HMAC SHA-256 signing with AUTH_SECRET

### 2. Roadmap System

**Immutable Master Roadmaps** (350-450 quality DSA problems, 10-12 months):

- `sde-master-roadmap.json` - Primary SDE roadmap
- `roadmaps/fullstack-v1.json` - Full Stack Web Development template

**User-Specific Instantiation**:

- Templates copied to `tasks.sourceId = template id`
- Templates never mutate (single source of truth)
- Milestones gate each other based on real prerequisite completion
- Daily assembly from routines + freely pinned tasks

### 3. Daily Planning & Task Management

- **Study Strategy**: DSA (100min) + Main subject (75min) + Revision (35min)
- **Task Types**: concept, practice, implementation, project, revision, interview, mock
- **Difficulty Levels**: easy/medium/hard
- **Priorities**: critical/high/medium/low
- **Status Values**: todo/in_progress/completed/skipped
- **Categories**: DSA, C++, JavaScript, React, Node.js, SQL, DBMS, OS, Networks, Docker, LLD/HLD, System Design, Projects, Interview, etc.

### 4. AI Provider System

**Database-Driven Architecture** (ARCHIFY_AI_PROVIDER_SYSTEM.md):

- **Protocol Support**: OpenAI Compatible, Anthropic Messages, Gemini
- **Encryption**: AES-256-GCM for API keys (AI_PROVIDER_ENCRYPTION_KEY)
- **Provider Types**: SYSTEM (built-in) + CUSTOM (user-defined)
- **REST API**: Full CRUD for providers + connection testing
- **Security**: No API keys exposed to client-side, SSRF protection, rate limiting

### 5. Notification System

**Four Reminder Types**:

- **daily** (today's tasks)
- **missedTasks** (overdue)
- **revisionReview** (revision due today)
- **weeklySummary** (past-7-days stats)

**Delivery Channels**:

- **Browser**: Service worker + browser listener (`app/notifications/browser-listener.tsx`)
- **Email**: SMTP-based
- **SMS**: Linq provider integration

**Delivery Logic**:

```plaintext
active user → reminder type enabled → channel enabled → valid contact → opted in → not already sent
```

## Design System: "Lamp-Lit Response Sheet"

### Core Materials

- **Ink Room** (`#0a0c10`): Dark chrome, navigation, empty space
- **Paper Sheet** (`#ece0c6`): Warm, ruled, finite work area
- **Highlighter Amber** (`#d99a2b`): Primary accent
- **Stamp Red** (`#a83226`): Errors, alerts
- **Valid Green** (`#2f6b4f`): Success, completed milestones

### Typography

- **UI Text**: Archivo (display: 1.9rem/700, headline: 1.05rem/600, body: 0.875rem/400, label: 0.68rem/600 uppercase)
- **Data**: Roboto Mono (0.72rem/400) for numbers, dates, IDs, metadata

### Layout

- **Desktop**: Fixed left navigation spine (16rem) + centered sheet (max-width: 1120px)
- **Mobile**: Collapsible top navigation, account block at page foot
- **Sheet Style**: 3px radius, offset shadow (`0 26px 60px -30px rgba(0,0,0,0.95)`), top light wash

### Interaction Patterns

- **Completion**: Instant bubble fill (no crossfade)
- **Highlighters**: Left-swipe highlight on completion (≈460ms)
- **Navigation**: Numbered index with active state (amber dot + amber index)
- **Focus**: Amber selection, caret, focus ring; thin ink scrollbars

## User Experience Flows

### 1. Onboarding & Setup

1. User signs up → default roadmap auto-provisioned
2. System performs baseline assessment (timed DSA problems, tech questions)
3. User sets 3-4 hour daily study window
4. Optional: Enable notification channels (browser/email/SMS)

### 2. Daily Workflow

1. User opens app → Dashboard shows today's plan
2. Progress tracked via completion bubbles and study time
3. Next Action clearly indicates what's needed
4. Can add new tasks or browse roadmaps based on state
5. Study sessions logged via FocusLog component

### 3. Roadmap Navigation

1. User browses roadmap library or continues active roadmap
2. Milestone drawer shows prerequisite completion status
3. Tasks filtered by due date, category, priority
4. Progress tracked across phases (Setup → DSA Foundation → Core DSA → Advanced DSA → C++ → JavaScript → React → Node.js → REST APIs → Security)

### 4. Settings & Preferences

- **Profile**: Name, timezone, daily study target, theme
- **Notifications**: Per-channel enable/disable (browser/email/SMS)
- **Roadmaps**: Enable/disable specific roadmaps
- **Onboarding**: Dismiss banner, study strategy preferences

## Development & Operations

### Setup Commands

```bash
# Initial setup
npm install
docker compose up -d                    # PostgreSQL (5433) + Redis (6379)
npm run db:migrate:deploy               # apply migrations
npm run seed                           # dev-only user + default roadmap

# Development
npm run dev                            # http://localhost:3000

# Maintenance
npm run db:migrate:deploy               # production migrations (never edit DB manually)
npm run seed                           # dev data refresh
```

### Environment Variables

- `AUTH_SECRET`: Session signing secret (production required)
- `CRON_SECRET`: Authorization for scheduled reminder endpoint
- `DATABASE_URL`: PostgreSQL connection string
- `AI_PROVIDER_ENCRYPTION_KEY`: 32-byte hex for API key encryption
- `AI_DEFAULT_PROVIDER`: Default provider slug ("openai", "freellmapi")
- `SMTP_*`: Email configuration
- `TELEGRAM_BOT_TOKEN`: Telegram notifications
- `LINQ_*`: SMS/WhatsApp configuration

### Build & Test

- **Lint**: `npm run lint`
- **Type Check**: `npx tsc --noEmit`
- **Test**: `npm test` (Vitest)
- **Build**: `npm run build`

### Production Notes

- Set strong `AUTH_SECRET` and `CRON_SECRET`
- Do not commit `.env` (use `.env.example` template)
- External delivery (email/SMS) only unit/dry-run tested without live credentials
- Redis provisioned for future rate-limiting/queue work

## Business & Product Context

### Target Users

Self-directed software engineering interview candidates preparing for product company roles, working solo during late-night desk sessions after working days.

### Study Commitment

- **Target**: 3.5 focused hours daily
  - DSA: 100 minutes
  - Main subject: 75 minutes
  - Revision/Project: 35 minutes
- **Duration**: 10-12 months
- **Scope**: 350-450 quality DSA problems + CS fundamentals + frontend/backend/databases/infrastructure/system design + projects + interview preparation

### Competitive Advantages

1. **Gated Progress**: Milestones unlock based on real prerequisite completion (sequence, not checklist)
2. **Daily Assembly**: Combine routines + freely pinned tasks from same roadmap
3. **Quiet Design**: No streaks/gamification, no manufactured urgency
4. **Print-Like Interface**: Legible in low light, warm materials, no digital distractions
5. **Strict Isolation**: Each user's workspace is private, no shared team toolfeel

## Development & Architecture Decisions

### Why This Architecture?

1. **Single Source of Truth**: Master roadmap + per-user task copies eliminates data divergence
2. **Server-Side Security**: No client-trusted identifiers prevents ID tampering
3. **Calm Interface**: Print-inspired design reduces cognitive load during intense study
4. **Extensible Roadmap System**: JSON-based templates support multiple professional tracks
5. **Database-Driven AI**: Provider system replaces environment variables with encrypted, configurable API management

### Technical Trade-offs

- **TypeScript First**: Full type safety at build time
- **Tailwind CSS 4**: Atomic classes + design token pipeline
- **Next.js App Router**: Server components + streaming SSR
- **Redux Toolkit**: Predictable state management with middleware support
- **Prisma ORM**: Type-safe database access with PostgreSQL

## Verification & Quality

### Design System Verification

1. **Theme Switching**: Dark/light mode works correctly
2. **Semantic Classes**: All design tokens (`bg-paper`, `text-bone`, etc.) functional
3. **Navigation Usability**: Clear sections with proper visual hierarchy
4. **Mobile Responsive**: Works on 320-1920px screen sizes
5. **Completion Interactions**: Bubble fills instantly with amber afterglow
6. **Accessibility**: Keyboard navigation, semantic HTML, sufficient contrast

### Product Principles Applied

- **Always answer**: "what is the next concrete thing to do" faster than user can derive
- **Honest Progress**: Gated, counted, specific (never inflated by streaks)
- **Interface Disappears**: Into the work, no admiration/management prompts
- **Personal & Quiet**: Built for solo late-night desk sessions
- **Derive Everything**: No re-entry of roadmap-derived information

This architecture delivers a **premium, production-quality SDE preparation tool** that helps users systematically master software engineering fundamentals while maintaining the focused, calm mindset needed for intensive interview preparation.
