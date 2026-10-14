# Konvene

[![CI](https://github.com/mohapatrosunaina-bit/konvene/actions/workflows/ci.yml/badge.svg)](https://github.com/mohapatrosunaina-bit/konvene/actions/workflows/ci.yml)
[![CD](https://github.com/mohapatrosunaina-bit/konvene/actions/workflows/deploy.yml/badge.svg)](https://github.com/mohapatrosunaina-bit/konvene/actions/workflows/deploy.yml)

**One platform for every event happening across your campus.**

Made by **Sunaina Mohapatra** (ENG24CT0058)

Konvene is the operating system for campus communities — clubs, departments, and student chapters run every event (hackathons, workshops, fests, conferences) through one connected platform instead of WhatsApp + Google Forms + Excel + a QR generator + Gmail + a paper attendance sheet.

**Konvene does not process payments.** Every ticket type is free (Free/VIP/Volunteer/Speaker/etc. are access tiers with their own capacity, not price points). There is no payment gateway, checkout, or coupon system in this project.

Full product spec: [`CampusHub_PRD.md`](./CampusHub_PRD.md) (the PRD predates the "Konvene" name — treat every "CampusHub" reference in it as this project).  
CI/CD Architecture: [`docs/CICD_PIPELINE.md`](./docs/CICD_PIPELINE.md).

## What's real in this repo right now (Phase 0 MVP)

Nothing here is mocked. Specifically:

- **Signed QR tickets** — each ticket's QR encodes an HMAC-SHA256-signed token (`apps/api/src/lib/qr.ts`). Forged tokens are rejected before the DB is even queried.
- **Atomic check-in** — the check-in state transition (`apps/api/src/routes/checkin.ts`) uses a conditional `UPDATE ... WHERE status = 'ISSUED'`, so two volunteers scanning the same ticket at the same instant cannot both succeed. Verified under a real concurrent-duplicate test (see below).
- **Faculty-verified attendance tied to real academic structure** — `SubjectFacultyAssignment` links a subject + section to the actual faculty teaching it. When a student checks in to an event tagged with a subject, the system resolves *that specific faculty member* (not a generic organizer) and routes the attendance credit to them for approval (`apps/api/src/routes/faculty.ts`).
- **Real PDF certificates** — generated server-side with PDFKit, each with a unique certificate ID and an embedded QR that resolves to a public, no-login verification page.
- **Working registration → waitlist → auto-promotion** flow.
- **Event approval workflow** — club heads submit `DRAFT` events for approval; only the club's Faculty Coordinator (or an Admin) can move an event to `PUBLISHED`, with a `REJECTED` state that routes back to the club head for revision (`apps/api/src/routes/events.ts`).
- **Manual check-in fallback** — search by name/USN and check in an attendee whose QR is lost or unreadable, routed through the exact same atomic state transition as a QR scan (`apps/api/src/routes/checkin.ts` → `/checkin/search`, `/checkin/manual`).

This is genuinely runnable end-to-end locally — see Quickstart.

## Architecture

```
apps/
  api/    Express + TypeScript + Prisma (SQLite locally, swap to Postgres for prod)
  web/    Next.js 15 (App Router) + React 19 + Tailwind
```

Why SQLite for dev: zero external setup — clone, install, migrate, seed, run. The schema uses `String` fields (with documented valid values) instead of native Prisma enums, specifically because SQLite doesn't support them; promoting to native Postgres enums is a one-line datasource change plus enum blocks, see the comment at the top of `apps/api/prisma/schema.prisma`.

## Quickstart

```bash
# 1. install everything
npm install

# 2. set up the API
cd apps/api
cp .env.example .env
npx prisma migrate dev --name init   # creates dev.db and seeds demo data
npm run dev                           # http://localhost:4000

# 3. in a second terminal, set up the web app
cd apps/web
cp .env.example .env.local 2>/dev/null || echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local
npm run dev                           # http://localhost:3000
```

Demo accounts (seeded, password `password123` for all):

| Email | Role |
|---|---|
| `admin@konvene.dev` | Admin |
| `faculty@konvene.dev` | Faculty (CS301 — Compiler Design) |
| `clubhead@konvene.dev` | Club Head (GDSC) |
| `student1@konvene.dev` / `student2@konvene.dev` | Students |

`faculty@konvene.dev` is also seeded as GDSC's **Faculty Coordinator** — same login, two hats — so it can both approve GDSC's events and verify CS301 attendance.

Two seeded events let you walk both loops immediately:

- **Compiler Hackfest 2026** — already `PUBLISHED` and linked to CS301.
  1. Log in as a student → open the event → register → get a QR ticket.
  2. Log in as the club head → `/club/gdsc/dashboard` → start the scanner (or use the manual check-in search) → check the student in.
  3. Log in as faculty (`/faculty`) → the checked-in student appears in *Pending Attendance* → approve.
  4. As club head, call `POST /events/:id/issue-certificates` (a dashboard button for this is Phase 1) → the student's certificate appears under **My Tickets → Certificates**, and its QR resolves to a public `/verify/:certId` page.
- **Intro to Kotlin Workshop** — seeded in `PENDING_APPROVAL`.
  1. Log in as `faculty@konvene.dev` → `/faculty` → the *Events Awaiting Your Approval* section shows it → Approve (or Reject with a reason).
  2. Approving flips it to `PUBLISHED` and it appears on the public discovery page immediately.

## Roadmap

See PRD §16 for the full phased plan. Snapshot:

- **Phase 0 (done)** — auth, clubs, events, dynamic registration forms, free ticketing, waitlist, signed QR check-in, manual check-in fallback, faculty-verified attendance, event approval workflow, PDF certificates, club-head and faculty dashboards.
- **Phase 1** — email notifications (Resend), admin dashboard, .ics calendar export.
- **Phase 2** — community/Q&A threads, rule-based duplicate/fraud check-in detection, AI feedback summarization, audit log UI (the `AuditLog` table already records event approvals/rejections — a viewer UI is what's missing).
- **Phase 3** — full AI suite (poster/email/schedule generation, AI event assistant), real-time chat, ERP sync, wallet passes, native mobile, multi-university tenancy.

Payments and coupons are explicitly **not** part of this project's scope — see the note above.

## Security notes

- QR signing secret and JWT secret are separate (`.env` — never commit real values; `.env.example` has placeholders).
- Every Prisma query that returns a `User` uses an explicit `select` (never a bare `include: { user: true }`), so `passwordHash` is never serialized into an API response — this was audited and fixed across every route (clubs, events, faculty, checkin, certificates).
- File uploads (Phase 1+) must be validated by content, not just extension.
