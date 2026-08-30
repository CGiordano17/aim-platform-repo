# Open Decisions Log & Reference Artifacts

Mirrors PRD §7–8. Full text: `docs/PRD-Engineering-Framework.md`.

## 7. Open Decisions Log

Flagged during design but **not yet resolved** — resolve before building
the affected feature. If a task touches one of these, don't silently pick
an answer; either ask, or note the assumption explicitly and flag it back
into the PRD.

- [ ] Workflow adoption rollup: plain average, or weighted (by headcount,
      dollar value, or deal size)?
- [ ] Piloting-to-standard usage threshold: fixed platform-wide, or
      configurable per workflow/functional leader?
- [ ] Paving trigger: automatic once threshold is crossed, or requires
      explicit functional-leader approval?
- [ ] Should Workflows be *required* to link to a Transformation Goal, or
      is tagging optional?
- [ ] Should the 3 illustrative Tier-0 Nudge entries
      (productivity/quality/revenue) become real, admin-authored questions
      per category, rather than fixed seed content?
- [ ] ROI ladder card interaction: always show the full goal sentence, or
      collapse to title-only with expand-on-click/hover for density?
- [ ] Real auth approach: email/password with hashing, or SSO
      (Google/Microsoft)?
- [ ] Pyramid/rollup depth: fixed template (Use Case → Functional →
      Cross-Functional → Enterprise), or fully flexible levels an org
      defines themselves?
- [ ] Role-based edit permissions for Workflows and Transformation Goals
      tabs (currently only view-access is role-gated in the nav; edit
      rights within those tabs are undefined).

**When one of these gets resolved:** update this list (checked off, with
the decision noted) *and* the corresponding item in
`docs/PRD-Engineering-Framework.md` §7 — don't let the two drift apart.

## 8. Reference Artifacts

Prior mockups produced during design exploration (for historical reference
— superseded by the decisions in this skill/PRD where they conflict):

| Artifact | What it explored |
|---|---|
| `prototype/App.jsx` | Full working prototype: survey flow, live scoring, storage-backed persistence, role-gated login. Superseded by `src/` for anything already ported (currently just Transformation Goals) — still the reference for what isn't. |
| `design/archive/design-directions.html` | Three early visual directions (Instrument Panel, Field Notebook, Diffusion Spectrum) |
| `design/archive/hud-direction.html`, `layout-options.html`, `typography-options.html` | JARVIS/HUD visual refinement — palette, layout skeletons, typography pairings |
| `design/archive/jarvis-mockup-v2/v3/v4.html`, `jarvis-mockup.html` | Hero visualization evolution: 3D globe → animated Rogers curve → fully interactive per-respondent curve |
| `design/active/workflows-interventions.html` | Workflow pipeline board + Interventions planner, first pass |
| `design/active/goals-wizard.html` | Use case → Transformation Goal statement builder wizard |
| `design/archive/roi-pyramid.html`, `roi-pyramid-v2.html` | Early value-tree/pyramid exploration (superseded — see honesty note in `references/product-and-framework.md` §2.4) |
| `design/archive/roi-grid-pyramid.html`, `roi-ladder.html`, `design/active/roi-ladder.html` | Final ROI Measurability Ladder — client's real 16+ methods, 4 categories × 4 tiers, goal-statement formatting |
| `docs/architecture-wireframe.html` | Visual system architecture (built vs. planned layers) |

`design/active/` = mockups that still represent current, un-superseded
decisions. `design/archive/` = superseded design exploration, kept for
history only.
