# Engineering Framework

Mirrors PRD §6. Full text: `docs/PRD-Engineering-Framework.md`.

## 6.1 Current state — standalone Next.js + Supabase app

The phase-5 migration was pulled forward, at the user's explicit request,
ahead of phases 3-4 — once Transformation Goals (phase 2) already existed as
a real data model. The app is a real project now, not an artifact, and every
tab the original prototype had is ported and DB-backed:

- `src/app/` — Next.js 16 App Router (Turbopack). `src/app/(app)/` is the
  protected shell; `src/app/login/`, `src/app/auth/callback/` handle auth.
- `src/lib/supabase/` — browser client, server client (RLS-respecting), and
  an admin client (service-role, RLS-bypassing, server-only — used by
  `scripts/seed.ts`).
- `src/lib/types.ts` — shared TS types mirroring PRD §4 (kept in sync with
  `supabase/migrations/*.sql` and `references/data-models.md`).
- `src/lib/scoring.ts` — the Readiness scoring engine (dimension-bucket
  resolution, segment/pathway rules), shared by Take Assessment, Dashboard,
  and Reports.
- `src/lib/anthropic.ts` — the open-text scoring call to Claude, moved
  server-side per PRD §6.2 (marked `"server-only"` — importing it from a
  Client Component is a build error, not just a convention).
- `supabase/migrations/0001_init.sql` — full Postgres schema + RLS for
  **every** PRD §4 model, not just the ones with a UI yet.
- `supabase/migrations/0002_tier1_review_log.sql` — `goal_review_entries`,
  added for build phase 4 (Tier 1 manual-entry forms).
- Real auth: Supabase Auth, email/password (hashed) **and** Google/Microsoft
  SSO — resolves the PRD §7 open question. New signups default to `viewer`
  role via a Postgres trigger; a superadmin/hradmin promotes from Teams.

**Real and DB-backed:** everything — auth, the role-gated shell, Take
Assessment (`src/app/(app)/survey/`), Assessment Builder (`assessments/`),
Scoring Engine (`scoring-engine/`), Dashboard (`dashboard/`), Reports
(`reports/`), Teams (`teams/`), Transformation Goals (`goals/`, plus its
Tier 1 review log), and Nudges (`nudges/`). `src/components/NotMigrated.tsx`
is now unused.

**Not built:** the **Workflows** tab (referenced in PRD §3's nav, has a
mockup at `design/active/workflows-interventions.html`, but was never
implemented even in the original prototype — a pre-existing gap, not one of
§6.3's numbered phases) and the **Integrations registry** (phase 6, schema
reserved, no UI, no vendor chosen) → **deep integrations** (phase 7).

`prototype/App.jsx` (moved from `app/App.jsx` — the App Router needed that
path) is the original browser-only artifact: `window.storage`, plaintext
passcode auth, no real backend. It's no longer live, and — now that every
tab it had is ported — nothing depends on it as a reference anymore. Keep it
only as design history; don't extend it.

## 6.2 Target production architecture

- **Hosting:** Vercel — not yet deployed; the app builds cleanly locally
  (`npm run build`, verified) but has no live Vercel project or Supabase
  project connected yet. Whoever picks this up needs to create both and
  fill in `.env` from `.env.example`, then browser-test everything — none
  of this has run outside `npm run build`/`typecheck`/`lint` so far.
- **Backend + DB:** Supabase (Postgres + Auth) — schema and auth are real
  now (see above), but only against whatever Supabase project the `.env`
  points at; nothing is provisioned by this codebase itself.
- **Integrations registry:** a `connectors` table (vendor, auth config,
  field mappings) + OAuth token storage (encrypted) + a scheduled sync
  worker per connector. Schema exists (`public.integrations`); the
  admin-facing "Integrations" tab, Connect/Disconnect UI, and all connector
  logic are still unbuilt — **no vendor has been chosen**, so don't build a
  specific connector speculatively.
- **Scoring engine:** ✅ done — `src/lib/anthropic.ts`'s `scoreTextAnswer`
  runs server-side, called from the `submitAssessment` Server Action in
  `src/app/(app)/survey/actions.ts`, using `ANTHROPIC_API_KEY` from `.env`.

## 6.3 Build sequence — executed OUT OF ORDER, see note

PRD §6.3's original sequence assumed the backend migration (step 5) would
come *after* Nudges and Tier-1 forms (steps 3-4), so those could be built
cheaply against `window.storage` first. The user asked to pull the migration
forward instead, once step 2 was done — so the order below is what actually
happened, not the PRD's original numbering.

1. ✅ Consolidate the PRD spec.
2. ✅ Add **Transformation Goals** as a real data model — done first in the
   prototype (`window.storage`), then re-implemented against Supabase during
   step 3 below. Real 19-goal ROI-grid content either way.
3. ✅ **(Reordered ahead)** Standalone app + backend + auth: Next.js 16 +
   Supabase, full schema + RLS for every PRD §4 model, real auth
   (email/password + SSO), Transformation Goals ported to be DB-backed.
4. ✅ Port the remaining prototype tabs (Dashboard, Assessment Builder, Take
   Assessment, Scoring Engine, Reports, Teams) into real Supabase-backed
   pages. Take Assessment matches respondents to the signed-in account via
   `profile_id` — a real improvement over the prototype's fragile
   name+department string matching.
5. ✅ Build **Nudges** tab; wire Tier 0 goals to real Nudge response data and
   existing Readiness scores. Unblocked once step 4 gave it real Respondent
   data. Admin-only tab (superadmin/hradmin, per PRD §3); response
   collection happens on the Dashboard's "Nudges for you" widget instead,
   since a nudge is delivered *to* someone, not something they navigate to
   an admin page to find.
6. ✅ Add manual-entry admin forms for Tier 1 goals. The generic
   `currentValue` field only covers one overwritable scalar; Tier 1's own
   mechanism (manual tagging/expert review) implied a log of individual
   review events, so this added `goal_review_entries`
   (`0002_tier1_review_log.sql`) plus a review-log UI on each Tier 1 goal's
   detail view, rather than stretching `currentValue` to cover something it
   wasn't shaped for.
7. **Next up:** stand up a real Vercel + Supabase project and browser-test
   the app — nothing has run outside `npm run build` so far, and the
   Workflows tab gap (see 6.1) is still open.
8. Build the **Integrations registry** + first vendor connector (Tier 2) —
   prioritize by which vendor the client actually uses first, not
   speculative build-all. Schema reserved (`public.integrations`); **no
   vendor chosen, no UI built.**
9. Build **deep system integrations** (Tier 3) — last, highest cost,
   benefits from patterns proven in step 8. **Not started.**

## 6.4 Process going forward

- `docs/PRD-Engineering-Framework.md` is the reference for any new feature
  discussion — check it before proposing new data shapes or visual
  patterns.
- This skill package (`.claude/skills/aim-platform/`) exists so future
  sessions — including a fresh conversation — start from these conventions
  automatically rather than re-deriving them from memory or
  re-improvising.
- Actual implementation (backend, integrations, migrations) belongs in
  **Claude Code**, in this repository, with version control and tests —
  which is now literally true: `src/` is the real app. Chat-based artifact
  iteration (the old `prototype/App.jsx` workflow) was the right tool for
  early design exploration, not for anything going forward.
