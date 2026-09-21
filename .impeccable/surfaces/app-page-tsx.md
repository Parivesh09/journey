---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/tasks/page.tsx","app/settings/page.tsx","app/login/page.tsx","app/signup/page.tsx"]
---

# Surface brief — SDE Command Center

Mode: **Operate** (authenticated task workspace). Platform: web. Target: whole app,
primary route `/` (`app/page.tsx`); related: `/tasks`, `/settings`, `/login`, `/signup`.

## Scope

Redesign every user-facing surface of an existing multi-user SDE-prep app. Behavior,
API routes, mutations, business logic, data model, and auth stay byte-identical.
Presentation, design system, and page composition change completely. Routes may be
regrouped but must remain reachable at their current paths.

## Audience, job, action

A self-directed SDE-interview candidate at a desk late at night. Job: know the single
next concrete thing to do and see honest progress on a 10–12 month curriculum. Action:
mark a task/routine complete, pin a roadmap task into today, move through gated
milestones. Constraints: low ambient light; short check-ins and long sessions; dense
lists must stay fast to scan; no gamification, no cold enterprise tone.

## Chosen direction

**Lamp-lit response sheet** — the candidate's own OMR/practice booklet at 1am:
deep blue-black room as ground, warm lamp-lit paper sheets carrying the work, ruled
response rows, numbered sections, bubble completion, highlighter as attention state,
stamps for overdue. Nav is the booklet spine/contents. Raised by: Concourse grid
(columns never move; only values change), Struck state (hard ink commit, no crossfade,
one-beat afterglow), Horizon ramp (progress as one continuous dark→light ramp),
Focus lift (keyboard focus is the only motion), Integer grid (strict modular grid).
Seed key: `e5d90909`. Memorable moment: a bubble fills with ink and a highlighter
swipe crosses the row as the task completes.

## Unresolved decisions

Exact font choice is delegated to the build (Archivo + Roboto Mono intended, subject
to availability). No approved comp exists (code-led; no image generation available).

## Direction contract

**THESIS.** Every view is one lit paper sheet in a dark room, not a glowing admin
console. It refuses the deep-slate card grid, the big-number metric hero, the sidebar
of emoji nav items, and the cyan-on-navy AI dashboard default.

**OWN-WORLD.** Ink ground `#0a0c10` with raised ink `#12161d` and hairline rules
`#262c36`; lamp paper `#ece0c6` with graphite ink `#2a2419`; highlighter amber
`#d99a2b`; stamp red `#b23a2f`; valid ink green `#2f6b4f`. Components: ruled rows,
numbered response bubbles, printed section headers with a rule beneath, dog-eared
paper sheets, margin annotations, tabbed booklet index. No glass, no gradients, no
rounded-2xl cards, no colored side borders.

**STORY.** The visitor opens the app and sees the section to work on now, printed as
a response sheet. Completion is a filled bubble plus a highlighter swipe. Locked
milestones read as sections not yet open, with the blocking prerequisite printed
beside them. Progress reads as one continuous ramp, never a badge. They leave knowing
what moved and what is next.

**FIRST VIEWPORT.** A slim ink spine at left holds the booklet contents (Dashboard,
Tasks, DSA, Study, Revision, Settings) and the account block at its foot. The main
column is a single warm paper sheet: a printed header with the date and daily target,
then the numbered Today response list as the dominant mass, with a hand-annotated
margin column at right carrying the progress ramp, next-up note, and seven-day
cadence ticks. The first unfilled bubble is the primary action.

**FORM.** OMR/practice response booklet (candidate 3 of the 7-candidate grounded list),
seed key `e5d90909`.

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish
review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
