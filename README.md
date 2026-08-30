# AIM Platform

AI Measurement platform for workforce AI transformation — built around the client's First Person Framework (Identify → Inform → Invest → Inspire → Instill). See [`docs/PRD-Engineering-Framework.md`](docs/PRD-Engineering-Framework.md) for the full product requirements, data models, and engineering plan. That document is the source of truth — check it before adding any new feature.

## Current status

This is a **working prototype**, not a production app. It runs entirely client-side as a single React artifact using browser-scoped shared storage (`window.storage`) — there is no real backend, no real authentication, and no vendor integrations yet. See §6 of the PRD for the full list of known limitations and the planned migration to a real backend (Vercel + Supabase).

## Repo structure

```
app/
  App.jsx                     — the working prototype (survey flow, scoring engine,
                                 Workflows kanban, Interventions planner, Teams, role-gated nav)

docs/
  PRD-Engineering-Framework.md — product requirements, data models, design system,
                                 engineering framework, open decisions log
  architecture-wireframe.html  — visual system architecture (built vs. planned layers)

design/
  active/                      — mockups that still represent current, un-superseded decisions
    roi-ladder.html            — the ROI Measurability Ladder (4 categories x 4 measurement tiers)
    workflows-interventions.html
    goals-wizard.html
  archive/                     — superseded design exploration, kept for history
                                 (early visual directions, globe-based hero visualization,
                                 earlier pyramid attempts before the ROI ladder)
```

## Next steps (see PRD §6.3 for the full sequence)

1. Add Transformation Goals as a real data model in the prototype.
2. Build the Nudges tab; wire Tier 0 goals to live Nudge + Readiness data.
3. Add manual-entry admin forms for Tier 1 goals.
4. Migrate off `window.storage` to a real backend (Vercel + Supabase), including real auth.
5. Build the Integrations registry + first vendor connector.
6. Build deep system integrations (Tier 3).

## Running the prototype

`app/App.jsx` is currently designed to run inside a Claude.ai artifact (it depends on `window.storage` and calls the Anthropic API directly from the client, which only works in that sandboxed context). It is **not** a standalone app yet — porting it to a normal React project (Vite/Next.js) with a real backend is part of the migration in PRD §6.2–6.3.
