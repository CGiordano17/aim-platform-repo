# AIM Platform

AI Measurement platform for workforce AI transformation — built around the client's First Person Framework (Identify → Inform → Invest → Inspire → Instill). See [`docs/PRD-Engineering-Framework.md`](docs/PRD-Engineering-Framework.md) for the full product requirements, data models, and engineering plan. That document is the source of truth — check it before adding any new feature.

## Current status

This is a **standalone Next.js + Supabase application** — no more browser-only artifact prototype in the loop. Real auth (email/password + vendor-agnostic enterprise SSO) and a real Postgres schema exist for every PRD §4 data model, and every tab from the original prototype is now ported and DB-backed.

**What's real and running:**
- Auth (Supabase Auth — email/password, hashed, plus vendor-agnostic enterprise SSO via `signInWithSSO({ domain })`, resolving to whatever SAML/OIDC IdP — Okta, Entra ID, OneLogin, etc. — each enterprise registers; Microsoft OAuth is a separate convenience sign-in. Deliberately no Google — many enterprises explicitly avoid it.)
- Full Postgres schema + Row Level Security for every PRD §4 data model, across five migrations
- **Take Assessment** — real intake → questions → server-side-scored → result flow, respondents matched to accounts via `profile_id`
- **Assessment Builder** — real Question CRUD
- **Scoring Engine** — reference view over the shared scoring rules
- **Dashboard** — org-wide stats, adoption curve, segment/pathway breakdowns, plus a "Nudges for you" widget
- **Reports** — org / department / individual drill-down
- **Teams** — role management (superadmin only)
- **Transformation Goals** — the ROI Measurability Ladder, real 19-goal content, editable `currentValue`, plus a Tier 1 manual-review log (reviewer note, flagged rate) on top of it
- **Nudges** — admin-authored, department/role-targeted, linked to Tier 0 goals; answerable either organically (a reply to a Slack/Teams push) or via the Dashboard widget, since PRD §3 keeps the Nudges tab itself admin-only. The admin tab shows real delivery stats (sent/failed/responded, by provider) and a manual "Send now" per nudge.
- **Notification delivery** — a vendor-agnostic `NotificationProvider` interface with real Slack and Microsoft Teams implementations (`src/lib/notifications/`), a Vercel Cron job dispatching due nudges daily, and HMAC/JWT-verified webhooks for inbound replies. Chosen over Google specifically because many enterprises avoid it; runs entirely over outbound-only HTTPS, which is what survives enterprise firewall/egress policy.
- **Workflows** — the "dirt path → pave it" Kanban (Identified → Augmented → Piloting → Standard); referenced in PRD §3's nav and mocked in `design/`, but never actually implemented until now
- **Integrations** — the registry framework (connectors table, OAuth/bot-token columns, a typed connector-definition pattern, real Connect/Disconnect UI) — **real connectors for notification delivery** (Slack, Microsoft Teams), but still **no metrics-sync vendor connector** for Tier 2/3 Transformation Goals, since that vendor hasn't been chosen yet
- **Three.js/WebGL UI** — the Dashboard adoption curve, the ROI Measurability Ladder, and the Workflows pipeline each have a real interactive 3D view (toggleable to a 2D/list fallback), plus a subtle ambient backdrop behind the whole app shell and the login page. Every data-bearing scene degrades to a real working 2D/CSS equivalent — not a blank panel — when WebGL is unavailable (locked-down enterprise devices routinely disable it) or `prefers-reduced-motion` is set. See `.claude/skills/aim-platform/references/design-system.md`'s "Three.js / WebGL layer" section.

**Not built yet:** a metrics-sync vendor connector for Integrations (blocked on that vendor decision) and deep system integrations (Tier 3, phase 7), which depends on it.

## Repo structure

