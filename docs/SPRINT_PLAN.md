# Sprint plan

This document turns the roadmap in [`CampusHub_PRD.md`](../CampusHub_PRD.md#16-phased-roadmap) into an actionable backlog. It is a planning proposal, not a claim that these features are already implemented.

## Where to find and track sprints

- Read this file for the proposed sprint goals, scope, and acceptance checks.
- Track work in GitHub Issues and a GitHub Project board for this repository. Create one issue per deliverable, add it to the board, and assign it to a sprint/iteration. If no board exists yet, open the repository's **Projects** tab and create one; this plan does not create or populate a board.
- Keep the board as the live status source of truth; update this document when priorities change.

## Working agreement

- Use a two-week sprint as a starting point; adjust to the team's availability.
- At sprint planning, choose a sprint goal, assign an owner to every selected issue, and confirm the work fits available capacity. Keep unplanned work visible rather than silently expanding scope.
- An issue is done when its acceptance checks pass, relevant tests and checks pass, permissions and failure states are handled, and user-facing documentation is updated.
- Review the demo at sprint end and carry unfinished work forward explicitly.

## Proposed sequence

### Sprint 1 — Reliable email notifications

**Goal:** Deliver the Phase 1 transactional email foundation without breaking registration or attendance flows.

**Candidate issues:** Configure the email provider and environment variables; send registration confirmations; send event reminders; send certificate-ready notices; document local development behavior.

**Acceptance checks:**
- Each notification is sent only for the corresponding successful product event, and failures are logged and surfaced without losing the underlying registration, reminder, or certificate operation.
- Email content contains correct event details and links, and does not expose another user's information.
- Provider credentials are configured through environment variables and are never committed.
- Tests cover successful delivery behavior and provider failure behavior; local setup and deployment instructions are documented.

### Sprint 2 — Admin dashboard

**Goal:** Give admins a useful cross-club view of platform activity, as described in the PRD.

**Candidate issues:** Define the minimum dashboard metrics; implement authorized API data access; build the dashboard UI with empty, loading, and error states.

**Acceptance checks:**
- Only authorized admin roles can access the dashboard data and page.
- Metrics are based on existing records and accurately describe events, registrations, check-ins, attendance, and certificates.
- Do not display revenue or paid-ticket metrics: paid tickets and payment processing are explicitly out of scope for Konvene.
- Tests cover authorization and representative metric calculations.

### Sprint 3 — Calendar export and Phase 1 verification

**Goal:** Complete the remaining Phase 1 calendar work and verify the whole Phase 1 slice.

**Candidate issues:** Generate an `.ics` download for a user's registered events; add a clear calendar-export action; run a regression pass across email, dashboard, and export flows.

**Acceptance checks:**
- Export includes only the signed-in user's eligible registered events and uses the event's correct title, time, and location.
- Calendar data is valid and handles special characters and time zones safely.
- The user can download the export from the relevant ticket or event area, and empty/error states are clear.
- The end-to-end Phase 1 flows and CI checks pass; README roadmap text reflects the delivered status.

### Sprint 4 — Audit log viewer (Phase 2 candidate)

**Goal:** Make the existing audit records useful to authorized administrators.

**Candidate issues:** Review which state-changing actions are currently recorded; add a paginated, read-only audit log API/view; show actor, action, target, and timestamp; add filters only where the data supports them.

**Acceptance checks:**
- The viewer is restricted to authorized roles and does not expose sensitive snapshots or secrets.
- Entries are read-only and ordered consistently; pagination does not duplicate or omit records.
- Tests cover authorization, pagination, and empty results.

## Backlog after these sprints

Revisit the PRD's Phase 2 items (event Q&A, rule-based duplicate-check-in detection, club-branded certificates, and remaining audit-log capabilities) after Sprint 4. Split each into a separate issue with measurable acceptance checks before scheduling it. Keep Phase 3 AI, chat, integrations, and mobile work out of the near-term sprint commitments unless priorities change.

## Sprint planning checklist

- [ ] Agree on one sprint goal and review the current board.
- [ ] Break each selected feature into small, testable issues linked to this repository.
- [ ] Add owners, acceptance checks, dependencies, and estimates (if the team uses estimates).
- [ ] Confirm scope fits capacity and identify blockers.
- [ ] At sprint end, demo completed work, record follow-ups, and update the board and roadmap.
