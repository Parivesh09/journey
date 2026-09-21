# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Self-directed software-engineering interview candidates preparing for product-company
SDE roles. They work solo, on a laptop, in long late-evening and late-night desk
sessions after a working day, with a target around 3.5 focused hours a day (roughly
100 minutes of DSA, 75 minutes of a main subject, 35 minutes of revision/project).
The product is multi-user with strict per-account data isolation, but each user's
experience is a private, personal workspace, not a shared team tool.

## Product Purpose

Turn a 10–12 month, 350–450-problem SDE syllabus into something a single person can
actually run day to day: a gated milestone path that only unlocks as prerequisites
are finished, composed each day into a short focus list of routines plus pinned
roadmap tasks. Success means the user always knows the next concrete thing to do and
can see honest progress without administrating a tool. Optional reminders exist for
accountability; nothing is enabled by default.

## Positioning

The roadmap is mastered and immutable, then *copied* into per-user task instances.
That single mechanism makes two things true that neighbors do not offer: milestones
gate each other by real prerequisite state (so the path is a sequence, not a
checklist), and the day can be assembled from any subset — daily routines plus
freely pinned roadmap tasks — while still rolling up to the same roadmap progress.

## Operating Context

- Evening/late-night desk sessions on a laptop, low ambient light.
- Work is interrupted by real life; the tool is opened in short check-ins as well as
  long sessions.
- The roadmap spans many technical categories (DSA, C++, JS/TS, React, Node,
  SQL/DBMS, OS, Networks, Docker, LLD/HLD, projects, interview prep) and two shipped
  templates: "SDE Master Roadmap" and "Full Stack Web Development".
- Reminders are delivered by browser, email, or SMS; each channel is opt-in and off
  by default, computed per user timezone with quiet hours and daily caps.

## Capabilities and Constraints

- Next.js 16 (App Router) + React 19, Prisma/PostgreSQL, Tailwind CSS 4, lucide-react.
- Domain vocabulary: task status (todo/in-progress/completed/skipped), priority,
  task type (concept, practice, implementation, project, revision, interview, mock),
  difficulty (easy/medium/hard), planned vs estimated minutes, daily slot, categories,
  phases, topics, milestones, prerequisites, daily pins, daily routines, study
  sessions, daily study target.
- Auth is a signed HTTP-only session cookie; all reads/writes are scoped by userId
  server-side and ID tampering returns 404. Client-supplied user ids are never trusted.
- Existing API routes, mutations, and business logic are fixed constraints for this
  redesign: presentation and information architecture may change, behavior may not.
- No new runtime dependencies are required.

## Brand Commitments

- Product name: "SDE Command Center".
- Voice: direct, calm, factual, second person. No hype, no streak/gamification
  language, no manufactured urgency.

## Evidence on Hand

- Real roadmap content: `sde-master-roadmap.json` and `roadmaps/fullstack-v1.json`.
- Real default study plan and category/task-type taxonomy in `lib/data/mock-data.ts`
  and in the roadmap metadata.
- No customer testimonials, benchmarks, pricing, logos, or photography exist. Future
  work must not fabricate commercial claims.

## Product Principles

1. Always answer "what is the next concrete thing to do" faster than the user can
   re-derive it.
2. Progress must be honest: gated, counted, and specific, never inflated by streaks.
3. The interface disappears into the work; it never asks to be admired or managed.
4. Personal and quiet, built for one person at a desk late at night, not a corporate
   admin console.
5. Anything that can be derived from the roadmap is derived, never re-entered.

## Accessibility & Inclusion

- Keyboard-operable controls with visible focus.
- Must remain legible in a dark, low-light environment: contrast is a requirement,
  not a preference.
- No known product-specific accommodation beyond the above.
