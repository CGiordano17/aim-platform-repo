---
name: aim-platform
description: Project conventions and source-of-truth reference for the AIM Platform (AI workforce-transformation measurement tool built around the client's First Person Framework). Use this whenever working in this repo — adding or changing a data model, building or restyling UI, discussing Readiness/Rogers scoring, Workflows lifecycle, Transformation Goals or the ROI Measurability Ladder, touching app/App.jsx, planning the backend migration or an Integrations connector, or writing/updating docs/PRD-Engineering-Framework.md itself. Consult it even for small changes (a new field, a new tab, a new color) — this project has specific, already-decided conventions that should not be re-improvised from scratch.
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
| `app/App.jsx`, the prototype's limitations, the production stack (Vercel + Supabase), the Integrations Registry pattern, or **what build phase we're actually on** | `references/engineering.md` |
| A design question that feels unresolved, or citing prior mockups in `design/` | `references/open-decisions-and-artifacts.md` |

## Rules that apply regardless of which file you read

1. **Check the Open Decisions Log before assuming an answer.** Several
   design questions (paving-trigger automation, usage-threshold
   configurability, rollup weighting, real-auth approach, etc.) are
   explicitly *not yet resolved* — see `references/open-decisions-and-artifacts.md`.
   Don't silently pick an answer and build against it.

2. **Don't skip build phases.** `references/engineering.md` lists the build
   sequence in order (PRD §6.3). Before starting work on Nudges,
   Integrations, or the backend migration, confirm the prior phases are
   actually done — the sequence exists because each phase's data already
   flows through the app by the time the next one needs it, and building
   out of order re-creates infrastructure that a later, cheaper phase would
   have given you for free.

3. **`app/App.jsx` is a reference, not a target.** It shows correct data
   shapes and UI conventions but runs on the artifact `window.storage` API
   and demo-only auth. Never treat it as code to deploy as-is, and don't
   "fix" its prototype limitations in place — they're tracked, intentional,
   and resolved by the migration step in `references/engineering.md`, not by
   ad hoc patches.

4. **Every Transformation Goal is the three-part statement, no exceptions.**
   *"The business will [ACTION] by people who [RESOURCES/behavior] to
   achieve [OUTCOME]."* This is the literal unit of measurement the Goals
   module is built around — see `references/product-and-framework.md`.

5. **Update the PRD, not just this skill.** If a task resolves an open
   decision, changes a data shape, or changes a build-sequence step, update
   `docs/PRD-Engineering-Framework.md` §7 (or the relevant section) first,
   then update the matching reference file here to stay in sync.
