# Engineering Framework

Mirrors PRD §6. Full text: `docs/PRD-Engineering-Framework.md`.

## 6.1 Current state — standalone Next.js + Supabase app

The phase-5 migration was pulled forward, at the user's explicit request,
ahead of phases 3-4 — once Transformation Goals (phase 2) already existed as
a real data model. The app is a real project now, not an artifact, and every
tab the original prototype had is ported and DB-backed:

- `src/app/` — Next.js 16 App Router (Turbopack). `src/app/(app)/` is the
  protected shell; `src/app/login/`, `src/app/auth/callback/` handle auth.
- `src/lib/supabase/` — browser client, server client (RLS-respecting), and
  an admin client (service-role, RLS-bypassing, server-only — used by
  `scripts/seed.ts`).
- `src/lib/types.ts` — shared TS types mirroring PRD §4 (kept in sync with
  `supabase/migrations/*.sql` and `references/data-models.md`).
- `src/lib/scoring.ts` — the Readiness scoring engine (dimension-bucket
  resolution, segment/pathway rules), shared by Take Assessment, Dashboard,
  and Reports.
- `src/lib/anthropic.ts` — the open-text scoring call to Claude, moved
  server-side per PRD §6.2 (marked `"server-only"` — importing it from a
  Client Component is a build error, not just a convention).
- `supabase/migrations/0001_init.sql` — full Postgres schema + RLS for
  **every** PRD §4 model, not just the ones with a UI yet.
- `supabase/migrations/0002_tier1_review_log.sql` — `goal_review_entries`,
  added for build phase 4 (Tier 1 manual-entry forms).
- `supabase/migrations/0003_integrations_registry.sql` — extends
  `public.integrations` with `config`/`access_token`/`refresh_token`/
  `token_expires_at`, matching PRD §6.2's fuller description. Token columns
  are explicitly plaintext-placeholder (see the migration's column
  comments) — no real vendor OAuth flow exists to populate them yet.
- `supabase/migrations/0004_notification_delivery.sql` — `notification_identities`
  (cached profile → external-user-id mapping per provider) and
  `nudge_deliveries` (one row per individual push attempt: sent/failed/
  responded) + `nudges.last_dispatched_at`. RLS is SELECT-only for
  superadmin/hradmin — all writes go through the service-role client in
  `dispatch.ts`, never direct end-user access.
- `supabase/migrations/0005_integrations_vendor_unique.sql` — unique
  constraint on `integrations.vendor_name`, needed for the Integrations
  "Connect" action's `upsert(..., { onConflict: "vendor_name" })`.
- `src/lib/integrations/registry.ts` — the Integrations Registry pattern:
  `ConnectorDefinition` now carries `purpose: "notification" | "metrics_sync"`
  and `authType: "oauth" | "bot_token"`. `CONNECTOR_REGISTRY` is **populated**
  for notification-purpose connectors (`slack`, `microsoft_teams`) — still
  **empty** for metrics-sync connectors (Tier 2/3), since that vendor
  remains unchosen. Don't conflate the two purposes when adding a connector.
