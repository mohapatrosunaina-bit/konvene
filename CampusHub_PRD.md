# CampusHub — Product Requirements Document

**Tagline:** One platform for every event happening across your campus.
**Alternative names considered:** Campus Events OS, CampusConnect, UniFlow, EventSphere
**Version:** 1.0 | **Date:** 2026-09-20 | **Owner:** Sunaina Mohapatra (ENG24CT0058)

---

## 0. How to use this document

This PRD is written to be built from directly, not just read. Section order follows the build order: read 1–4 for *why*, 5–9 for *what*, 10–15 for *how* (data model, APIs, flows), 16 for *what to build today vs. later*, 17–18 for testing/deploy. If you only have one day, jump straight to **Section 16 (Phased Roadmap)** and use the rest as reference while building.

---

## 1. Problem Statement

College event lifecycles (registration → payment → ticketing → check-in → attendance → certification → follow-up) are currently stitched together from 6–8 disconnected tools: WhatsApp for comms, Google Forms for registration, Excel for tracking, Razorpay payment links for money, a QR generator website for tickets, Gmail for follow-up, Canva for posters, and a physical attendance sheet for credit. Club heads lose hours per event on manual reconciliation; faculty coordinators have no reliable way to verify who actually attended vs. who just registered; students have no single place to discover events, hold tickets, or prove attendance for academic credit. The cost of not solving this: wasted volunteer hours every event cycle, disputed/fraudulent attendance claims, no institutional memory of participation (a student's four years of activity is scattered across screenshots), and no data for departments to report participation to accreditation bodies (NAAC/NBA in the Indian context).

**Who experiences this:** club heads and core teams (organizing pain), faculty coordinators and subject faculty (verification pain), student attendees (discovery + proof-of-attendance pain), HODs/admin (visibility and reporting pain).

## 2. Goals

1. **Single source of truth for campus events** — every club's events discoverable in one place, replacing WhatsApp broadcast + Google Forms as the default registration path.
2. **Real, tamper-resistant check-in** — QR-based check-in that cannot be duplicated or spoofed, replacing manual sign-in sheets.
3. **Faculty-verified attendance tied to academic structure** — attendance credited only after the specific subject/class faculty confirms it, not a generic organizer click — this is a feature no generic event platform has, because none of them have a concept of "class," "section," or "subject faculty."
4. **Zero-manual certificate issuance** — certificates auto-generate and are independently QR-verifiable, eliminating Canva+manual-Google-Drive-link certificate distribution.
5. **One click from "event happens" to "usable data"** — live dashboards for club heads, faculty, and admin without exporting anything to Excel.

*Success is not measured by DAUs (this is a portfolio/campus project, not a VC-funded product) — it's measured by: does one real event run end-to-end on this platform without falling back to WhatsApp/Excel/Google Forms.*

## 3. Non-Goals (v1)

1. **Multi-university / multi-tenant SaaS** — v1 is single-university, hardcoded to one institution's department/branch list. Multi-tenancy is a real future architecture concern (see §15) but not built now — premature for a one-day build.
2. **Native mobile apps (iOS/Android)** — the volunteer scanner and student experience are mobile-web (PWA-capable), not App Store apps. Native wraps a working web app is a Phase 3 idea at best.
3. **WhatsApp Business API integration** — too much compliance/approval overhead for v1; email + in-app + push cover comms needs.
4. **ERP/LMS sync, NFC/RFID check-in, digital wallet passes** — explicitly designed for extensibility (see §15 Future Integrations) but not implemented.
5. **Full AI feature suite on day one** — AI assistant/poster generator/etc. are real, valuable, and specified (§9), but scoped to Phase 2/3 so the core transactional loop (register → check-in → attend → certify) is rock solid first.
6. **Payments, paid tickets, and coupons** — a deliberate scope decision, not a Phase-2 deferral: Konvene does not process payments at all. Every ticket type (Free/VIP/Volunteer/Speaker/Guest/Judge/Sponsor/Media/Workshop) is a free access tier distinguished by capacity, not price. This removes an entire category of PCI/compliance/webhook-security surface area that has no bearing on the platform's actual differentiators (QR check-in integrity, faculty-verified attendance). If a real deployment later needs paid ticketing, it should be scoped as its own future initiative, not bolted back on.

## 4. Personas & Primary Journeys

| Persona | Primary job to be done |
|---|---|
| **Student (Attendee)** | Discover an event → register (possibly pay) → receive QR ticket → get reminded → check in → attend → get attendance credited by faculty → download certificate |
| **Club Head** | Create event with registration form + ticket types → promote via announcements/email → monitor live registrations → run check-in on event day → see attendance/analytics → issue certificates |
| **Volunteer** | Scan attendee QR at the door → see instant identity + status → handle edge cases (no ticket, duplicate scan, VIP) |
| **Faculty Coordinator** | Approve club's event request → approve budget → approve attendance batch → approve certificate issuance |
| **Subject Faculty** | Review the list of *their own class's* students who checked into an event → confirm attendance → credit is now official for that subject |
| **HOD / Admin** | View department-wide and university-wide participation, revenue, and reporting for accreditation |

### Key end-to-end journey (student)
Browse events → filter by category/department/date → open event page (agenda, venue, FAQs) → click Register → fill custom form (branch/year/section/food pref/etc.) → select ticket type → pay if paid → receive QR ticket (email + in-app) → get day-before reminder → arrive, show QR → volunteer scans → status flips to Checked-In → after event, subject faculty sees them in a pending-attendance list for that subject → faculty approves → attendance credited → certificate auto-generates → student downloads/shares to LinkedIn.

## 5. RBAC Model

### 5.1 Roles (flat list, a user can hold multiple roles across different scopes)

`SUPER_ADMIN`, `ADMIN`, `HOD`, `FACULTY`, `FACULTY_COORDINATOR`, `CLUB_HEAD`, `CORE_TEAM`, `VOLUNTEER`, `STUDENT`, `GUEST`, `SPONSOR`, `JUDGE`, `SPEAKER`

Roles are **scoped**, not global (except SUPER_ADMIN/ADMIN): a user is `CLUB_HEAD` *of Club X*, `FACULTY` *of Department Y teaching Subject Z*, `FACULTY_COORDINATOR` *for Club X*. Model this as a `UserRoleAssignment(userId, role, scopeType, scopeId)` join table, not a single `role` column on `User`.

### 5.2 Permission Matrix

| Capability | Super Admin | Admin | HOD | Faculty Coordinator | Faculty (subject) | Club Head | Core Team | Volunteer | Student |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Manage university/department config | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create/edit club | ✅ | ✅ | approve | ❌ | ❌ | own club | ❌ | ❌ | ❌ |
| Create event | ✅ | ✅ | ❌ | approve | ❌ | own club | ✅ (draft) | ❌ | ❌ |
| Approve event for publish | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit registration form / ticket types | ✅ | ✅ | ❌ | ❌ | ❌ | own event | own event | ❌ | ❌ |
| View registrations/analytics | ✅ | ✅ | dept scope | club scope | ❌ | own club | own club | limited | own only |
| Run QR check-in | ✅ | ✅ | ❌ | ❌ | ❌ | own event | own event | assigned event | ❌ |
| Manual check-in override | ✅ | ✅ | ❌ | ❌ | ❌ | own event | own event | ✅ | ❌ |
| Mark attendance "Present" (from check-in) | ✅ | ✅ | ❌ | ❌ | ❌ | own event | own event | ✅ | ❌ |
| **Verify/credit attendance for a subject** | ✅ | ✅ | ❌ | ❌ | **✅ own subject only** | ❌ | ❌ | ❌ | ❌ |
| Approve certificate batch issuance | ✅ | ✅ | ❌ | ✅ | ❌ | request | ❌ | ❌ | ❌ |
| Issue/regenerate individual certificate | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Send announcements/email campaigns | ✅ | ✅ | dept | ❌ | ❌ | own club | own club | ❌ | ❌ |
| View own tickets/certificates/attendance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Register for events | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View audit log | ✅ | ✅ | dept scope | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

*Enforcement: every API route declares required `(role, scopeType)`; middleware resolves the user's `UserRoleAssignment` rows and checks scope match against the resource being accessed (e.g., event.clubId, subject.facultyId).*

## 6. Functional Requirements by Module

Each module lists P0 (must-have for a working end-to-end demo), P1 (should-have, do if time remains), P2 (future).

### 6.1 Auth & Identity
- P0: Email/password + Google OAuth login; JWT session (access + refresh token); role assignment on signup restricted to `STUDENT` by default, other roles granted by Admin.
- P0: College-email domain allowlist check at signup (e.g., must end in `@college.edu`) to gate self-serve student signup.
- P1: Magic link login; Microsoft OAuth.
- P2: Full SSO (SAML/OIDC against college IdP), phone OTP login.

### 6.2 User & Student Profile
- P0: Profile fields — Name, USN/Roll No, Department, Branch, Year, Semester, Section, Phone, Email, Avatar.
- P0: Profile shows: events registered, tickets, attendance history, certificates earned.
- P1: Badges/achievements, skills tags, club memberships shown on profile.
- P2: Public shareable profile page (portfolio-style).

### 6.3 Club Management
- P0: Club CRUD (Admin creates; Club Head edits own): name, logo, description, faculty advisor link.
- P0: Club member roster with role per member (Club Head / Core Team / Volunteer).
- P1: Social links, gallery, past-events auto-listing, committee structure.
- P2: Public club page with follower count / "follow this club" for personalized event feed.

### 6.4 Event Management
- P0: Event CRUD: title, slug (auto + editable), banner upload, description (rich text), category, date/time, venue (text), capacity, registration open/close dates.
- P0: Draft → Pending Approval → Published → Ongoing → Completed → Archived state machine (see §12.1).
- P0: Event detail page renders all fields publicly once Published.
- P1: Agenda/schedule builder (multi-session), FAQs, rules, brochure upload, sponsor logos, venue map embed.
- P2: Multi-day / multi-track events, recurring events.

### 6.5 Registration & Form Builder
- P0: Dynamic form builder — field types: short text, long text, single-select, multi-select/checkbox, file upload, and pre-built field templates (Department, Year, Semester, Branch, Section, Food Preference, T-Shirt Size, GitHub URL, LinkedIn URL, Portfolio URL, Emergency Contact).
- P0: Registration submission validated against form schema; creates `Registration` + `Ticket` records.
- P0: Capacity enforcement; when full, registrant is placed on `Waitlist`.
- P0: Waitlist auto-promotion — on a cancellation, the earliest waitlisted registration is promoted and notified.
- P1: Conditional fields (show field X only if answer to field Y = ...), resume upload, per-ticket-type custom fields.
- P2: Team/group registration (register a team of N with one form).

### 6.6 Ticketing
- P0: Ticket types per event — Free, VIP, Volunteer, Speaker, Guest, Judge, Sponsor, Media, Workshop — are free access tiers, each with its own capacity and optionally its own form fields. Konvene does not process payments (see Non-Goal #6); there is no "Paid" tier with a price.
- P0: Each successful registration generates exactly one `Ticket` with a unique ID, bound to one `QRCheckIn` record (see §6.7).
- P1: Ticket transfer (reassign a ticket to another registered email before the event).
- Out of scope entirely: paid ticketing, ticket resale/marketplace, coupons.

### 6.7 QR Ticketing & Check-in (must be real, not mocked)
- P0: On ticket creation, generate a signed payload `{ticketId, eventId, issuedAt}` HMAC-signed (or Ed25519-signed) server-side; encode as QR containing a compact token (JWT-like, base64url, short, e.g., `ticketId.signature`). **Do not just encode a plain UUID** — the signature is what prevents forgery.
- P0: Verification endpoint `POST /checkin/verify` re-validates the signature server-side, checks ticket status (`ISSUED` → transitions to `CHECKED_IN`; already `CHECKED_IN` → reject as duplicate; `CANCELLED`/`BLACKLISTED` → reject with reason) — this state transition must be atomic (DB transaction / row lock) so two volunteers scanning the same QR simultaneously can't both succeed.
- P0: Scanner UI (mobile-web camera scan via a library like `html5-qrcode` or `zxing`) shows instantly: photo, name, department/year, ticket type, and check-in result (success/duplicate/invalid/blacklisted).
- P1: Offline mode — scanner caches the event's valid ticket-signature public key client-side, can verify signature offline and queue check-in writes to sync when back online (signature check works offline since it's just crypto verification against a known public key; the *duplicate* check requires either periodic sync of already-checked-in IDs to a local cache, or accepting a small race window and reconciling after reconnect).
- P1: Manual check-in fallback (search by name/USN) for attendees who lost their QR — implemented (`/checkin/search`, `/checkin/manual`), routed through the same atomic state transition as a QR scan.
- P2: Dynamic/rotating QR (regenerates every N seconds) for anti-screenshot-sharing on high-demand tickets.

### 6.8 Attendance (core differentiator)
- P0: `CheckIn` (physical presence, from §6.7) is distinct from `Attendance` (academic credit). Checking in marks the ticket `CHECKED_IN` and creates an `AttendanceCandidate` row.
- P0: For each `AttendanceCandidate`, the system resolves *which subject(s)/faculty* this counts toward, using the student's current `Section`+`Semester` → `SubjectFacultyAssignment` for that section (see data model §11). If the event is tagged with a relevant subject/department (club head or coordinator tags it at event-creation time, e.g., "counts toward CS301 - Compiler Design"), the system creates a `PendingAttendance` row addressed to that subject's assigned faculty for that student's section.
- P0: Faculty dashboard lists `PendingAttendance` grouped by their subject + section; faculty can approve individually or bulk-approve a filtered list (e.g., "approve all CSE-3-A").
- P0: On approval, `PendingAttendance` → `Attendance` (credited); this is what makes the student "Certificate Eligible" for events that require faculty-verified attendance.
- P1: Faculty can reject with a reason (e.g., "left early") — student sees rejection reason on their profile.
- P2: ERP sync — push credited attendance to college ERP via API/CSV export.

### 6.9 Certificates
- P0: On `Attendance` credited (or, for events not requiring faculty verification, on `CHECKED_IN`), generate a PDF certificate server-side (templated HTML → PDF via a library like Puppeteer or `@react-pdf/renderer`) with: name, event title, date, unique certificate ID, and a QR code linking to a public verification page `/verify/:certId`.
- P0: Public verification page shows certificate validity + holder name + event without requiring login (protects against fake certificate claims).
- P1: Club-branded certificate templates (logo, signature image, custom layout).
- P2: Blockchain hash anchoring (store certificate hash on-chain or in a public append-only log) — genuinely optional, mostly a marketing/differentiator feature, not needed for verification integrity since server-side verification already works.

### 6.10 Payments — removed from scope
Not built, not planned. See Non-Goal #6. Every ticket issues immediately on registration (or on waitlist promotion) with no payment step in between.

### 6.11 Notifications & Comms
- P0: Transactional emails via Resend: registration confirmation (with QR ticket attached/linked), event reminder (24h before), certificate-ready notification.
- P0: In-app notification bell (DB-backed notification feed).
- P1: Club-initiated email campaigns (custom message to all registrants of an event); SMS for critical alerts (venue change).
- P2: WhatsApp Business API, push notifications (web push).

### 6.12 Community (per event)
- P1: Simple discussion/Q&A thread per event (not real-time chat for v1 — a threaded comment model is much faster to build correctly than sockets).
- P2: Real-time chat (Socket.IO), photo/file sharing wall, pinned organizer posts, attendee networking/directory.

### 6.13 Calendar
- P1: Personal calendar view (month/week) of the student's registered events inside the app.
- P2: Google/Outlook/Apple Calendar sync (.ics export is the pragmatic P1.5 — generate a downloadable `.ics` per ticket; live two-way sync is P2).

### 6.14 Dashboards & Analytics
- P0: **Club Head dashboard**: registrations over time, ticket-type breakdown, revenue, capacity/occupancy.
- P0: **Live check-in dashboard** (event day): registered vs. checked-in vs. no-show counts, updating on each scan.
- P0: **Faculty dashboard**: pending attendance approvals grouped by subject/section.
- P1: **Admin dashboard**: cross-club/department comparisons, top events, total revenue, certificate issuance counts.
- P1: Drop-off funnel (viewed event → started registration → completed registration → paid → checked in).
- P2: Demographic breakdowns (branch/year/gender) with charts.

### 6.15 Search & Discovery
- P0: Event listing page with filters: category, department/club, date range, free/paid.
- P1: Global search across events, clubs, and (for authorized roles) people.
- P2: Personalized recommendations ("events like ones you attended").

### 6.16 AI Features (see §9 for detail — all P2/Phase 3 unless noted)
AI Event Assistant, AI Poster Generator, AI Email Writer, AI Schedule Generator, AI Volunteer Assignment, AI Budget Estimator, AI Duplicate/Fraud Check-in Detection, AI Feedback Summarization — all Phase 3, specified but not built in the one-day MVP.

### 6.17 Audit Log
- P1: Every state-changing action (event approval, attendance credit, certificate issuance, refund) writes an `AuditLog` row: actor, action, target, timestamp, before/after snapshot where relevant. Not P0 for a demo, but cheap to add via a single Prisma middleware and worth doing early since it's a strong "this is a real system" signal.

## 7. Non-Functional Requirements (sized for a solo/portfolio project)

- **Security**: Passwords hashed (bcrypt/argon2) if not using OAuth exclusively; QR tokens cryptographically signed (§6.7) — this is the one place where cutting corners defeats the entire feature's purpose, so do not mock it; all mutating endpoints require auth + role check; file uploads restricted by type/size and scanned for extension spoofing (check MIME + magic bytes, not just extension); every Prisma query returning a `User` must use an explicit `select` rather than a bare `include: { user: true }`, so `passwordHash` is never accidentally serialized into a response.
- **Performance**: Event listing and check-in-scan response times should feel instant (<300ms typical) — achievable on Postgres with indexes on `eventId`, `ticketId`, `userId` foreign keys; no need for caching layers (Redis) at this scale unless you want to demo one for learning purposes.
- **Scalability**: Design the schema to *not paint yourself into a corner* (proper foreign keys, no denormalized role strings) but do not build for scale you don't have — single Postgres instance is fine.
- **Accessibility**: Semantic HTML, keyboard-navigable forms, sufficient color contrast (shadcn/ui defaults are solid here) — a full WCAG audit is out of scope for one day, but don't actively break it.
- **Reliability**: QR check-in must work even under bad campus wifi — hence the offline-mode requirement (§6.7 P1) is a real reliability requirement, not a nice-to-have, if you plan to actually run an event on this.
- **Data integrity**: Ticket check-in state transition must be atomic under concurrent scans (use a DB transaction with `SELECT ... FOR UPDATE` or an optimistic-concurrency version column).

## 8. Screen-by-Screen Wireframe Descriptions

*(Text wireframes — sufficient to build from; visual design system in §10.)*

1. **Landing / Event Discovery** — hero + search bar, filter chips (category/department/date/free-paid), grid of event cards (banner, title, club logo, date, "X spots left" or "Waitlist" badge).
2. **Event Detail Page** — banner, title, club + faculty advisor byline, date/time/venue block, tabbed body (Overview / Agenda / FAQs / Sponsors), sticky "Register" CTA showing spots remaining, dynamically switches to "Join Waitlist" when full, to "View My Ticket" once registered.
3. **Registration Form Page** — dynamically rendered from the event's form schema, ticket-type selector (radio cards), submit → signed QR ticket issued immediately (no payment step) → success screen with QR ticket + "Add to Calendar" (.ics download).
4. **My Tickets / Profile** — tabs: Upcoming, Past, Certificates. Each ticket card expands to show the QR code full-screen (for showing at the door).
5. **Club Head — Event Creation Wizard** — step 1 basics, step 2 form builder (drag-and-drop field list), step 3 ticket types, step 4 review → submit for approval.
6. **Club Head — Event Dashboard** — tabs: Overview (stats cards), Registrations (table, exportable CSV), Check-in (live counts), Attendance (list + faculty-approval status), Certificates (issue/regenerate).
7. **Volunteer — Scanner Screen** — full-screen camera viewfinder, on scan: slide-up card with photo/name/dept/status + big green/red result banner, manual-search fallback button.
8. **Faculty Dashboard** — list of pending attendance grouped by Subject → Section, checkbox multi-select + "Approve Selected" / row-level "Reject" with reason field, plus pending event/budget approvals if role is Faculty Coordinator.
9. **Admin Dashboard** — department/club leaderboard tables, revenue chart, pending-approvals queue (events, clubs, refunds).
10. **Public Certificate Verification Page** (`/verify/:certId`) — no login required, shows valid/invalid state + holder name/event/date if valid.

## 9. AI Features (Phase 2/3 specification)

| Feature | What it does | Data it needs | Phase |
|---|---|---|---|
| AI Event Assistant | Chat widget on event page answering "when is reporting time," "is food included" | Event description + FAQs as context, RAG or simple prompt-stuffing since per-event context is small | 2 |
| AI Poster Generator | Generates a promotional poster image from event title/description | Image-gen API (e.g., a diffusion model) + brand template | 3 |
| AI Email Writer | Drafts announcement/reminder email copy from a short prompt | Event metadata | 2 |
| AI Schedule Generator | Suggests an agenda given event type/duration | Event category, duration | 3 |
| AI Volunteer Assignment | Assigns volunteers to shifts/desks based on declared availability + past workload | Volunteer availability records | 3 |
| AI Budget Estimator | Estimates cost line items from event type/scale | Historical event budgets (needs a few real events of training data first) | 3 |
| AI Duplicate/Fraud Check-in Detection | Flags suspicious patterns (same device fingerprint checking in multiple tickets rapidly) | Check-in timestamps + device/IP metadata | 2 (this one is cheap: rule-based, not even needs an LLM) |
| AI Feedback Summarization | Summarizes free-text feedback responses into themes | Feedback table free-text answers | 2 |

*Recommendation: build fraud-detection (rule-based) and feedback summarization first — highest value-to-effort ratio and reuse existing data.*

## 10. Design System Direction

- **Base**: Tailwind CSS + shadcn/ui component primitives — gives you accessible, consistent components (dialogs, forms, tables, cards) without hand-rolling.
- **Motion**: Framer Motion for page transitions and the QR-scan success/fail feedback (a satisfying check-in animation matters more than it sounds for a "does this feel real" demo).
- **Type/Color**: pick one accent color per role context is unnecessary complexity — one brand accent (e.g., an indigo/violet, consistent with the "OS" positioning) + neutral grays + semantic colors for ticket/attendance status (`ISSUED`=blue, `CHECKED_IN`=green, `CANCELLED`=gray, `BLACKLISTED`=red, `WAITLISTED`=amber).
- **Density**: dashboards (club head, faculty, admin) use dense data-table layouts; public-facing pages (event discovery, event detail) use spacious marketing-style layouts — treat these as two different design modes within one system, same tokens.
- **Status badges**: every entity with a state machine (Event, Ticket, Registration, PendingAttendance, Certificate) gets a consistent badge component — reuse one `<StatusBadge status=... />` component keyed by a shared color map.

## 11. Data Model (ER-level detail)

Core entities and key fields/relations (Prisma-style shorthand):

```
University { id, name }
Department { id, universityId, name, code }
Branch { id, departmentId, name, code }              // e.g., CSE, ECE
Section { id, branchId, year, semester, name }        // e.g., CSE-3-A
Subject { id, branchId, semester, name, code }
SubjectFacultyAssignment { id, subjectId, sectionId, facultyUserId }  // THE key link for attendance verification

User { id, name, email, phone, passwordHash?, avatarUrl, usn?, createdAt }
StudentProfile { userId, branchId, sectionId, year, semester }        // 1:1 with User for students
UserRoleAssignment { id, userId, role, scopeType, scopeId }           // scopeType: CLUB | DEPARTMENT | SUBJECT | GLOBAL

Club { id, name, slug, logoUrl, description, facultyAdvisorUserId, departmentId }
ClubMember { id, clubId, userId, role }               // role: CLUB_HEAD | CORE_TEAM | VOLUNTEER

Event { id, clubId, title, slug, bannerUrl, description, category, venue,
        startAt, endAt, capacity, status, requiresFacultyAttendance, linkedSubjectId? }
EventForm { id, eventId, schemaJson }                 // form field definitions
Registration { id, eventId, userId, formResponseJson, ticketTypeId, status, createdAt }  // status: CONFIRMED | WAITLISTED | CANCELLED
TicketType { id, eventId, name, capacity }            // Free/VIP/Volunteer/etc. — all free, no price field
Ticket { id, registrationId, qrSignature, status, issuedAt }  // status: ISSUED | CHECKED_IN | CANCELLED | BLACKLISTED

CheckIn { id, ticketId, scannedByUserId, scannedAt, method }  // method: QR | MANUAL
AttendanceCandidate { id, checkInId, userId, eventId, subjectId?, sectionId? }
PendingAttendance { id, attendanceCandidateId, facultyUserId, status }  // status: PENDING | APPROVED | REJECTED
Attendance { id, userId, eventId, subjectId?, creditedByUserId, creditedAt }

Certificate { id, userId, eventId, certId (public), pdfUrl, issuedAt }

Announcement { id, clubId or eventId, title, body, sentAt }
Notification { id, userId, type, payloadJson, readAt }
EmailCampaign { id, eventId, subject, body, sentAt, recipientCount }

Sponsor { id, eventId, name, logoUrl, tier }
Feedback { id, eventId, userId, responsesJson, submittedAt }
AuditLog { id, actorUserId, action, targetType, targetId, beforeJson, afterJson, createdAt }
```

**Why this shape matters**: `SubjectFacultyAssignment` is the linchpin that makes attendance verification real instead of mocked — it's what lets the system compute "this student's Compiler Design faculty this semester is Prof. X" instead of hardcoding it. `AttendanceCandidate` → `PendingAttendance` → `Attendance` is a three-stage pipeline specifically so "checked in physically" and "credited academically" are never conflated (a common shortcut that would make this feature fake).

## 12. State Machines

### 12.1 Event
`DRAFT → PENDING_APPROVAL → PUBLISHED → ONGOING → COMPLETED → ARCHIVED` (with `REJECTED` and `CANCELLED` as terminal side-branches from `PENDING_APPROVAL`/`PUBLISHED`).

### 12.2 Registration / Ticket
`Registration`: `CONFIRMED | WAITLISTED | CANCELLED` — cancellation of a `CONFIRMED` registration triggers waitlist-promotion logic.
`Ticket`: `ISSUED → CHECKED_IN` (via scan/manual) ; `ISSUED → CANCELLED` ; any → `BLACKLISTED` (admin action).

### 12.3 Attendance Pipeline
`CheckIn created → AttendanceCandidate created → PendingAttendance(PENDING) → faculty action → PendingAttendance(APPROVED|REJECTED) → Attendance row created only on APPROVED → Certificate eligibility flag set`.

## 13. REST API Surface (by module)

```
Auth:            POST /auth/signup, POST /auth/login, POST /auth/oauth/google, POST /auth/refresh
Users:           GET /users/me, PATCH /users/me, GET /users/:id/profile
Clubs:           GET /clubs, GET /clubs/:slug, POST /clubs (admin), PATCH /clubs/:id, POST /clubs/:id/members
Events:          GET /events, GET /events/:slug, POST /events, PATCH /events/:id,
                 POST /events/:id/submit-for-approval, POST /events/:id/approve,
                 POST /events/:id/reject, POST /events/:id/revise, GET /events/pending-approval/mine
Forms:           GET /events/:id/form, PUT /events/:id/form
Registrations:   POST /events/:id/register, GET /events/:id/registrations, DELETE /registrations/:id
Tickets:         GET /tickets/:id, GET /tickets/mine
Check-in:        POST /checkin/verify, POST /checkin/manual, GET /checkin/search, GET /events/:id/checkin-stats
Attendance:      GET /faculty/pending-attendance, POST /pending-attendance/:id/approve, POST /pending-attendance/:id/reject
Certificates:    POST /events/:id/issue-certificates, GET /certificates/mine, GET /verify/:certId (public)
Announcements:   POST /clubs/:id/announcements, POST /events/:id/email-campaign
Analytics:       GET /events/:id/analytics, GET /clubs/:id/analytics, GET /admin/analytics
Search:          GET /search?q=&category=&department=&dateFrom=&dateTo=
Audit:           GET /admin/audit-log
```

## 14. Sequence Walkthroughs

**Registration**: Client `POST /events/:id/register` → server validates form against schema + capacity → if the ticket type is at capacity, registration is `WAITLISTED` and the flow ends there; otherwise → server creates `Ticket(ISSUED)` with a signed QR token in the same request (no payment step — see Non-Goal #6) → sends confirmation email with QR. On a later cancellation, the earliest `WAITLISTED` registration is promoted and issued a ticket the same way.

**Event Approval**: Club head `POST /events/:id/submit-for-approval` → `DRAFT → PENDING_APPROVAL` → the club's Faculty Coordinator sees it via `GET /events/pending-approval/mine` → `POST /events/:id/approve` (`→ PUBLISHED`) or `POST /events/:id/reject {reason}` (`→ REJECTED`) → a rejected event's club head calls `POST /events/:id/revise` (`→ DRAFT`) to edit and resubmit.

**QR Check-in**: Volunteer scans QR → client decodes token → `POST /checkin/verify {token}` → server verifies signature → `SELECT ticket FOR UPDATE` → if `ISSUED`, transition to `CHECKED_IN`, create `CheckIn` + `AttendanceCandidate` rows in same transaction → return attendee info to scanner UI. If already `CHECKED_IN`, return `409 duplicate` with original scan timestamp.

**Attendance Verification**: Nightly (or on-demand) job resolves each `AttendanceCandidate` → looks up `SubjectFacultyAssignment` for `(student's sectionId, event's linkedSubjectId)` → creates `PendingAttendance(PENDING)` addressed to that faculty → faculty dashboard query `GET /faculty/pending-attendance` filters `PendingAttendance` where `facultyUserId = me` → faculty bulk-approves → server transitions rows to `APPROVED` and inserts `Attendance` rows in a transaction.

**Certificate Issuance**: Triggered per-event (club head or coordinator action, or auto-triggered when `Event.status = COMPLETED` and all required `Attendance` rows exist for attendees) → for each eligible user, render HTML template → PDF → upload to storage → create `Certificate` row with public `certId` → email student a download link.

## 15. Technical Architecture & Future Integrations

**Architecture**: Next.js 15 (App Router) frontend on Vercel; Express or NestJS API on Railway/Render; PostgreSQL on Supabase/Neon via Prisma; Cloudinary for images (banners, avatars, certificates), S3-compatible bucket for documents (brochures, resumes); Resend for transactional email; Socket.IO only if/when live chat (§6.12 P2) is built — otherwise skip the realtime infra entirely and use polling/SSE for the live check-in dashboard counter, which is far simpler to get right in one day. No payment gateway in the stack at all (see Non-Goal #6).

**Auth**: Better Auth (self-hosted, no vendor lock-in, good Next.js integration) recommended over Clerk for a project you want full schema control over (Clerk manages its own user table, which fights the custom `UserRoleAssignment`/`StudentProfile` model this PRD needs).

**Extensibility for future integrations** (build the seams, not the features): keep `Attendance` crediting behind a service interface so an ERP-sync adapter can later subscribe to "attendance credited" events; keep `Ticket` QR payload versioned (`v: 1` in the signed token) so a future NFC/wallet-pass format can coexist; keep calendar `.ics` generation as a pure function so Google/Outlook two-way sync can wrap it later without touching core registration logic.

## 16. Phased Roadmap

### Phase 0 — done, built and verified end-to-end
1. Auth (email/password), scoped RBAC (`UserRoleAssignment` with role + scopeType + scopeId), seed script with an Admin, Faculty (also Faculty Coordinator), Club Head, and Students.
2. Club CRUD, event CRUD with dynamic (not hardcoded) registration form builder.
3. **Event approval workflow**: `DRAFT → PENDING_APPROVAL → PUBLISHED`, gated by the club's Faculty Coordinator (or Admin), with `REJECTED → DRAFT` revision.
4. Free ticket types with capacity, waitlist, and auto-promotion on cancellation — no payment step anywhere (see Non-Goal #6).
5. **QR generation + signed verification + scanner UI** — HMAC-signed tokens, atomic race-safe check-in, verified against forged-signature and duplicate-scan attempts.
6. **Manual check-in fallback** (search by name/USN), routed through the identical atomic state transition as a QR scan.
7. Full attendance pipeline: `CheckIn` → `AttendanceCandidate` → routed to the *actual subject faculty* via `SubjectFacultyAssignment` → `PendingAttendance` → faculty approves/rejects → `Attendance` credited.
8. Certificate PDF generation + public no-login verify page.
9. Club-head dashboard (live stats + scanner + manual check-in + registrations) and faculty dashboard (pending attendance + pending event approvals).

### Phase 1 (next)
Email notifications via Resend (registration confirmation, reminders, certificate-ready), admin dashboard (cross-club/department analytics), `.ics` calendar export.

### Phase 2 (following weeks)
AI feedback summarization + rule-based fraud/duplicate-check-in detection, community/Q&A threads, club-branded certificate templates, an audit log viewer UI (the `AuditLog` table itself already records event approvals/rejections).

### Phase 3 (future)
Full AI suite (poster/email/schedule generation, AI event assistant), real-time chat, ERP sync, NFC/RFID check-in, wallet passes, native mobile, multi-university tenancy.

Payments, paid ticketing, and coupons are not on this roadmap at any phase — see Non-Goal #6.

## 17. Testing Strategy (lean)

- **Must test manually end-to-end before calling it done**: one full run of register → get QR → scan check-in → faculty approves attendance → certificate generates → verify page shows it valid. This single manual run is worth more than a large automated suite for a one-day build.
- **Automate only the QR signature verification logic** (pure function, easy to unit test, and the one place a silent bug would be catastrophic — e.g., a forged QR being accepted). A handful of Jest/Vitest tests: valid signature accepted, tampered payload rejected, expired/wrong-event token rejected, double-scan rejected.
- **Skip**: full E2E browser test suites, load testing — not proportionate to project scope.

## 18. Deployment Plan

1. Postgres on Supabase/Neon (free tier is sufficient for a demo).
2. API on Railway/Render (free/hobby tier), env vars for DB URL, JWT secret, QR signing secret, Resend API key, Cloudinary keys.
3. Frontend on Vercel, pointed at the deployed API.
4. Seed script populates: one University, 2-3 Departments/Branches/Sections/Subjects, a couple of Clubs, a handful of demo Users across every role, and 1-2 sample Events — so the deployed instance is demoable immediately without manual data entry.
5. Smoke-test the full journey (§17) against the deployed environment, not just localhost, before sharing the link.

---

*End of PRD. This document is intentionally structured so Section 16 can be read alone as a day-one checklist, while Sections 5, 11–14 serve as the reference spec to build each piece correctly rather than as a mock.*
