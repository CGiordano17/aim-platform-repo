# Product & Conceptual Framework

Mirrors PRD §1–2. Full text: `docs/PRD-Engineering-Framework.md`.

## 1. Product Overview

AIM is a workforce AI-transformation platform built around a human-centered
framework (the First Person Framework, below). It measures three
complementary, **intentionally separate** workstreams:

1. **Readiness** — are people (individuals, departments, the org) ready to
   adopt AI, and where do they sit on the Rogers adoption curve.
2. **Workflows** — which specific work tasks are being identified,
   AI-augmented, piloted, and eventually standardized ("paved").
3. **Transformation Goals** — the enterprise-level ROI statements everything
   above ladders up into, each with an explicit measurement mechanism.

These three are **peers in the navigation, not nested under one another**.
Interventions (training, peer pairing, etc.) are the lever used to move
people along Readiness and workflows through the pipeline — not a fourth
peer workstream.

## 2.1 The First Person Framework (client's framework — grounds all product decisions)

Five stages, each starting with "I": **Identify → Inform → Invest → Inspire
→ Instill**.

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

Example (client's own): *"The business will replace ⅔ of its CS agents with
chatbots by people who receive more time to do other critical work to
achieve bottom line improvements and lower consumer costs."*

Every Transformation Goal in the product must be expressible in this exact
three-part form. This is not optional flavor text — it's the unit of
measurement the whole Goals module is built around.

## 2.2 Rogers Diffusion of Innovation (Readiness workstream)

Population distribution across 5 segments, standard Rogers percentages:

| Segment | % of population | Score range (0–5 scale) |
|---|---|---|
| Laggards | 16% | 1.0 – 2.2 |
| Late majority | 34% | 2.3 – 2.9 |
| Early majority | 34% | 3.0 – 3.6 |
| Early adopters | 13.5% | 3.7 – 4.2 |
| Innovators | 2.5% | 4.3 – 5.0 |

**Dimension scores** (per respondent): Trust, Willingness, Prep —
Foundations, Prep — Workflow, Prep — Tech (approximated as avg of the two
Prep dimensions unless a real "Prep — Tech" question dimension exists).
`overall` = average of all populated dimension scores including any custom
dimensions.

**Pathway placement** (training track), derived from trust/prep/willingness:

| Pathway | Trust | Prep | Willingness | Curve range |
|---|---|---|---|---|
| AI Enabled | ≤ 3.0 | ≤ 2.5 | ≤ 3.0 | Late majority + Laggards |
| AI Augmented | 3.1–4.0 | 2.6–3.9 | 3.1–4.0 | Early majority + Early adopters |
| AI Superpowered | ≥ 4.1 | ≥ 4.0 | ≥ 4.1 | Innovators + Early adopters |

**Dimension-to-score-bucket resolution:** questions map to a scoring bucket
via `canonicalDimensionKey(dimensionText)` — a keyword match (contains
"trust" → trust, "willing" → willingness, etc.), **not** exact string
equality. Renaming a dimension's display label doesn't silently break
scoring; a genuinely new/unmapped dimension becomes a visible `custom:*`
bucket that still counts toward `overall`, flagged in the Assessment
Builder UI rather than silently dropped.

**Question types and scoring:**
- `likert` (1–5): direct numeric value.
- `multiple_choice`: each option carries an editable 1–5 `optionScore`;
  selected option's score feeds the bucket.
- `text`: sent to Claude with a per-question rubric (`scoringPrompt`),
  scored 1–5, with a neutral midpoint (3) fallback if the call fails. This
  is a real API call, not a mock — it must remain reliable in production
  (retry/fallback logic required).

## 2.3 Workflow scale-up lifecycle ("dirt path → pave it")

| Stage | Meaning |
|---|---|
| 1. Identify | High-value workflow flagged, broken into individual tasks |
| 2. Augment | Specific tasks within it are redesigned with AI assistance |
| 3. Pilot | Usage measured organically — the "dirt path" forming |
| 4. Bank & Scale | Once usage crosses a threshold, functional leader makes it the required standard — "paving" the path |
| 5. Comply | Adoption of the now-required workflow is tracked going forward |

**Open question (unresolved):** is paving automatic-at-threshold, or does it
require explicit functional-leader approval? Is the usage threshold
(mockups used 60%) fixed platform-wide or configurable per
workflow/leader? → See `references/open-decisions-and-artifacts.md`.

## 2.4 Transformation Goals & ROI Measurability Ladder

**Four categories** (client's own framework, exact names):
1. Productivity & Efficiency — owner: COO · CHRO · Operations
2. Quality & Risk — owner: Functional leads · GC · CISO
3. Revenue & Impact — owner: CEO · CRO · CCO
4. Workforce Capability — owner: CLO · CHRO

**Four measurement tiers** (bottom = easiest to start, top = highest
engineering cost and rigor):

| Tier | Name | Mechanism | Engineering need |
|---|---|---|---|
| 0 | Self-reported | Nudge micro-prompt or Readiness Assessment | None — already in-app |
| 1 | Manual tagging / expert review | A human adds a flag or scores an output by hand | Simple admin form |
| 2 | Native vendor reporting | Data already sits in a vendor admin console (Viva, Zendesk, Salesforce, GitHub) | OAuth connector per vendor |
| 3 | Deep system / API integration | Token telemetry, cross-system BI models, compliance logging | Custom integration + data pipeline |

**Important honesty note:** the client's original 16-method ROI grid was
explicitly designed to avoid self-report ("no self-report surveys"). Tier 0
in the product is therefore mostly populated by new Nudge-sourced entries
added specifically to complete the ladder, not by reclassifying the
original 16 — only "workforce readiness" among the original 16 is genuinely
self-report. **Do not force-fit system-sourced methods into Tier 0** to make
the ladder look more populated than it honestly is.

**Every Goal card must show, in this order:**
1. **Title** — a short business-impact name (e.g. "Efficiency Gains,"
   "Quality Control," "Deal Velocity," "Trust Signal") — never a vague
   research-question label.
2. **Statement** — the full three-part goal sentence, with the three
   lead-in phrases visually distinguished: `The business will…` (cyan),
   `by people who…` (amber), `to achieve…` (green).
3. **Tier + GA maturity tags** — measurement tier (0–3) and organizational
   maturity stage (literate/applied/operational/transformational) are two
   *different* axes; show both, don't conflate them.

**Goal → evidence convergence (the "pyramid"):** selecting an objective (via
a picker of common CLO/CFO/CRO objectives, or free-text matched by Claude)
highlights the specific goals that build its evidence case (primary =
strong match, secondary = supporting), and those converge visually into a
single claim. This is an honest pyramid — it only forms once a claim is
chosen — rather than a fake mathematical rollup applied to the whole grid
at rest.
