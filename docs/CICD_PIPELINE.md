# CI/CD Pipeline Architecture & Operations Manual

This document provides a comprehensive overview of the Continuous Integration and Continuous Deployment (CI/CD) pipelines built for **Konvene** using **GitHub Actions**.

---

## 1. Pipeline Architecture Overview

The system consists of two dedicated GitHub Actions workflows:
1. **Continuous Integration (CI)**: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
   - Triggers on:
     - Push to `main` branch.
     - Pull requests targeting `main`.
     - Manual dispatch via GitHub Actions UI (`workflow_dispatch`).
   - Features parallel execution jobs, concurrency cancellation for superseded commits, and fallback resilience.
2. **Continuous Deployment (CD)**: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
   - Triggers on:
     - Direct pushes/merges to `main`.
     - Manual dispatch (`workflow_dispatch`) with environment targeting (`production` or `staging`) and migration toggle.
   - Executes database schema migrations and automated cloud deployment.

```
                  Developer Git Push / Pull Request
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │  GitHub Actions Runner  │
                     │  (Node.js 22 Active LTS)│
                     └────────────┬────────────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
            ▼                     ▼                     ▼
     ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
     │ Validate API │      │ Validate Web │      │Security Audit│
     │(Prisma/tsc)  │      │(Next.js 15)  │      │ (npm audit)  │
     └──────┬───────┘      └──────┬───────┘      └──────┬───────┘
            │                     │                     │
            └─────────────────────┼─────────────────────┘
                                  ▼
                            All CI Passes
                                  │
                                  ▼  (on merge to main)
                     ┌─────────────────────────┐
                     │ Continuous Deployment   │
                     │ (Prisma Migrate + Deploy│
                     └─────────────────────────┘
```

---

## 2. Monorepo Structure

Konvene is managed as an npm workspaces monorepo:
- **`apps/api`**: Express + TypeScript backend API using Prisma ORM & Supabase Auth/Storage.
- **`apps/web`**: Next.js 15 App Router frontend with React 19, Tailwind CSS, Framer Motion, and QR scanners.

The pipeline independently validates both workspaces in parallel, ensuring that changes to shared schemas, API contracts, or client components cannot break the build.

---

## 3. Detailed Workflow Breakdown

### A. CI Workflow (`ci.yml`)

| Job | Steps | Purpose |
| :--- | :--- | :--- |
| **`validate-api`** | 1. Checkout repository<br>2. Setup Node.js 22 + npm cache<br>3. `npm ci` with `DATABASE_URL` fallback<br>4. `npm run prisma:generate`<br>5. `npm run typecheck:api`<br>6. `npm run build:api` | Verifies Prisma ORM client generation, strict TypeScript static types, and Express server compilation. |
| **`validate-web`** | 1. Checkout repository<br>2. Setup Node.js 22 + npm cache<br>3. `npm ci`<br>4. `npm run typecheck:web`<br>5. `npm run build:web` with fallback Supabase envs | Validates Next.js static evaluation, React 19 components, CSS bundling, and production build generation. |
| **`security-audit`** | 1. Checkout repository<br>2. Setup Node.js 22 + npm cache<br>3. `npm audit --audit-level=critical` | Scans all monorepo dependencies for critical vulnerabilities without breaking standard PR workflows. |

### B. CD Workflow (`deploy.yml`)

| Job | Trigger & Execution | Purpose |
| :--- | :--- | :--- |
| **`database-migrations`** | Runs on `main` merge or manual release | Executes `npx prisma migrate deploy` against the target Postgres/Supabase instance if `DATABASE_URL` secret is provided; safely warns and skips if running unconfigured. |
| **`deploy`** | Runs following migration check | Verifies monorepo production bundle generation and triggers deployment to Vercel via CLI when `VERCEL_TOKEN` is configured. |

---

## 4. Key Configurations & Resiliency Measures

### Build-time Environment Injection
Next.js statically analyzes routes during `next build`, requiring dummy values when live secrets are unavailable:
```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co' }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key' }}
```
- **With Secrets Configured**: Evaluates against your project's staging/production Supabase keys.
- **Without Secrets Configured (e.g. forks, unconfigured CI)**: Seamlessly falls back to placeholders so pull requests still build and validate without leaking credentials or failing.

### Concurrency Optimization
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```
If a developer pushes multiple commits in rapid succession to the same branch or PR, GitHub Actions automatically halts superseded runs, saving runner minutes and providing faster feedback.

### Dependency Caching
By configuring `cache: "npm"` on `actions/setup-node@v4`, GitHub Actions stores `~/.npm` across workflow runs, cutting setup time by up to 70%.

---

## 5. Repository Secrets Reference

To configure deployment and live services, add the following secrets in **GitHub Repo > Settings > Secrets and variables > Actions**:

| Secret Name | Required For | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Production CD & Migrations | Postgres connection pooling URI from Supabase. |
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend & Auth | Supabase project API URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend & Auth | Public Supabase anonymous client key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend Admin Operations | Backend-only administrative key. |
| `QR_SIGNING_SECRET` | Backend QR Signature | HMAC-SHA256 secret for tamper-proof QR tickets. |
| `VERCEL_TOKEN` | Production CD (Optional) | Vercel Personal Access Token for automated CLI deployment. |
| `VERCEL_ORG_ID` | Production CD (Optional) | Vercel Organization ID. |
| `VERCEL_PROJECT_ID` | Production CD (Optional) | Vercel Project ID. |
