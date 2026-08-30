# AIM Platform — Product Requirements & Engineering Framework

**Status:** Living document. This is the source of truth for the AIM (AI Measurement) platform. Any new feature, mockup, or engineering decision should be checked against this document first, and this document should be updated whenever a decision changes.

**Last consolidated:** From design/ideation conversation covering readiness scoring, workflow scale-up, transformation goals, and ROI measurement architecture.

---

## 1. Product Overview

AIM is a workforce AI-transformation platform built around a human-centered framework (see §2.1). It measures three complementary, intentionally separate workstreams:

1. **Readiness** — are people (individuals, departments, the org) ready to adopt AI, and where do they sit on the Rogers adoption curve.
2. **Workflows** — which specific work tasks are being identified, AI-augmented, piloted, and eventually standardized ("paved").
3. **Transformation Goals** — the enterprise-level ROI statements everything above ladders up into, each with an explicit measurement mechanism.

These three are peers in the navigation, not nested under one another. Interventions (training, peer pairing, etc.) are the lever used to move people along Readiness and workflows through the pipeline.

---

## 2. Conceptual Framework

### 2.1 The First Person Framework (client's framework — grounds all product decisions)

Five stages, each starting with "I": **Identify → Inform → Invest → Inspire → Instill**.

| Stage | Meaning | Maps to product area |
|---|---|---|
| Identify | Assess needs, define AI Transformation Goals from use cases | Transformation Goals module, Readiness assessment |
| Inform | Communicate what the business will do, clearly, without surprise | Workflows (the "action" being taken) |
| Invest | Personalized, informed enablement of specific people | Readiness, role-based Interventions |
| Inspire | Peer-to-peer, bottom-up sustainment ("casual collisions") | Interventions |
| Instill | Replace old processes with proven AI-enabled ones — **"pave the walking path"** — and measure it | Workflows (Bank/Scale stage), Nudges, backend integrations |

