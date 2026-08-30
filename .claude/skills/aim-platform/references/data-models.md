# Data Models

Mirrors PRD §4. Full text: `docs/PRD-Engineering-Framework.md`.

> Field lists below reflect what's been built/decided in the prototype and
> design conversation. Types are illustrative (TypeScript-ish), not a final
> schema — final schema is an engineering task once this moves to a real
> backend (see `references/engineering.md`).

### User
```
{ id, name, email, role: 'superadmin'|'hradmin'|'manager'|'viewer', department, passcode }
```
⚠️ `passcode` plaintext storage is a known, flagged limitation of the
prototype only — never carry this forward into the real backend.

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
  maturity: 'literate'|'applied'|'operational'|'transformational', // GA stage — distinct axis from tier
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
Real, DB-backed as of the phase-5 migration: schema in
`supabase/migrations/0001_init.sql`, TS type in `src/lib/types.ts`, seed
content in `src/lib/data/transformation-goals-seed.ts` (the client's real
19-goal ROI grid, originally transcribed from `design/active/roi-ladder.html`
into `prototype/App.jsx` during build phase 2, now the canonical copy).

### GoalReviewEntry — Tier 1 manual-review log (added build phase 4, not in the original PRD §4 list)
```
{ id, goalId, reviewerId, note?, flagged: boolean, createdAt }
```
One row per expert-review event on a Tier 1 goal — schema in
`supabase/migrations/0002_tier1_review_log.sql`, TS type in `src/lib/types.ts`.
Exists because Tier 1's "manual tagging / expert review" mechanism (PRD
§2.4) implies a running log, not one overwritable number the way
`currentValue` works for every other tier.

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

## Where these live today

Every model above has a real Postgres table + RLS policy in
`supabase/migrations/0001_init.sql`. As of build phases 3-6 (see
`references/engineering.md`), **Profile, Question, Respondent,
TransformationGoal, and Nudge/NudgeResponse all have real UI and real data
flowing through them.** TransformationGoal also has a Tier-1-only companion
table, `goal_review_entries` (`0002_tier1_review_log.sql`), not in the PRD §4
shape above — a log of individual manual-review events, since Tier 1's
"expert review" mechanism doesn't fit a single overwritable `currentValue`.

**Workflow and Intervention** have schema but no UI — the Workflows tab is a
pre-existing gap (referenced in PRD §3's nav, has a mockup, was never built
even in the original prototype), and Interventions ride along with it since
nothing surfaces them yet either. **Integration** has schema but no UI and
no logic (build phase 6, no vendor chosen — see `references/engineering.md`).

`prototype/App.jsx` is no longer a live reference for anything — every tab
it had is ported. Keep it only as design history.
