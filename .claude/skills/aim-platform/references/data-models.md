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

### Nudge
```
{ id, questionText, linkedGoalId, cadence: 'per-completion'|'weekly'|'monthly',
  targetAudience: { department?, role?, individualIds? },
  lastDispatchedAt?,            // added for push-style delivery
  responses: [{ respondentId, value, timestamp }] }
```
Real, DB-backed: schema in `supabase/migrations/0001_init.sql`
(`last_dispatched_at` added in `0004_notification_delivery.sql`), UI in
`src/app/(app)/nudges/`. A nudge can be answered either organically (a
reply to the Slack/Teams message it was pushed as) or via the Dashboard's
"Nudges for you" widget — both paths write to the same `nudge_responses`
table. Delivery (did it actually reach someone, on which provider) is
tracked separately — see `NudgeDelivery` below.

### Integration
```
{ id, vendorName, purpose: 'notification'|'metrics_sync', authType: 'oauth'|'bot_token',
  status: 'connected'|'disconnected', scopes: string[], connectedAt?, lastSync?,
  syncedMetrics: string[],
  config,                       // added build phase 6: auth config / field mappings
  accessToken?, refreshToken?, tokenExpiresAt? }  // added build phase 6 — NOT encrypted yet, see 0003's column comments
```
`CONNECTOR_REGISTRY` in `src/lib/integrations/registry.ts` is the actual
vendor-agnostic registry (PRD §6.2) this table's rows get created against.
**`purpose` distinguishes two unrelated uses**, added when notification
delivery was built: real, populated entries for `purpose: "notification"`
(Slack, Microsoft Teams) vs. still-empty `purpose: "metrics_sync"` (Tier
2/3 Transformation Goals — no vendor chosen yet). Don't conflate the two.

### NotificationIdentity — *added for push-style Nudge delivery*
```
{ id, profileId, provider: 'slack'|'microsoft_teams', externalUserId, createdAt }
```
Schema in `supabase/migrations/0004_notification_delivery.sql`, TS type
`NotificationIdentity` in `src/lib/types.ts`. Resolve-and-cache mapping from
a platform profile to that person's identity on a given notification
vendor (e.g. their Slack member ID) — resolved once by email lookup
(`resolveUserByEmail` on the provider) and reused, so there's no
user-facing "connect your account" step.

### NudgeDelivery — *added for push-style Nudge delivery*
```
{ id, nudgeId, profileId, provider: 'slack'|'microsoft_teams',
  status: 'sent'|'failed'|'responded', dispatchedAt, respondedAt? }
```
Schema in `supabase/migrations/0004_notification_delivery.sql`, TS type
`NudgeDelivery` in `src/lib/types.ts`. One row per individual push attempt
— the Nudges admin tab's delivery stats (sent/failed/responded counts,
which providers) are aggregated from this table, distinct from the
self-report `nudge_responses` table. RLS is SELECT-only for
superadmin/hradmin; all writes go through the service-role client in
`src/lib/notifications/dispatch.ts`.

## Where these live today

Every model above has a real Postgres table + RLS policy in
`supabase/migrations/0001_init.sql` (plus `0004_notification_delivery.sql`
for the two newest tables). As of build phases 3-9 (see
`references/engineering.md`), **Profile, Question, Respondent,
TransformationGoal, Nudge/NudgeResponse, NotificationIdentity,
NudgeDelivery, and Workflow all have real UI and real data flowing through
them.** TransformationGoal also has a Tier-1-only companion table,
`goal_review_entries` (`0002_tier1_review_log.sql`), not in the PRD §4
shape above — a log of individual manual-review events, since Tier 1's
"expert review" mechanism doesn't fit a single overwritable `currentValue`.

**Integration** has real schema, a real registry pattern
(`CONNECTOR_REGISTRY`), and a real admin tab with functional
Connect/Disconnect actions — real connectors exist for `purpose:
"notification"` (Slack, Microsoft Teams), but still none for `purpose:
"metrics_sync"` (Tier 2/3 Transformation Goals), since that vendor isn't
chosen.

**Intervention** is the one model with schema but genuinely no UI — it rode
along with Workflows in the original PRD §4 grouping, but wasn't part of
the Workflows-tab build and has no dedicated request to build it yet.

`prototype/App.jsx` is no longer a live reference for anything — every tab
it had is ported. Keep it only as design history.
