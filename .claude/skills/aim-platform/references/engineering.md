# Engineering Framework

Mirrors PRD §6. Full text: `docs/PRD-Engineering-Framework.md`.

## 6.1 Current state (prototype)

- Single-file React artifact (`app/App.jsx`), in-browser only, using the
  artifact `window.storage` key-value API (shared scope) for
  Respondents/Questions/Users.
- No real backend, no real auth, no real vendor integrations, no
  persistence outside this storage layer.
- Known limitations, **explicitly accepted for prototyping only**:
  shared-blob storage (last-write-wins, not concurrency-safe), plaintext
  passcodes, no audit trail. Don't "fix" these in place — see the migration
  step below.

## 6.2 Target production architecture

- **Hosting:** Vercel (frontend) — chosen for the easy/free path.
- **Backend + DB:** Supabase (Postgres + built-in Auth) — replaces
  plaintext passcode auth with real hashed/SSO auth in the same move.
- **Integrations registry:** a `connectors` table (vendor, auth config,
  field mappings) + OAuth token storage (encrypted) + a scheduled sync
  worker per connector. The admin-facing "Integrations" tab is just a list
  view over this registry with Connect/Disconnect buttons — **all connector
  logic is pre-built, never written ad hoc per Goal.**
- **Scoring engine:** the text-answer LLM scoring call (Claude) must move
  server-side in production (currently client-side in the prototype) to
  protect API keys and add retry/rate-limit handling.

## 6.3 Build sequence

Check what phase the project is actually on before starting work — each
step assumes the previous ones are done, and several steps are cheap
specifically *because* an earlier step already got the data flowing.

1. ✅ Consolidate the PRD spec.
2. ✅ Add **Transformation Goals** as a real data model in the current
   prototype (still `window.storage`), editable `currentValue` by hand for
   every tier — makes the ROI ladder live instead of static. Done: `app/App.jsx`
   now has the full 19-goal ROI grid (real client content from
   `design/active/roi-ladder.html`), a dark-HUD-styled Goals tab
   (`TransformationGoals` component), and hand-editable `currentValue` per
   card. Not yet buildable/testable here — no project scaffold exists until
   phase 5, so this hasn't been run in a browser, only syntax-validated.
3. Build **Nudges** tab; wire Tier 0 goals to real Nudge response data and
   existing Readiness scores (no new infra needed — data already flows
   through the app).
4. Add manual-entry admin forms for Tier 1 goals.
5. **Migrate off `window.storage` to the real backend** (Vercel +
   Supabase) — this is also when real auth replaces plaintext passcodes.
6. Build the **Integrations registry** + first vendor connector (Tier 2) —
   prioritize by which vendor the client actually uses first, not
   speculative build-all.
7. Build **deep system integrations** (Tier 3) — token telemetry,
   compliance logging, cross-system models — last, since it's the highest
   cost and benefits from patterns proven in step 6.

## 6.4 Process going forward

- `docs/PRD-Engineering-Framework.md` is the reference for any new feature
  discussion — check it before proposing new data shapes or visual
  patterns.
- This skill package (`.claude/skills/aim-platform/`) exists so future
  sessions — including a fresh conversation — start from these conventions
  automatically rather than re-deriving them from memory or
  re-improvising.
- Actual implementation (backend, integrations, migrations) belongs in
  **Claude Code**, in this repository, with version control and tests.
  Chat-based artifact iteration (i.e. hand-editing `app/App.jsx` directly in
  an artifact) is the right tool for design exploration, not for production
  engineering.
