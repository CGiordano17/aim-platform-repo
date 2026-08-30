# CLAUDE.md

Guidance for any Claude Code session working in this repo.

## What this is

**AIM Platform** — an AI workforce-transformation measurement tool built around
the client's **First Person Framework**: five stages, each starting with "I" —
**Identify → Inform → Invest → Inspire → Instill**. That framework grounds all
product decisions; see PRD §2.1 for how each stage maps to a product area.

## Source of truth

**`docs/PRD-Engineering-Framework.md` is the single source of truth** for this
project's data models, design system tokens, and engineering build sequence.

For a section-by-section, task-scoped breakdown of the PRD, see the
`aim-platform` skill at `.claude/skills/aim-platform/SKILL.md` — consult it
for any structural change (new data shape, new tab, new visual pattern) so
conventions aren't re-derived from memory or re-improvised.

- Read it before making any structural change (new data shape, new nav item,
  new visual pattern).
- Update it whenever a decision changes — it's a living document, not a
  historical snapshot. Don't let a feature get designed without a
  corresponding update there.
- It also carries an **Open Decisions Log (§7)** — check that list before
  assuming an answer to a design question that hasn't actually been settled
  (e.g. paving trigger automation, usage-threshold configurability, rollup
  weighting, auth approach).

## Core workstreams (deliberately separate — peers, not nested)

1. **Readiness** — Rogers adoption curve scoring across Trust / Willingness /
   Preparedness dimensions, placing people/departments into pathways (AI
   Enabled / AI Augmented / AI Superpowered).
2. **Workflows** — the identify → augment → pilot → scale lifecycle, i.e. the
   "dirt path → pave it" model: a workflow earns "paved" (standard) status
   once organic usage during piloting crosses a threshold.
3. **Transformation Goals** — the **ROI Measurability Ladder**: 4 categories
   (Productivity & Efficiency, Quality & Risk, Revenue & Impact, Workforce
   Capability) × 4 measurement tiers (0 Self-reported → 3 Deep system/API
   integration). Every goal is a three-part statement: *"The business will…
   by people who… to achieve…"* — this is the literal unit the Goals module
   is built around, not optional flavor text.

Interventions (training, peer pairing, etc.) are the lever that moves people
along Readiness and workflows through the pipeline — they're not a fourth
peer workstream.

## Current state — standalone Next.js + Supabase app (mid-migration)

The app is now a real standalone project (`src/`, `package.json`,
`supabase/migrations/`) — the phase-5 backend migration was pulled forward,
at the user's explicit request, ahead of Nudges/Tier-1-forms (phases 3-4),
once Transformation Goals (phase 2) already existed. Real auth (Supabase
Auth: email/password + Google/Microsoft SSO) and a full Postgres schema +
RLS exist for every PRD §4 data model — see `supabase/migrations/0001_init.sql`.

**Real and DB-backed today:** everything the original prototype had —
Take Assessment, Assessment Builder, Scoring Engine, Dashboard, Reports,
Teams, and Transformation Goals (now also with a Tier 1 manual-review log on
top). Nudges (phase 3) is also built: admin-authored on the Nudges tab, with
actual response collection living on the Dashboard's "Nudges for you" widget
since PRD §3 keeps the Nudges tab itself admin-only. The **Workflows** tab
(referenced in PRD §3's nav, mocked but never actually built — a
pre-existing gap, not a numbered PRD phase) is also real now: a Kanban board
where stage advancement is always a manual admin action, never automatic
(PRD §7 leaves auto-vs-approved paving unresolved). The **Integrations
registry framework** (phase 6) is real too — schema, a typed connector
registry, a working admin tab — but `src/lib/integrations/registry.ts`'s
registry is deliberately empty, since no vendor is chosen. `src/components/
NotMigrated.tsx` is now unused — nothing points to it anymore.

**Not built:** an actual vendor connector for Integrations (blocked on the
vendor decision) and **deep integrations** (Tier 3, phase 7), which depends
on it. Also: nothing here has been deployed to a live Vercel/Supabase
project or tested in a browser — only `npm run build`/`typecheck`/`lint`.

`prototype/App.jsx` (moved from the old `app/App.jsx` — Next.js's App Router
needed that path) is the **original browser-only artifact prototype**:
single-file React using the artifact `window.storage` key-value API, demo
plaintext-passcode auth. It is no longer live and nothing currently depends
on it as a reference — every tab it had is ported. Keep it only as design
history. `design/active/` and `design/archive/` hold prior mockups; archive
entries are superseded where they conflict with the PRD (see PRD §8).

## Design system

Dark HUD aesthetic. Full color tokens and component patterns live in **PRD
§5** — follow them for any new UI rather than inventing new visual
conventions (e.g. corner-bracket panel framing instead of flat cards,
chamfered corners instead of rounded rects, category color vs. tier color
kept deliberately distinct hues).

**Fonts:**
- `Michroma` — display/hero headers only, used sparingly
- `Rajdhani` — UI headers, nav, body text
- `JetBrains Mono` — all data values, technical labels, codes

## Engineering direction

Target production stack: **Vercel** (hosting) + **Supabase** (Postgres +
Auth, replacing the prototype's plaintext-passcode auth with real hashed/SSO
auth in the same move).

Vendor connectors follow an **Integrations Registry** pattern — a
`connectors` table (vendor, auth config, field mappings) + encrypted OAuth
token storage + a scheduled sync worker per connector. OAuth config happens
once per vendor, not custom-built per feature; the Integrations tab is just a
list view with Connect/Disconnect buttons over this registry.

**Full build sequence is PRD §6.3** — but note it's currently being executed
**out of the original order**: the backend/auth migration (originally phase
5) was pulled forward ahead of Nudges and Tier-1 forms (phases 3-4) at the
user's request. Check `README.md`'s "Next steps" section for the current
actual state before assuming a phase is or isn't done — don't rely on PRD
§6.3's checkbox order alone, since it no longer matches execution order.