- `src/lib/notifications/` — the notification-delivery subsystem (added to
  support organic push-style Nudges, see below): `provider.ts` (the
  vendor-agnostic `NotificationProvider` interface), `slack.ts` and
  `teams.ts` (real implementations), `registry.ts` (`NOTIFICATION_PROVIDERS`
  map), `dispatch.ts` (`dispatchNudge`/`dispatchDueNudges`/
  `recordIncomingResponse` — identity resolution, send, and delivery
  logging, all via the service-role client since it crosses tables RLS
  doesn't grant end users).
- `src/app/api/cron/dispatch-nudges/route.ts` — Vercel Cron target (see
  `vercel.json`), guarded by `CRON_SECRET`.
- `src/app/api/webhooks/slack/route.ts`, `src/app/api/webhooks/teams/route.ts`
  — inbound reply handlers (Slack HMAC signature verification, Teams Bot
  Framework JWT verification against JWKS — the Teams verification is
  hand-rolled and explicitly flagged in-code as not the officially
  recommended path vs. the `botbuilder` SDK).
- Real auth: Supabase Auth, email/password (hashed) **and** vendor-agnostic
  enterprise SSO (`signInWithSSO({ domain })`, resolving to whatever SAML/
  OIDC IdP — Okta, Entra ID, OneLogin, etc. — each enterprise registers for
  their own domain), plus Microsoft OAuth as a separate convenience sign-in.
  **Deliberately no Google** — explicit client steer that many enterprises
  avoid it; this resolves the PRD §7 open question. New signups default to
  `viewer` role via a Postgres trigger; a superadmin/hradmin promotes from
  Teams.

**Real and DB-backed:** everything — auth, the role-gated shell, Take
Assessment (`src/app/(app)/survey/`), Assessment Builder (`assessments/`),
Scoring Engine (`scoring-engine/`), Dashboard (`dashboard/`), Reports
(`reports/`), Teams (`teams/`), Transformation Goals (`goals/`, plus its
Tier 1 review log), Nudges (`nudges/` — now including Slack/Teams push
delivery and delivery-stats visibility), Workflows (`workflows/`), and the
Integrations tab (`integrations/` — real notification connectors; still
framework-only for metrics-sync, see below).
`src/components/NotMigrated.tsx` is now unused.

**Not built:** a **metrics-sync vendor connector** for Integrations (Tier
2/3 Transformation Goals) — the registry framework is real and functional
for that purpose too, but no vendor has been chosen (PRD §6.2/§7); this is
separate from notification delivery, which is done. **Deep system
integrations** (Tier 3, phase 7) come after that. Nothing here has been
deployed to a live Vercel/Supabase project or browser-tested — see §6.2.

`prototype/App.jsx` (moved from `app/App.jsx` — the App Router needed that
path) is the original browser-only artifact: `window.storage`, plaintext
passcode auth, no real backend. It's no longer live, and — now that every
tab it had is ported — nothing depends on it as a reference anymore. Keep it
only as design history; don't extend it.

## 6.2 Target production architecture

- **Hosting:** Vercel — not yet deployed; the app builds cleanly locally
  (`npm run build`, verified) but has no live Vercel project or Supabase
  project connected yet. Whoever picks this up needs to create both and
  fill in `.env` from `.env.example`, then browser-test everything — none
  of this has run outside `npm run build`/`typecheck`/`lint` so far.
- **Backend + DB:** Supabase (Postgres + Auth) — schema and auth are real
  now (see above), but only against whatever Supabase project the `.env`
  points at; nothing is provisioned by this codebase itself.
- **Integrations registry:** ✅ framework done, ✅ real connectors for
  notification purpose (Slack, Microsoft Teams — `testConnection()` actually
  verifies the credential) — `public.integrations` (vendor, auth config,
  field mappings, OAuth token columns) + `CONNECTOR_REGISTRY` + a real
  Integrations tab with functional Connect/Disconnect actions. **Still no
  metrics-sync vendor chosen** (Tier 2/3 Transformation Goals) — don't build
  a speculative connector for that purpose; it's the one piece deliberately
  left undone. The "scheduled sync worker per connector" part for
  metrics-sync is still notional for the same reason.
- **Notification delivery:** ✅ done — Slack and Microsoft Teams, chosen
  specifically because the client flagged that many enterprises avoid
  Google. See `src/lib/notifications/` above. Runs entirely over
  outbound-only HTTPS (webhook replies verified via HMAC/JWT rather than an
  inbound connection), which is what survives enterprise firewall/egress
  policy without a VPN or installed agent.
- **Scoring engine:** ✅ done — `src/lib/anthropic.ts`'s `scoreTextAnswer`
  runs server-side, called from the `submitAssessment` Server Action in
  `src/app/(app)/survey/actions.ts`, using `ANTHROPIC_API_KEY` from `.env`.

## 6.3 Build sequence — executed OUT OF ORDER, see note

PRD §6.3's original sequence assumed the backend migration (step 5) would
come *after* Nudges and Tier-1 forms (steps 3-4), so those could be built
cheaply against `window.storage` first. The user asked to pull the migration
forward instead, once step 2 was done — so the order below is what actually
happened, not the PRD's original numbering.

1. ✅ Consolidate the PRD spec.
2. ✅ Add **Transformation Goals** as a real data model — done first in the
   prototype (`window.storage`), then re-implemented against Supabase during
   step 3 below. Real 19-goal ROI-grid content either way.
3. ✅ **(Reordered ahead)** Standalone app + backend + auth: Next.js 16 +
   Supabase, full schema + RLS for every PRD §4 model, real auth
   (email/password + SSO), Transformation Goals ported to be DB-backed.
4. ✅ Port the remaining prototype tabs (Dashboard, Assessment Builder, Take
   Assessment, Scoring Engine, Reports, Teams) into real Supabase-backed
   pages. Take Assessment matches respondents to the signed-in account via
   `profile_id` — a real improvement over the prototype's fragile
   name+department string matching.
5. ✅ Build **Nudges** tab; wire Tier 0 goals to real Nudge response data and
   existing Readiness scores. Unblocked once step 4 gave it real Respondent
   data. Admin-only tab (superadmin/hradmin, per PRD §3); response
   collection happens on the Dashboard's "Nudges for you" widget instead,
   since a nudge is delivered *to* someone, not something they navigate to
   an admin page to find.
6. ✅ Add manual-entry admin forms for Tier 1 goals. The generic
   `currentValue` field only covers one overwritable scalar; Tier 1's own
   mechanism (manual tagging/expert review) implied a log of individual
   review events, so this added `goal_review_entries`
   (`0002_tier1_review_log.sql`) plus a review-log UI on each Tier 1 goal's
   detail view, rather than stretching `currentValue` to cover something it
   wasn't shaped for.
7. ✅ Build the **Workflows** tab (referenced in PRD §3's nav, mocked but
   never built — a pre-existing gap, not one of §6.3's numbered phases).
   Real Kanban over the already-existing `workflows` schema; stage
   advancement is always a manual admin action and `adoptionThreshold`
   stays per-workflow-editable, so neither of §7's two open Workflows
   questions got silently resolved by the implementation.
8. ✅ Build the **Integrations registry framework** (no vendor connector —
   explicit user decision). `public.integrations` extended to match PRD
   §6.2's fuller shape, `CONNECTOR_REGISTRY` pattern, real Integrations tab.
   **Still not done:** the first actual vendor connector — depends on which
   vendor the client uses, still unchosen — and deep system integrations
   (Tier 3, next).
9. ✅ Build **organic push-style Nudge delivery** (Slack + Microsoft Teams)
   and replace the Google SSO option with vendor-agnostic enterprise SSO —
   driven directly by the client's production-UX requirement (people answer
   Nudges as they come up during the day, not by visiting a site; leaders
   get a portal view of whether delivery actually reached people) plus an
   explicit "avoid Google" steer. See `references/data-models.md` for the
   new `NotificationIdentity`/`NudgeDelivery` tables and PRD §6.3 step 8 for
   the full rationale.
10. ✅ **(Added, 2026-10-16) Three.js/WebGL UI pass** — four real
    visualizations (Dashboard adoption curve, ROI Ladder, Workflows
    pipeline, ambient app-shell backdrop) plus an app-wide editorial pass
    (asymmetric layouts, deliberate transitions). Driven by an explicit
    "make the UI innovative, use three.js" request. Every data-bearing
    scene falls back to a real 2D/CSS equivalent when WebGL is unavailable
    or `prefers-reduced-motion` is set — see `references/design-system.md`'s
    "Three.js / WebGL layer" section for the components, the pattern, and
    two real bugs (an `html`/`body` CSS stacking issue, a `drei` `Html`
    unmount issue) worth knowing before touching this layer again.
11. Build **deep system integrations** (Tier 3) — last, highest cost,
   benefits from patterns proven in step 8. **Not started.**
12. Stand up a real Vercel + Supabase project and browser-test the app —
    nothing here has run outside `npm run build`/`typecheck`/`lint` so far.
    This is arguably more urgent than steps 10-11 for anyone about to demo
    this to the client.

## 6.4 Process going forward

- `docs/PRD-Engineering-Framework.md` is the reference for any new feature
  discussion — check it before proposing new data shapes or visual
  patterns.
- This skill package (`.claude/skills/aim-platform/`) exists so future
  sessions — including a fresh conversation — start from these conventions
  automatically rather than re-deriving them from memory or
  re-improvising.
- Actual implementation (backend, integrations, migrations) belongs in
  **Claude Code**, in this repository, with version control and tests —
  which is now literally true: `src/` is the real app. Chat-based artifact
  iteration (the old `prototype/App.jsx` workflow) was the right tool for
  early design exploration, not for anything going forward.
