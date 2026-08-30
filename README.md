# AIM Platform

AI Measurement platform for workforce AI transformation — built around the client's First Person Framework (Identify → Inform → Invest → Inspire → Instill). See [`docs/PRD-Engineering-Framework.md`](docs/PRD-Engineering-Framework.md) for the full product requirements, data models, and engineering plan. That document is the source of truth — check it before adding any new feature.

## Current status

This is a **standalone Next.js + Supabase application** — no more browser-only artifact prototype in the loop. Real auth (email/password + Google/Microsoft SSO) and a real Postgres schema exist for every PRD §4 data model, and every tab from the original prototype is now ported and DB-backed.

**What's real and running:**
- Auth (Supabase Auth — email/password, hashed, plus Google/Microsoft SSO)
- Full Postgres schema + Row Level Security for every PRD §4 data model, across two migrations
- **Take Assessment** — real intake → questions → server-side-scored → result flow, respondents matched to accounts via `profile_id`
- **Assessment Builder** — real Question CRUD
- **Scoring Engine** — reference view over the shared scoring rules
- **Dashboard** — org-wide stats, adoption curve, segment/pathway breakdowns, plus a "Nudges for you" widget
- **Reports** — org / department / individual drill-down
- **Teams** — role management (superadmin only)
- **Transformation Goals** — the ROI Measurability Ladder, real 19-goal content, editable `currentValue`, plus a Tier 1 manual-review log (reviewer note, flagged rate) on top of it
- **Nudges** — admin-authored, department/role-targeted, linked to Tier 0 goals; response collection happens via the Dashboard widget since PRD §3 keeps the Nudges tab itself admin-only
- **Workflows** — the "dirt path → pave it" Kanban (Identified → Augmented → Piloting → Standard); referenced in PRD §3's nav and mocked in `design/`, but never actually implemented until now
- **Integrations** — the registry framework (connectors table, OAuth token columns, a typed connector-definition pattern, real Connect/Disconnect UI) — but **no actual vendor connector**, since no vendor has been chosen yet

**Not built yet:** a real vendor connector for Integrations (blocked on that vendor decision) and deep system integrations (Tier 3, phase 7), which depends on it.

## Repo structure

```
src/
  app/                          — Next.js App Router
    login/, auth/callback/      — auth pages + OAuth/email callback
    (app)/                      — protected app shell (role-gated nav)
      goals/, survey/, assessments/, teams/, nudges/, workflows/, integrations/  — pages + server actions
      dashboard/, reports/, scoring-engine/, config/
  components/                   — one folder per feature area, plus shared/ (AdoptionCurve, StatCard, etc.)
  lib/
    supabase/                   — browser/server/middleware Supabase clients
    data/                       — real seed content (goals, questions), typed
    integrations/registry.ts    — the Integrations Registry pattern (currently empty — no vendor chosen)
    scoring.ts                  — the Readiness scoring engine (dimension buckets, segment/pathway rules)
    anthropic.ts                — server-only Claude scoring call (PRD §6.2)
    types.ts                    — shared TS types mirroring PRD §4
    nav.ts, goal-meta.ts, respondents.ts

supabase/
  migrations/
    0001_init.sql                — full schema + RLS for every PRD §4 model
    0002_tier1_review_log.sql    — Tier 1 manual-review log (build phase 4)
    0003_integrations_registry.sql — connectors config + OAuth token columns (build phase 6, framework only)

scripts/
  seed.ts                       — seeds real Goals + Questions content (not prototype demo data)

prototype/
  App.jsx                       — the original artifact-only prototype. Purely historical now —
                                   every tab it had is ported to src/. Not deployable — depends on
                                   window.storage and a Claude.ai artifact sandbox.

docs/
  PRD-Engineering-Framework.md  — product requirements, data models, design system,
                                  engineering framework, open decisions log
  architecture-wireframe.html   — visual system architecture (built vs. planned layers)

design/
  active/                       — mockups that still represent current, un-superseded decisions
  archive/                      — superseded design exploration, kept for history
```

## Running it

```bash
npm install
cp .env.example .env        # fill in your Supabase project's real values
```

1. Create a Supabase project, then run all three migrations in order:
   `supabase db push` (with the Supabase CLI linked to your project), or paste
   `0001_init.sql`, then `0002_tier1_review_log.sql`, then `0003_integrations_registry.sql`
   into the SQL editor, in that order.
2. In the Supabase dashboard → Authentication → Providers, enable Email and
   (optionally) Google / Microsoft (Azure) — register the OAuth apps with
   redirect URI `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
3. Seed the real content: `npm run db:seed`
4. `npm run dev` — http://localhost:3000

Also available: `npm run build`, `npm run typecheck`, `npm run lint`.

**Not yet done, whoever picks this up next:** no live Vercel or Supabase project is actually connected in this environment — `npm run build`/`typecheck`/`lint` are all clean, but nothing here has been click-tested in a browser or deployed. That's the first thing to do before trusting any of this in front of the client.

## Next steps (see PRD §6.3 for the full sequence — executed out of order; §6.3's note explains why)

1. ✅ Transformation Goals as a real data model (phase 2).
2. ✅ Standalone app scaffold, real backend + auth (phase 5, pulled forward).
3. ✅ Port the remaining prototype tabs into real Supabase-backed pages.
4. ✅ Nudges tab (phase 3) + Tier 1 manual-review forms (phase 4).
5. ✅ Workflows tab — referenced in PRD §3's nav but never implemented (not one of the numbered PRD phases, a separate gap).
6. ✅ Integrations registry framework (phase 6) — no vendor connector, since none is chosen.
7. **Stand up a real Vercel + Supabase project and browser-test the whole thing** — nothing here has run outside `npm run build`/`typecheck`/`lint` yet. Arguably more urgent than 8-9 before anyone demos this.
8. Pick a vendor and build the first real Integrations connector (phase 6, remaining piece).
9. Build deep system integrations (Tier 3, phase 7).
