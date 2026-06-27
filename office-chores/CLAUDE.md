# Office Chores Manager

Shared-screen calendar app for managing recurring office tasks. No authentication — single view for the whole team. Built to run on one local office machine.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite 5 |
| Calendar | @fullcalendar/react v6 (daygrid, timegrid, interaction plugins) |
| State | Zustand (global UI) + FullCalendar's own event cache |
| Backend | Node.js + Express + TypeScript (ts-node) |
| Database | Node.js built-in `node:sqlite` (DatabaseSync) — NOT better-sqlite3 |
| Date math | date-fns v3 |
| Dev runner | concurrently (root) |

> **Node.js v26 note:** The project uses `node:sqlite` (built-in) rather than `better-sqlite3` because better-sqlite3 has no prebuilt binary for Node 26 and native compilation is avoided.

## Key Directories

```
office-chores/
├── server/src/
│   ├── db/           # DatabaseSync singleton, schema.sql, transaction() helper
│   ├── routes/       # One file per resource: chores, instances, teamMembers, notifications, cron
│   ├── services/     # recurrenceService.ts — pure date math, no DB calls
│   ├── types/        # Server-side domain types
│   └── index.ts      # Express wiring (port 3001)
└── client/src/
    ├── api/          # Single typed fetch wrapper (api.chores.*, api.instances.*, ...)
    ├── components/   # calendar/, chores/, layout/, team/ subdirectories
    ├── hooks/        # useNotifications.ts (60s poll + visibilitychange)
    ├── store/        # appStore.ts — Zustand global store
    └── types/        # Client-side types (mirrors server types)
```

## Commands

```bash
# Install (first time)
npm install --prefix server
npm install --prefix client
npm install                   # root (concurrently only)

# Dev (starts both servers)
npm run dev                   # server :3001, client :5173

# TypeScript checks (run from each subdir)
cd server && node node_modules/.bin/tsc --noEmit
cd client && node node_modules/.bin/tsc --noEmit
```

## Data Flow at a Glance

1. `App.tsx` — on mount, calls `POST /api/cron/extend` (extends recurrence instances 90 days out) and loads team members into Zustand
2. `CalendarView.tsx` — passes an async `events` function to FullCalendar; it fetches `GET /api/instances?start=&end=` on each navigation
3. After any mutation, `triggerCalendarRefetch()` increments `calendarRefetchKey` in Zustand, which `CalendarView` watches to call `refetchEvents()`
4. `useNotifications` polls `GET /api/notifications` every 60s

## Database

- Schema: [server/src/db/schema.sql](server/src/db/schema.sql)
- DB file: `server/data/chores.db` (WAL mode, foreign keys ON)
- Override path with `DB_PATH` env var (used for testing)
- Four tables: `team_members`, `chores`, `recurrence_rules`, `chore_instances`

## Adding New Features or Fixing Bugs

**IMPORTANT**: When you work on a new feature or bug, create a git branch first. Then work on 
changes in that branch for the remainder of the session.

## Additional Documentation

- [.claude/docs/architectural_patterns.md](.claude/docs/architectural_patterns.md) — Zustand conventions, API client pattern, SQLite quirks, recurrence pre-generation, date handling, soft-delete, route structure
