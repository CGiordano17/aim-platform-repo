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
Implemented in `app/App.jsx` (build phase 2), seeded with the client's real
19-goal ROI grid transcribed from `design/active/roi-ladder.html`.

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

All of the above (except Nudge and Integration, which don't exist yet) are
implemented in `app/App.jsx` using the artifact `window.storage` key-value
API — see `references/engineering.md` for the prototype's storage model and
the plan to migrate to Postgres via Supabase.
