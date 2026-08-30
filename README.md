# AIM Platform

AI Measurement platform for workforce AI transformation — built around the client's First Person Framework (Identify → Inform → Invest → Inspire → Instill). See [`docs/PRD-Engineering-Framework.md`](docs/PRD-Engineering-Framework.md) for the full product requirements, data models, and engineering plan. That document is the source of truth — check it before adding any new feature.

## Current status

This is now a **standalone Next.js + Supabase application** — the migration off the browser-only artifact prototype (PRD build phase 5) started ahead of the originally planned order, at the user's request, once Transformation Goals (phase 2) was already built. Real auth (email/password + Google/Microsoft SSO) and a real Postgres schema exist for every PRD §4 data model.

**What's real and running:**
- Auth (Supabase Auth — email/password, hashed, plus Google/Microsoft SSO)
- Full Postgres schema + Row Level Security for every PRD §4 data model
- The **Transformation Goals** tab — fully DB-backed, real ROI-grid content, editable `currentValue`
- Role-gated app shell/nav matching PRD §3

**What's still a stub:** Dashboard, Assessment Builder, Take Assessment, Scoring Engine, Reports, and Teams render an honest "not yet migrated" placeholder — porting each from `prototype/App.jsx` into a real Supabase-backed page is follow-up work, not yet done. Nudges (build phase 3) and the Integrations registry (build phase 6, framework only — no specific vendor chosen) have their schema reserved but no UI yet.

## Repo structure

```
src/
  app/                          — Next.js App Router
    login/, auth/callback/      — auth pages + OAuth/email callback
    (app)/                      — protected app shell (role-gated nav)
      goals/                    — Transformation Goals (real, DB-backed)
      dashboard/, reports/, ... — stub pages ("not yet migrated")
  components/                   — goals/ (real), NotMigrated.tsx (stub pattern)
  lib/
    supabase/                   — browser/server/middleware Supabase clients
    data/                       — real seed content (goals, questions), typed
    types.ts                    — shared TS types mirroring PRD §4
    nav.ts, goal-meta.ts

supabase/
  migrations/0001_init.sql      — full schema + RLS for every PRD §4 model

scripts/
  seed.ts                       — seeds real Goals + Questions content (not prototype demo data)

prototype/
  App.jsx                       — the original artifact-only prototype, kept as
                                   historical reference for data shapes and UI
                                   conventions not yet ported. Not deployable —
                                   depends on window.storage and a Claude.ai
                                   artifact sandbox.

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

1. Create a Supabase project, then run the schema:
   `supabase db push` (with the Supabase CLI linked to your project), or paste
   `supabase/migrations/0001_init.sql` into the SQL editor.
2. In the Supabase dashboard → Authentication → Providers, enable Email and
   (optionally) Google / Microsoft (Azure) — register the OAuth apps with
   redirect URI `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
3. Seed the real content: `npm run db:seed`
4. `npm run dev` — http://localhost:3000

Also available: `npm run build`, `npm run typecheck`, `npm run lint`.

## Next steps (see PRD §6.3 for the full sequence — now being executed out of
## order per the standalone-app-first decision)

1. ✅ Transformation Goals as a real data model (phase 2).
2. ✅ Standalone app scaffold, real backend + auth (phase 5, pulled forward).
3. Port the remaining prototype tabs (Dashboard, Assessment Builder, Take
   Assessment, Scoring Engine, Reports, Teams) into real Supabase-backed pages.
4. Build the Nudges tab; wire Tier 0 goals to live Nudge + Readiness data.
5. Add manual-entry admin forms for Tier 1 goals.
6. Build the Integrations registry + first vendor connector (no vendor chosen yet).
7. Build deep system integrations (Tier 3).
