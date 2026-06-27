# Architectural Patterns

## 1. Split Zustand Store: Global UI vs. Calendar Data

Calendar event data is intentionally **not** in Zustand. It lives inside FullCalendar's own cache, fetched via the `events` async function prop.

**What Zustand owns** ([client/src/store/appStore.ts](../../client/src/store/appStore.ts)):
- `currentView` — which FullCalendar view (month/week/day)
- `selectedInstance` — the chore occurrence shown in the detail panel
- `choreFormOpen` / `choreFormChore` — modal open state
- `teamMembers` — loaded once on mount, mutated optimistically

**Calendar refetch trigger pattern** (appears in CalendarView + every mutation site):
```
triggerCalendarRefetch()   // increments calendarRefetchKey in store
  → useEffect watches calendarRefetchKey
    → calendarRef.current?.getApi().refetchEvents()
```
Every component that mutates an instance or chore calls `triggerCalendarRefetch()` after the API call. See [client/src/components/chores/ChoreDetailPanel.tsx](../../client/src/components/chores/ChoreDetailPanel.tsx).

## 2. Single Typed API Client

All HTTP calls go through one object in [client/src/api/index.ts](../../client/src/api/index.ts). The private `request<T>()` helper handles headers, error parsing, and JSON parsing once. The public `api` object is namespaced by resource:

```ts
api.chores.create(payload)
api.instances.complete(id)
api.teamMembers.delete(id)
```

Adding a new endpoint means adding one method to the relevant namespace — never writing `fetch()` directly in a component.

## 3. node:sqlite Double-Cast Pattern

`node:sqlite`'s `DatabaseSync` returns `Record<string, SQLOutputValue>` from `.get()` and `.all()`, which TypeScript won't directly cast to domain types. The fix used throughout all route files is:

```ts
// Not valid:
.get(id) as TeamMember
// Required:
.get(id) as unknown as TeamMember
.all() as unknown as TeamMember[]
```

Every query result cast in the routes follows this pattern. See [server/src/routes/teamMembers.ts](../../server/src/routes/teamMembers.ts):8.

## 4. Transaction Helper (Exported from database.ts)

`better-sqlite3`'s `db.transaction()` wrapper doesn't exist in `node:sqlite`. A manual `transaction<T>()` helper is exported from [server/src/db/database.ts](../../server/src/db/database.ts):20 and imported wherever bulk inserts occur:

```ts
import db, { transaction } from '../db/database';

transaction(() => {
  for (const d of dates) stmt.run(choreId, d, assigneeId);
});
```

Used in: [server/src/routes/chores.ts](../../server/src/routes/chores.ts):23 and [server/src/routes/cron.ts](../../server/src/routes/cron.ts):24.

## 5. Recurrence Pre-Generation (Rolling 90-Day Window)

Recurring chore occurrences are **pre-written to `chore_instances`** rather than computed on query time. This makes calendar queries a single indexed `SELECT` and lets per-occurrence overrides (assignee, notes, status) live as plain row columns.

The rolling window pattern:
- On chore create/edit → generate instances from today → today+90 days
- On app mount → `POST /api/cron/extend` checks rules where `generate_until < today+60d` and extends to today+90d
- `UNIQUE(chore_id, due_date)` on `chore_instances` makes generation idempotent (`INSERT OR IGNORE`)

Generation logic lives purely in [server/src/services/recurrenceService.ts](../../server/src/services/recurrenceService.ts) — no DB calls, making it independently testable.

## 6. Local Date Handling (Timezone-Safe)

All dates are stored and manipulated as `YYYY-MM-DD` strings. `new Date('2024-01-15')` treats the string as UTC and can shift by a day in negative-UTC-offset timezones. Instead, `recurrenceService.ts` uses private helpers:

```ts
// parseLocalDate: "2024-01-15" → new Date(2024, 0, 15)  [local time]
// formatLocalDate: Date → "2024-01-15"
```

These helpers appear at [server/src/services/recurrenceService.ts](../../server/src/services/recurrenceService.ts):12-22 and are used for every date comparison inside `generateInstances`.

On the client, dates from the API are used as-is (strings). When parsing for display, use `.replace(/-/g, '/')` before passing to `new Date()` to force local-time parsing. See [client/src/components/chores/ChoreDetailPanel.tsx](../../client/src/components/chores/ChoreDetailPanel.tsx).

## 7. Soft-Delete for Chores

Chores are never hard-deleted. `DELETE /api/chores/:id` sets `is_active = 0` and removes only **pending** future instances (preserving completed/skipped history). All queries filter `WHERE c.is_active = 1`.

Team members are hard-deleted; `ON DELETE SET NULL` foreign keys automatically clear `assignee_id` references. See [server/src/db/schema.sql](../../server/src/db/schema.sql):12,35.

## 8. Route-Per-Resource Structure

Each Express router handles exactly one resource and is mounted in [server/src/index.ts](../../server/src/index.ts). The `chores.ts` route is the most complex because it orchestrates both the `chores` table and `recurrence_rules` + `chore_instances` side effects. The rule: if a route needs to touch more than one table, it still lives in the resource file that owns the primary object — it calls `transaction()` and helper functions rather than growing a separate coordinator.

## 9. Types Duplicated Between Server and Client

`server/src/types/index.ts` and `client/src/types/index.ts` contain the same domain interfaces. There is no shared package. When changing a type (e.g., adding a field to `ChoreInstanceRow`), update both files. The API contract is the source of truth, not a shared type package.
