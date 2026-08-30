# Engineering Framework

Mirrors PRD §6. Full text: `docs/PRD-Engineering-Framework.md`.

## 6.1 Current state — standalone Next.js + Supabase app (mid-migration)

The phase-5 migration below was pulled forward, at the user's explicit
request, ahead of phases 3-4 — once Transformation Goals (phase 2) already
existed as a real data model. The app is a real project now, not an
artifact:

- `src/app/` — Next.js 16 App Router (Turbopack). `src/app/(app)/` is the
  protected shell; `src/app/login/`, `src/app/auth/callback/` handle auth.
- `src/lib/supabase/` — browser client, server client (RLS-respecting), and
  an admin client (service-role, RLS-bypassing, server-only — used by
  `scripts/seed.ts`, and reserved for the server-side scoring call below).
- `src/lib/types.ts` — shared TS types mirroring PRD §4 (kept in sync with
  `supabase/migrations/0001_init.sql` and `references/data-models.md`).
- `supabase/migrations/0001_init.sql` — full Postgres schema + RLS for
  **every** PRD §4 model, not just the ones with a UI yet — reserving the
  Nudge/Integration tables now avoids a painful later migration, but no
  logic is wired to them until their build phase actually arrives.
- Real auth: Supabase Auth, email/password (hashed) **and** Google/Microsoft
  SSO — resolves the PRD §7 open question. New signups default to `viewer`
  role via a Postgres trigger; a superadmin/hradmin promotes from Teams.

**Real and DB-backed:** auth, the role-gated shell, **Transformation Goals**
(`src/app/(app)/goals/` + `src/components/goals/`) — real 19-goal ROI-grid
content, editable `currentValue` via a server action, no more
`window.storage`.

**Still stubs** (`src/components/NotMigrated.tsx` — an honest placeholder,
not a hidden gap): Dashboard, Assessment Builder, Take Assessment, Scoring
Engine, Reports, Teams. Porting each from `prototype/App.jsx` is unstarted.

`prototype/App.jsx` (moved from `app/App.jsx` — the App Router needed that
path) is the original browser-only artifact: `window.storage`, plaintext
passcode auth, no real backend. It's no longer live and isn't being
extended — pure reference for the not-yet-ported tabs' data shapes and UI
conventions.

## 6.2 Target production architecture

- **Hosting:** Vercel — not yet deployed; the app builds cleanly locally
  (`npm run build`, verified) but has no live Vercel project or Supabase
  project connected yet. Whoever picks this up needs to create both and
  fill in `.env` from `.env.example`.
- **Backend + DB:** Supabase (Postgres + Auth) — schema and auth are real
  now (see above), but only against whatever Supabase project the
  `.env` points at; nothing is provisioned by this codebase itself.
- **Integrations registry:** a `connectors` table (vendor, auth config,
  field mappings) + OAuth token storage (encrypted) + a scheduled sync
  worker per connector. Schema exists (`public.integrations`); the
  admin-facing "Integrations" tab, Connect/Disconnect UI, and all connector
  logic are still unbuilt — **no vendor has been chosen**, so don't build a
  specific connector speculatively.
- **Scoring engine:** the text-answer LLM scoring call (Claude) must run
  server-side (a Next.js Server Action or Route Handler using
  `createAdminClient()` / `ANTHROPIC_API_KEY` from `.env`) — not yet ported
  from `prototype/App.jsx`'s client-side `scoreTextAnswer()`, since Take
  Assessment isn't migrated yet either.

## 6.3 Build sequence — now executed OUT OF ORDER, see note

PRD §6.3's original sequence assumed the backend migration (step 5) would
come *after* Nudges and Tier-1 forms (steps 3-4), so those could be built
cheaply against `window.storage` first. The user asked to pull the migration
forward instead, once step 2 was done — so the order below is what actually
happened, not the PRD's original numbering. Steps 3-4 are now real-app work
(Supabase-backed), not prototype work, since there's no prototype left to
extend.

1. ✅ Consolidate the PRD spec.
2. ✅ Add **Transformation Goals** as a real data model — done first in the
   prototype (`window.storage`), then re-implemented against Supabase during
   step 5 below. Real 19-goal ROI-grid content either way.
3. **(Reordered ahead, see above) Standalone app + backend + auth** — done:
   Next.js 16 + Supabase project scaffold, full schema + RLS for every PRD §4
   model, real auth (email/password + SSO), Transformation Goals ported to
   be DB-backed. Verified with `npm run build` / `typecheck` / `lint`, all
   clean — not yet click-tested in a browser (no live Supabase project
   connected in this environment) and not deployed to Vercel.
4. Port the remaining prototype tabs (Dashboard, Assessment Builder, Take
   Assessment, Scoring Engine, Reports, Teams) from `prototype/App.jsx` into
   real Supabase-backed pages. **Not started.**
5. Build **Nudges** tab against the real schema (`public.nudges`,
   `public.nudge_responses` already exist); wire Tier 0 goals to real Nudge
   response data and existing Readiness scores. **Not started** — blocked on
   Take Assessment/Readiness scoring being ported first (step 4), since
   Nudges needs real Respondent data to link against.
6. Add manual-entry admin forms for Tier 1 goals. **Not started.**
7. Build the **Integrations registry** + first vendor connector (Tier 2) —
   prioritize by which vendor the client actually uses first, not
   speculative build-all. Schema reserved (`public.integrations`); **no
   vendor chosen, no UI built.**
8. Build **deep system integrations** (Tier 3) — last, highest cost,
   benefits from patterns proven in step 7. **Not started.**

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