**AI Transformation Statement recipe** (from the client's source deck, slide 18):

> **Inform:** The business will **[ACTION]**
> **Invest/Inspire:** by people who **[RESOURCES/behavior]**
> **Instill:** to achieve **[OUTCOME]**

Example (client's own): *"The business will replace ⅔ of its CS agents with chatbots by people who receive more time to do other critical work to achieve bottom line improvements and lower consumer costs."*

Every Transformation Goal in the product must be expressible in this exact three-part form. This is not optional flavor text — it's the unit of measurement the whole Goals module is built around.

### 2.2 Rogers Diffusion of Innovation (Readiness workstream)

Population distribution across 5 segments, standard Rogers percentages:

| Segment | % of population | Score range (0–5 scale) |
|---|---|---|
| Laggards | 16% | 1.0 – 2.2 |
| Late majority | 34% | 2.3 – 2.9 |
| Early majority | 34% | 3.0 – 3.6 |
| Early adopters | 13.5% | 3.7 – 4.2 |
| Innovators | 2.5% | 4.3 – 5.0 |

**Dimension scores** (per respondent): Trust, Willingness, Prep — Foundations, Prep — Workflow, Prep — Tech (approximated as avg of the two Prep dimensions unless a real "Prep — Tech" question dimension exists). `overall` = average of all populated dimension scores including any custom dimensions.

**Pathway placement** (training track), derived from trust/prep/willingness:

| Pathway | Trust | Prep | Willingness | Curve range |
|---|---|---|---|---|
| AI Enabled | ≤ 3.0 | ≤ 2.5 | ≤ 3.0 | Late majority + Laggards |
| AI Augmented | 3.1–4.0 | 2.6–3.9 | 3.1–4.0 | Early majority + Early adopters |
| AI Superpowered | ≥ 4.1 | ≥ 4.0 | ≥ 4.1 | Innovators + Early adopters |

**Dimension-to-score-bucket resolution:** questions map to a scoring bucket via `canonicalDimensionKey(dimensionText)` — a keyword match (contains "trust" → trust, "willing" → willingness, etc.), **not** exact string equality. This means renaming a dimension's display label doesn't silently break scoring; a genuinely new/unmapped dimension becomes a visible `custom:*` bucket that still counts toward `overall`, flagged in the Assessment Builder UI rather than silently dropped.

**Question types and scoring:**
- `likert` (1–5): direct numeric value.
- `multiple_choice`: each option carries an editable 1–5 `optionScore`; selected option's score feeds the bucket.
- `text`: sent to Claude with a per-question rubric (`scoringPrompt`), scored 1–5, with a neutral midpoint (3) fallback if the call fails. This is a real API call, not a mock — it must remain reliable in production (retry/fallback logic required).

### 2.3 Workflow scale-up lifecycle ("dirt path → pave it")

| Stage | Meaning |
|---|---|
| 1. Identify | High-value workflow flagged, broken into individual tasks |
| 2. Augment | Specific tasks within it are redesigned with AI assistance |
| 3. Pilot | Usage measured organically — the "dirt path" forming |
| 4. Bank & Scale | Once usage crosses a threshold, functional leader makes it the required standard — "paving" the path |
| 5. Comply | Adoption of the now-required workflow is tracked going forward |

**Open question (unresolved):** is paving automatic-at-threshold, or does it require explicit functional-leader approval? Is the usage threshold (mockups used 60%) fixed platform-wide or configurable per workflow/leader? → See §7.

### 2.4 Transformation Goals & ROI Measurability Ladder

**Four categories** (client's own framework, exact names):
1. Productivity & Efficiency — owner: COO · CHRO · Operations
2. Quality & Risk — owner: Functional leads · GC · CISO
3. Revenue & Impact — owner: CEO · CRO · CCO
4. Workforce Capability — owner: CLO · CHRO

**Four measurement tiers** (bottom = easiest to start, top = highest engineering cost and rigor):

| Tier | Name | Mechanism | Engineering need |
|---|---|---|---|
| 0 | Self-reported | Nudge micro-prompt or Readiness Assessment | None — already in-app |
| 1 | Manual tagging / expert review | A human adds a flag or scores an output by hand | Simple admin form |
| 2 | Native vendor reporting | Data already sits in a vendor admin console (Viva, Zendesk, Salesforce, GitHub) | OAuth connector per vendor |
| 3 | Deep system / API integration | Token telemetry, cross-system BI models, compliance logging | Custom integration + data pipeline |

**Important honesty note:** the client's original 16-method ROI grid was explicitly designed to avoid self-report ("no self-report surveys"). Tier 0 in the product is therefore mostly populated by new Nudge-sourced entries added specifically to complete the ladder, not by reclassifying the original 16 — only "workforce readiness" among the original 16 is genuinely self-report. Do not force-fit system-sourced methods into Tier 0 to make the ladder look more populated than it honestly is.

**Every Goal card must show, in this order:**
1. **Title** — a short business-impact name (e.g. "Efficiency Gains," "Quality Control," "Deal Velocity," "Trust Signal") — never a vague research-question label.
2. **Statement** — the full three-part goal sentence, with the three lead-in phrases visually distinguished: `The business will…` (cyan), `by people who…` (amber), `to achieve…` (green).
3. **Tier + GA maturity tags** — measurement tier (0–3) and organizational maturity stage (literate/applied/operational/transformational) are two *different* axes; show both, don't conflate them.

**Goal → evidence convergence (the "pyramid"):** selecting an objective (via a picker of common CLO/CFO/CRO objectives, or free-text matched by Claude) highlights the specific goals that build its evidence case (primary = strong match, secondary = supporting), and those converge visually into a single claim. This is an honest pyramid — it only forms once a claim is chosen — rather than a fake mathematical rollup applied to the whole grid at rest.

---

## 3. Information Architecture / Navigation

Top-level tabs (peers, not nested):

| Tab | Purpose | Role access |
|---|---|---|
| Take Assessment | Respondent-facing survey flow (pre/post) | All roles |
| Overview (Dashboard) | Org-wide readiness stats, adoption curve | All roles |
| Assessment Builder | Author/edit questions, dimensions, scoring rubrics | superadmin, hradmin |
| Scoring Engine | Read-only view of cut-score rules and thresholds | superadmin, hradmin, manager |
| Workflows | Kanban: Identified → Augmented → Piloting → Standard | All roles (edit: TBD by role) |
| Interventions | Plan training moments, casual collisions, sustainment sessions, role-based trainings | superadmin, hradmin |
| Transformation Goals | ROI Measurability Ladder, goal authoring, objective picker | All roles (edit: TBD by role) |
| Nudges | **Not yet built.** Individual-level self-report micro-surveys tied to Goals/Workflows | superadmin, hradmin |
| Integrations | **Not yet built.** Connector registry — OAuth connect buttons per vendor | superadmin only |
| Reports | Org / department / individual drill-down | All roles |
| Teams | User directory, role management | superadmin, hradmin |
| Config | Thresholds, feature flags, privacy | superadmin only |

**Roles:** `superadmin`, `hradmin`, `manager`, `viewer`. Current prototype auth is email + plaintext passcode in shared storage — explicitly flagged as demo-only, not production-secure. Real auth (hashed credentials or SSO) is required before any real user data touches this system.

---

## 4. Data Models

> Field lists below reflect what's been built/decided in the prototype and design conversation. Types are illustrative (TypeScript-ish), not a final schema — final schema is an engineering task once this moves to a real backend.

### User
```
{ id, name, email, role: 'superadmin'|'hradmin'|'manager'|'viewer', department, passcode }
```
⚠️ `passcode` plaintext storage is a known, flagged limitation of the prototype only.

### Question
```
{ id, code, dimension, text, type: 'likert'|'multiple_choice'|'text',
  phase: 'pre'|'post'|'both', options?: string[], optionScores?: number[],
  scoringPrompt?: string, required: boolean }
```

### Respondent
```
{ id, name, department, role, level,
  preScore: { trust, willingness, prepFoundations, prepWorkflow, prepTech, overall, custom?: {} },
  postScore?: (same shape),
  preSegment, postSegment?, pathway, completedPre, completedPost }
```

### Workflow
```
{ id, name, department, owner,
  tasks: [{ id, name, aiAugmented: boolean }],
  status: 'identified'|'augmented'|'piloting'|'standard',
  usageRate?: number,        // % during piloting
  adoptionThreshold?: number,// % required to trigger paving
  complianceRate?: number,   // % once standardized
  linkedGoalIds: string[],
  dateIdentified, dateAugmented?, dateScaled? }
```

### Intervention
```
{ id, type: 'training_moment'|'casual_collision'|'sustainment_session'|'role_based_training',
  format: 'virtual'|'in_person', title, description, date,
  linkedWorkflowIds: string[], linkedDepartment?, participants: string[],
  status: 'planned'|'completed', facilitator }
```

### TransformationGoal
```
{ id, title,                 // business-impact name, e.g. "Efficiency Gains"
  category: 'productivity'|'quality'|'revenue'|'capability',
  tier: 0|1|2|3,
  maturity: 'literate'|'applied'|'operational'|'transformational', // GA stage — see §2.4, distinct axis from tier
  statement: { action, resources, outcome },  // the three sentence fragments
  measurementSource: 'nudge'|'manual'|'vendor_api'|'system_api',
  measures?: string,           // the underlying question/signal this goal tracks
  sourceDetail?: string,       // how the measurement is actually captured
  currentValue, targetValue?, unit?,
  linkedWorkflowIds: string[], linkedNudgeIds: string[],
  vendorSources?: [{ name, notes }],          // for tiers 2-3
  implementationSteps?: [{ title, detail }],
  roiExample?: string,
  lastUpdated, updatedBy }
```
*(`maturity` was added 2026-08-30, during the phase-2 build: §2.4 already required every Goal
card to show "Tier + GA maturity tags," but this schema had omitted the field. `measures` and
`sourceDetail` were also added to carry over context from the client's real ROI grid content
now seeded in `app/App.jsx`.)*

### Nudge — *not yet built*
```
{ id, questionText, linkedGoalId, cadence: 'per-completion'|'weekly'|'monthly',
  targetAudience: { department?, role?, individualIds? },
  responses: [{ respondentId, value, timestamp }] }
```

### Integration — *not yet built*
```
{ id, vendorName, authType: 'oauth', status: 'connected'|'disconnected',
  scopes: string[], connectedAt?, lastSync?, syncedMetrics: string[] }
```

---

## 5. Design System

**Typography:**
- Display/hero headers: `Michroma` (sparingly — main title only)
- UI headers, nav, body: `Rajdhani` (500/600/700 weights)
- All data values, technical labels, codes: `JetBrains Mono`

**Color tokens (dark HUD aesthetic):**
```
--bg: #030507 / #07090B      background canvas
--cyan: #5EE6FF              primary accent, "action" phrase, Tier 2
--amber: #F0A94E             secondary accent, "resources" phrase, Tier 0
--green: #7FE0A0             "outcome" phrase only
--violet: #C79EF0            Quality category, Tier 3
--rose: #F08FB0              Capability category
--sub: #6E8790               muted text / labels
```
Category color (shown on column headers) and tier color (shown on card left-border) are **deliberately different hues** so the two axes never visually collide.

**Signature component patterns:**
- Corner-bracket panel framing (four short L-shaped strokes, not a solid border) instead of flat cards.
- Chamfered/clip-path corners on buttons and chips — never fully rounded rects.
- Window-chrome title bars (label + minimize/maximize/close glyphs) on major panels.
- Radial gauges and the animated Rogers curve (real curve math, not decorative) as the signature data visualizations.
- ALL CAPS + wide letter-spacing reserved for small monospace eyebrows/labels only — body and goal-statement text stays in sentence case for readability.

**Explicitly rejected directions** (for future reference — don't re-propose): plain "broadsheet hairline" neutral admin-dashboard look (the original default this whole redesign moved away from); literal 3D rotating globe as the hero visualization (replaced by the Rogers curve — more legible, more on-topic).

---

## 6. Engineering Framework

### 6.1 Current state (prototype)
- Single-file React artifact, in-browser only, using the artifact `window.storage` key-value API (shared scope) for Respondents/Questions/Users.
- No real backend, no real auth, no real vendor integrations, no persistence outside this storage layer.
- Known limitations, explicitly accepted for prototyping only: shared-blob storage (last-write-wins, not concurrency-safe), plaintext passcodes, no audit trail.

### 6.2 Target production architecture
- **Hosting:** Vercel (frontend) — chosen for the easy/free path.
- **Backend + DB:** Supabase (Postgres + built-in Auth) — replaces plaintext passcode auth with real hashed/SSO auth in the same move.
- **Integrations registry:** a `connectors` table (vendor, auth config, field mappings) + OAuth token storage (encrypted) + a scheduled sync worker per connector. The admin-facing "Integrations" tab is just a list view over this registry with Connect/Disconnect buttons — all connector logic is pre-built, never written ad hoc per Goal.
- **Scoring engine:** the text-answer LLM scoring call (Claude) must move server-side in production (currently client-side in the prototype) to protect API keys and add retry/rate-limit handling.

### 6.3 Build sequence
**Note (2026-08-30): executed out of the order below.** The backend/auth
migration (originally step 5) was pulled forward at the user's request, done
immediately after step 2, ahead of Nudges and Tier-1 forms — because the
user wanted a real standalone application, not continued artifact-prototype
iteration. Steps below are kept in their original numbering for continuity
with the rest of this document, but treat `README.md`'s "Next steps"
section and the aim-platform skill's `references/engineering.md` as the
current source of truth for what's actually done.

1. ✅ Consolidate this spec (current step).
2. ✅ Add **Transformation Goals** as a real data model — first in the prototype (still `window.storage`), editable `currentValue` by hand for every tier — makes the ROI ladder live instead of static. Seed content is the client's real ROI grid (19 goals across all 4 categories × 4 tiers), transcribed from `design/active/roi-ladder.html` — not placeholder data. `currentValue` seeds as `null` on every goal — the `roiExample` strings are the client's own illustrative case-study language, not this org's live numbers, so a fabricated starting value would misrepresent them as real.
3. ✅ Build **Nudges** tab; wire Tier 0 goals to real Nudge response data and existing Readiness scores — done, once Take Assessment (step 5) unblocked it. Admin-only nudge authoring (superadmin/hradmin per §3) with department/role targeting (not yet per-individual); each nudge shows its linked goal and live response data next to it. Actual response collection lives on the Dashboard's "Nudges for you" widget (All roles) rather than the Nudges tab itself, since §3 restricts that tab's nav access to admins — a nudge is delivered *to* someone, not something they navigate to an admin page to find.
4. ✅ Add manual-entry admin forms for Tier 1 goals — done. The generic `currentValue` field (step 2) only covers a single overwritable scalar; Tier 1's own mechanism (manual tagging/expert review) implied a log of individual review events instead, so this added a `goal_review_entries` table (`supabase/migrations/0002_tier1_review_log.sql`) plus a review-log UI on each Tier 1 goal's detail view — reviewer note, flagged/not, running flagged-rate — rather than stretching `currentValue` to cover something it wasn't shaped for.
5. ✅ **Migrate off `window.storage` to the real backend** (Next.js + Supabase, hosting on Vercel) — done, pulled forward ahead of steps 3-4. Real auth (email/password + SSO) replaces plaintext passcodes. Full schema + RLS for every §4 data model exists in `supabase/migrations/0001_init.sql`. All six prototype tabs (Dashboard, Assessment Builder, Take Assessment, Scoring Engine, Reports, Teams) are now ported and real — `prototype/App.jsx` is purely historical reference. Verified with `npm run build`/`typecheck`/`lint`; not yet deployed to a live Vercel/Supabase project, not yet browser-tested.
6. Build the Integrations registry + first vendor connector (Tier 2) — prioritize by which vendor the client actually uses first, not speculative build-all. Schema reserved (`public.integrations`); no vendor chosen, no UI built.
7. Build deep system integrations (Tier 3) — token telemetry, compliance logging, cross-system models — last, since it's the highest cost and benefits from patterns proven in step 6.

### 6.4 Process going forward
- This document is the reference for any new feature discussion — check it before proposing new data shapes or visual patterns.
- Once stable, this spec should be packaged into a Claude **Skill** so future sessions (including a fresh conversation) start from these conventions automatically rather than being re-derived from memory or re-improvised.
- Actual implementation (backend, integrations, migrations) should move to **Claude Code** in a real repository with version control and tests once this spec is stable — chat-based artifact iteration is the right tool for design exploration, not for production engineering.

---

## 7. Open Decisions Log

Flagged during design but not yet resolved — resolve before building the affected feature:

- [ ] Workflow adoption rollup: plain average, or weighted (by headcount, dollar value, or deal size)?
- [ ] Piloting-to-standard usage threshold: fixed platform-wide, or configurable per workflow/functional leader?
- [ ] Paving trigger: automatic once threshold is crossed, or requires explicit functional-leader approval?
- [ ] Should Workflows be *required* to link to a Transformation Goal, or is tagging optional?
- [ ] Should the 3 illustrative Tier-0 Nudge entries (productivity/quality/revenue) become real, admin-authored questions per category, rather than fixed seed content?
- [ ] ROI ladder card interaction: always show the full goal sentence, or collapse to title-only with expand-on-click/hover for density?
- [ ] Real auth approach: email/password with hashing, or SSO (Google/Microsoft)?
- [ ] Pyramid/rollup depth: fixed template (Use Case → Functional → Cross-Functional → Enterprise), or fully flexible levels an org defines themselves?
- [ ] Role-based edit permissions for Workflows and Transformation Goals tabs (currently only view-access is role-gated in the nav; edit rights within those tabs are undefined).

---

## 8. Reference Artifacts

Prior mockups produced during design exploration (for historical reference — superseded by the decisions in this document where they conflict):

| Artifact | What it explored |
|---|---|
| `prototype/App.jsx` | Full working prototype: survey flow, live scoring, storage-backed persistence, role-gated login. Superseded by the real app in `src/` as of the phase-5 migration for anything already ported (currently just Transformation Goals) — still the reference for what isn't ported yet. |
| `design-directions.html` | Three early visual directions (Instrument Panel, Field Notebook, Diffusion Spectrum) |
| `hud-direction.html`, `layout-options.html`, `typography-options.html` | JARVIS/HUD visual refinement — palette, layout skeletons, typography pairings |
| `jarvis-mockup-v2/v3/v4.html` | Hero visualization evolution: 3D globe → animated Rogers curve → fully interactive per-respondent curve |
| `workflows-interventions.html` | Workflow pipeline board + Interventions planner, first pass |
| `goals-wizard.html` | Use case → Transformation Goal statement builder wizard |
| `roi-pyramid.html`, `roi-pyramid-v2.html` | Early value-tree/pyramid exploration (superseded — see honesty note in §2.4) |
| `roi-grid-pyramid.html`, `roi-ladder.html`, `roi-ladder-v2.html` | Final ROI Measurability Ladder — client's real 16+ methods, 4 categories × 4 tiers, goal-statement formatting |

---

*End of document. Update this file as decisions change — do not let new features get designed without a corresponding update here.*
