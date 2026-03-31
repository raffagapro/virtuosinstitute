# Data Model

> Phase 1 (Marketing site) has no database. This document will grow as the companion app schema is defined in Phase 3.

---

## Phase 1 — No Database

The marketing site is fully static. The lead/enrollment form will submit to an external service (TBD: API route + email provider, or Formspree). No tables required.

---

## Phase 3 — Companion App (TBD)

Schema and tables will be defined when companion app scope is confirmed. Expected entities:

- `profiles` — user identity (parents, staff, admins)
- `students` — student records linked to parent profiles
- `messages` or `threads` — parent ↔ staff communication
- `announcements` — school-wide or class-level notices

This section will be updated when Phase 3 design begins.

---

## TypeScript Types

Shared contracts live in `types/`. When Supabase is introduced, generated types (`types/database.types.ts`) will be the source of truth for table shapes.