```
src/
  app/                          — Next.js App Router
    login/, auth/callback/      — auth pages + SSO/OAuth/email callback
    api/cron/dispatch-nudges/   — Vercel Cron target, CRON_SECRET-guarded
    api/webhooks/slack/, api/webhooks/teams/  — inbound reply handlers
    (app)/                      — protected app shell (role-gated nav)
      goals/, survey/, assessments/, teams/, nudges/, workflows/, integrations/  — pages + server actions
      dashboard/, reports/, scoring-engine/, config/
  components/                   — one folder per feature area, plus shared/ (AdoptionCurve, StatCard, etc.)
                                   and three/ (shared WebGL infra: Scene wrapper, WebGL/reduced-motion hooks)
  lib/
    supabase/                   — browser/server/middleware Supabase clients
    data/                       — real seed content (goals, questions), typed
    integrations/registry.ts    — the Integrations Registry pattern (populated for notification connectors; still empty for metrics-sync — no vendor chosen)
    notifications/              — vendor-agnostic NotificationProvider interface + Slack/Teams implementations + dispatch engine
    scoring.ts                  — the Readiness scoring engine (dimension buckets, segment/pathway rules)
    anthropic.ts                — server-only Claude scoring call (PRD §6.2)
    types.ts                    — shared TS types mirroring PRD §4
    nav.ts, goal-meta.ts, respondents.ts

vercel.json                      — Cron schedule for dispatch-nudges

supabase/
  migrations/
    0001_init.sql                — full schema + RLS for every PRD §4 model
    0002_tier1_review_log.sql    — Tier 1 manual-review log (build phase 4)
    0003_integrations_registry.sql — connectors config + OAuth token columns (build phase 6, framework only)
    0004_notification_delivery.sql — notification_identities, nudge_deliveries, nudges.last_dispatched_at
    0005_integrations_vendor_unique.sql — unique constraint on integrations.vendor_name, for the Connect action's upsert

scripts/
  seed.ts                       — seeds real Goals + Questions content (not prototype demo data)

prototype/
  App.jsx                       — the original artifact-only prototype. Purely historical now —
                                   every tab it had is ported to src/. Not deployable — depends on
                                   window.storage and a Claude.ai artifact sandbox.

docs/
  PRD-Engineering-Framework.md  — product requirements, data models, design system,
                                  engineering framework, open decisions log
  architecture-wireframe.html   — visual system architecture (built vs. planned layers)

design/
  active/                       — mockups that still represent current, un-superseded decisions
  archive/                      — superseded design exploration, kept for history
```

## Running it

```bash
npm install
cp .env.example .env        # fill in your Supabase project's real values
```

1. Create a Supabase project, then run all five migrations in order:
   `supabase db push` (with the Supabase CLI linked to your project), or paste
   `0001_init.sql`, `0002_tier1_review_log.sql`, `0003_integrations_registry.sql`,
   `0004_notification_delivery.sql`, then `0005_integrations_vendor_unique.sql`
   into the SQL editor, in that order.
2. In the Supabase dashboard → Authentication → Providers, enable Email and
   (optionally) Microsoft (Azure) as a convenience sign-in — register its
   OAuth app with redirect URI
   `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`. For enterprise
   SSO, use the Supabase CLI's `supabase sso add` per customer domain (Team/
   Enterprise plan required) — deliberately no Google provider, see
   `.env.example`.
3. For Nudge push delivery, fill in the Slack and/or Microsoft Teams
   credentials in `.env` (see `.env.example`) and set `CRON_SECRET` on
   Vercel to match the Vercel Cron job defined in `vercel.json`.
4. Seed the real content: `npm run db:seed`
5. `npm run dev` — http://localhost:3000

Also available: `npm run build`, `npm run typecheck`, `npm run lint`.

**Not yet done, whoever picks this up next:** no live Vercel or Supabase project is actually connected in this environment — `npm run build`/`typecheck`/`lint` are all clean, but nothing here has been click-tested in a browser or deployed. That's the first thing to do before trusting any of this in front of the client.

## Next steps (see PRD §6.3 for the full sequence — executed out of order; §6.3's note explains why)

1. ✅ Transformation Goals as a real data model (phase 2).
2. ✅ Standalone app scaffold, real backend + auth (phase 5, pulled forward).
3. ✅ Port the remaining prototype tabs into real Supabase-backed pages.
4. ✅ Nudges tab (phase 3) + Tier 1 manual-review forms (phase 4).
5. ✅ Workflows tab — referenced in PRD §3's nav but never implemented (not one of the numbered PRD phases, a separate gap).
6. ✅ Integrations registry framework (phase 6) — no vendor connector, since none is chosen.
7. ✅ Organic push-style Nudge delivery (Slack + Microsoft Teams) and vendor-agnostic enterprise SSO, replacing the Google option — driven by the client's production-UX requirement and an explicit "avoid Google" steer (PRD §6.3 step 8).
8. ✅ Three.js/WebGL UI pass (Dashboard curve, ROI Ladder, Workflows pipeline, ambient backdrop) plus an app-wide editorial/asymmetry pass — driven by an explicit "make the UI innovative, use three.js" request.
9. **Stand up a real Vercel + Supabase project and browser-test the whole thing** — nothing here has run outside `npm run build`/`typecheck`/`lint` yet. Arguably more urgent than 10-11 before anyone demos this.
10. Pick a vendor and build the first real metrics-sync Integrations connector (phase 6, remaining piece — separate from the notification connectors, which are done).
11. Build deep system integrations (Tier 3, phase 7).
