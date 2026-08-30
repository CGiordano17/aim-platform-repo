---
name: aim-platform
description: Project conventions and source-of-truth reference for the AIM Platform (AI workforce-transformation measurement tool built around the client's First Person Framework), now a standalone Next.js + Supabase app. Use this whenever working in this repo — adding or changing a data model, building or restyling UI, discussing Readiness/Rogers scoring, Workflows lifecycle, Transformation Goals or the ROI Measurability Ladder, touching src/ or prototype/App.jsx, planning Supabase/auth work or an Integrations connector, or writing/updating docs/PRD-Engineering-Framework.md itself. Consult it even for small changes (a new field, a new tab, a new color) — this project has specific, already-decided conventions that should not be re-improvised from scratch.
---

# AIM Platform

AIM is a workforce AI-transformation measurement platform built around the
client's **First Person Framework**: five stages, each starting with "I" —
**Identify → Inform → Invest → Inspire → Instill**. It measures three
deliberately separate, peer workstreams — Readiness, Workflows, and
Transformation Goals — that ladder up into enterprise ROI claims.

**`docs/PRD-Engineering-Framework.md` at the repo root is the single source
of truth.** It is a living document — update it whenever a decision changes,
don't let a new feature get designed without a corresponding update there.
The reference files in this skill are a navigable, task-scoped breakdown of
that PRD, organized to match its own section numbers so drift is easy to
catch. **If a reference file here and the PRD ever disagree, the PRD wins —
fix the reference file to match, not the other way around.**

`CLAUDE.md` at the repo root carries the condensed version of these same
conventions for quick orientation; this skill is the deeper, section-by-
section version to consult when a task touches a specific area.

## Which reference to read

Don't read all of these up front — jump to the one that matches the task.

| Working on... | Read |
|---|---|
| The First Person Framework, Readiness/Rogers scoring, the Workflows "dirt path → pave it" lifecycle, Transformation Goals & the ROI Measurability Ladder, the three-part goal statement | `references/product-and-framework.md` |
| Navigation tabs, role-based access (`superadmin`/`hradmin`/`manager`/`viewer`) | `references/navigation-and-roles.md` |
| Any data shape — User, Question, Respondent, Workflow, Intervention, TransformationGoal, Nudge, Integration | `references/data-models.md` |
| New UI, colors, typography, component patterns | `references/design-system.md` |
| `prototype/App.jsx`, the standalone Next.js + Supabase app's structure, the Integrations Registry pattern, or **what build phase we're actually on** | `references/engineering.md` |
| A design question that feels unresolved, or citing prior mockups in `design/` | `references/open-decisions-and-artifacts.md` |

## Rules that apply regardless of which file you read

1. **Check the Open Decisions Log before assuming an answer.** Several
   design questions (paving-trigger automation, usage-threshold
   configurability, rollup weighting, real-auth approach, etc.) are
   explicitly *not yet resolved* — see `references/open-decisions-and-artifacts.md`.
   Don't silently pick an answer and build against it.

2. **Check what's actually been built before assuming a phase is done.**
   `references/engineering.md` lists PRD §6.3's build sequence, but the
   backend/auth migration (originally phase 5) was pulled forward ahead of
   Nudges and Tier-1 forms (phases 3-4) at the user's request — the
   sequence's *order* no longer matches execution order. `README.md`'s "Next
   steps" section is the current source of truth for what's real vs. stub;
   don't assume a numerically-earlier phase is done just because a
   numerically-later one is.

3. **`prototype/App.jsx` is a reference for not-yet-ported tabs, not a
   target.** It's the original artifact-only prototype (moved from
   `app/App.jsx` — Next.js's App Router needed that path). It shows correct
   data shapes and UI conventions for Dashboard/Assessment Builder/Take
   Assessment/Scoring Engine/Reports/Teams, none of which are ported yet.
   Never treat it as code to deploy as-is, and don't extend it further — new
   work goes in `src/` against the real Supabase backend.

4. **Every Transformation Goal is the three-part statement, no exceptions.**
   *"The business will [ACTION] by people who [RESOURCES/behavior] to
   achieve [OUTCOME]."* This is the literal unit of measurement the Goals
   module is built around — see `references/product-and-framework.md`.

5. **Update the PRD, not just this skill.** If a task resolves an open
   decision, changes a data shape, or changes a build-sequence step, update
   `docs/PRD-Engineering-Framework.md` §7 (or the relevant section) first,
   then update the matching reference file here to stay in sync.
