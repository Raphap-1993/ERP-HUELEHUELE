# Premium Negro Prod Aroma Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the missing `premium-negro` aroma variants to production without replacing or reseeding the production database.

**Architecture:** Add a guarded, idempotent Prisma backfill that creates only `HG-PN-002` and `HG-PN-003` when missing. The script is dry-run by default, requires an explicit `--apply --confirm premium-negro-aromas-2026-06-23` pair to mutate data, and in production also requires `HUELEGOOD_ALLOW_PRODUCTION_PREMIUM_NEGRO_AROMAS=1`.

**Tech Stack:** TypeScript, Prisma, Node test runner with `tsx`, existing production backup and smoke scripts.

---

### Task 1: Backfill Logic And Tests

**Files:**
- Create: `scripts/backfill-premium-negro-aroma-variants.ts`
- Create: `scripts/backfill-premium-negro-aroma-variants.test.ts`
- Modify: `package.json`

- [x] **Step 1: Write failing tests**

Create tests that prove the backfill target list contains only `HG-PN-002` and `HG-PN-003`, skips already existing SKUs, rejects production apply without the guard env var, and requires the confirm token for apply mode.

- [x] **Step 2: Run tests to verify RED**

Run: `node --import tsx --test scripts/backfill-premium-negro-aroma-variants.test.ts`
Expected: fail because the script module does not exist yet.

- [x] **Step 3: Implement minimal script**

Implement the target variant definitions, argument parsing, production guard, dry-run output, transaction that creates missing variants, and warehouse balance creation using existing production warehouse data. Do not update existing variants.

- [x] **Step 4: Run tests to verify GREEN**

Run: `node --import tsx --test scripts/backfill-premium-negro-aroma-variants.test.ts`
Expected: pass.

### Task 2: Local Verification

**Files:**
- No new files.

- [x] **Step 1: Run dry-run locally**

Run: `npm run catalog:backfill-premium-negro-aromas -- --dry-run`
Expected: script prints missing or existing SKU plan and `apply=false`.

- [x] **Step 2: Run focused typecheck/test checks**

Run: `node --import tsx --test scripts/backfill-premium-negro-aroma-variants.test.ts`
Run: `npm run typecheck -w @huelegood/web`
Expected: both pass.

### Task 3: Production Backup And Apply

**Files:**
- No new files.

- [x] **Step 1: Backup production**

Run production backup before any mutation.
Expected: backup command exits 0 and prints backup paths.

- [x] **Step 2: Dry-run against production**

Run the backfill on the VPS without `--apply`.
Expected: production reports `HG-PN-002` and `HG-PN-003` as missing.

- [x] **Step 3: Apply against production**

Run with `NODE_ENV=production HUELEGOOD_ALLOW_PRODUCTION_PREMIUM_NEGRO_AROMAS=1 --apply --confirm premium-negro-aromas-2026-06-23`.
Expected: only missing SKUs are created; existing production data is preserved.

- [x] **Step 4: Verify production API**

Run: `curl -fsS https://api.huelegood.com/api/v1/store/products/premium-negro`
Expected: `variantCount` and `variants.length` are 3, with `HG-PN-001`, `HG-PN-002`, and `HG-PN-003` active.

- [x] **Step 5: Verify production page**

Fetch or open `https://huelegood.com/producto/premium-negro`.
Expected: product page contains the variant selector copy `Elige tu aroma`.
