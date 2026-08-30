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

## Current state — prototype only

`app/App.jsx` is a **browser-only prototype**: a single-file React artifact
using the artifact `window.storage` key-value API for persistence. There is
no real backend, no real auth (email + plaintext passcode — demo-only, never
production-secure), and no real vendor integrations.

Treat it as a **reference for data shapes and UI conventions**, not as code
to deploy as-is. `design/active/` and `design/archive/` hold prior mockups
from the design exploration phase — archive entries are superseded where they
conflict with the PRD (see PRD §8).

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

**Full build sequence is PRD §6.3.** Check what phase the project is
actually on before skipping ahead — e.g. Transformation Goals need to become
a real data model (still in `window.storage`) and Nudges need to be built
*before* the migration off `window.storage` to the real backend, which in
turn comes *before* the Integrations registry and vendor connectors.
