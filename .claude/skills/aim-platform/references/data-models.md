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
`supabase/migrations/0001_init.sql` as of the phase-5 migration (pulled
forward — see `references/engineering.md`). Only **TransformationGoal**
(and, implicitly, Profile/Question via auth + the seed script) has actual
data flowing through it and a real UI. Respondent, Workflow, Intervention,
Nudge, and Integration have schema but no UI yet — Nudge and Integration
also have no logic wired to their tables (both still "not yet built" as
*features*, per PRD §4, even though their tables now exist). The original
`window.storage`-only versions of these models live only in
`prototype/App.jsx` now, which is no longer being extended.
