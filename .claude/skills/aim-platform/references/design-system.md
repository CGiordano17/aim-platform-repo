# Design System

Mirrors PRD §5. Full text: `docs/PRD-Engineering-Framework.md`.

Dark HUD aesthetic. Follow these tokens and patterns for any new UI rather
than inventing new visual conventions — this direction was arrived at after
explicit exploration of alternatives (see "Explicitly rejected directions"
below), so don't re-propose the discarded options.

## Typography

- Display/hero headers: **Michroma** (sparingly — main title only)
- UI headers, nav, body: **Rajdhani** (500/600/700 weights)
- All data values, technical labels, codes: **JetBrains Mono**

## Color tokens

```
--bg: #030507 / #07090B      background canvas
--cyan: #5EE6FF              primary accent, "action" phrase, Tier 2
--amber: #F0A94E             secondary accent, "resources" phrase, Tier 0
--green: #7FE0A0             "outcome" phrase only
--violet: #C79EF0            Quality category, Tier 3
--rose: #F08FB0              Capability category
--sub: #6E8790               muted text / labels
```

Category color (shown on column headers) and tier color (shown on card
left-border) are **deliberately different hues** so the two axes never
visually collide — don't reuse a category color as a tier color or vice
versa.

## Signature component patterns

- Corner-bracket panel framing (four short L-shaped strokes, not a solid
  border) instead of flat cards.
- Chamfered/clip-path corners on buttons and chips — never fully rounded
  rects.
- Window-chrome title bars (label + minimize/maximize/close glyphs) on
  major panels.
- Radial gauges and the animated Rogers curve (real curve math, not
  decorative) as the signature data visualizations.
- ALL CAPS + wide letter-spacing reserved for small monospace
  eyebrows/labels only — body and goal-statement text stays in sentence
  case for readability.
- Intentional asymmetry over centered/uniform layouts — e.g. the login
  page's offset split-screen, the Dashboard's featured-stat row (one wide
  card, not four equal ones). Don't default to a centered box or an
  evenly-spaced grid as the first instinct for a new layout.
- A single deliberate transition timing (`ease-hud` in Tailwind config,
  `cubic-bezier(0.16, 1, 0.3, 1)`) applied globally to buttons/links/inputs
  via `globals.css` — new interactive elements inherit this automatically;
  don't add a different one-off easing per component.

## Three.js / WebGL layer (added 2026-10-16)

Four real, data-driven (never purely decorative except the ambient
backdrop) WebGL visualizations, all under `src/components/three/` (shared
infra) plus one per feature area:

- `AdoptionCurve3D` (Dashboard) — the Rogers curve as a real 3D ribbon
  with a particle per respondent, same curve math as the 2D
  `AdoptionCurve` (imported, not re-derived).
- `RoiLadder3D` (Transformation Goals) — the 4×4 ROI Measurability Ladder
  as a navigable 3D structure; toggles with the flat card list.
- `PipelineFlow3D` (Workflows) — the Identified→Augmented→Piloting→Standard
  pipeline as four pipe segments with a node per workflow, shown above the
  real Kanban board.
- `AppShellBackdrop` — the one purely decorative piece, a faint drifting
  starfield behind the whole protected shell plus the login page.

**Non-negotiable pattern for every one of these:** falls back to a real
working 2D/CSS equivalent — never a blank panel — when WebGL is
unavailable (`useWebGLAvailable()`, `src/components/three/environment.ts`)
or respects `prefers-reduced-motion` (`usePrefersReducedMotion()`) by
freezing camera auto-rotate. This matters concretely here: enterprise
devices routinely disable WebGL via group policy, which is exactly the
kind of locked-down environment this client's own workforce uses.

**Two real bugs found and fixed building this, worth knowing before adding
a fifth scene:**
1. `html`/`body` CSS: a fixed, `z-index:-1` decorative layer (like
   `AppShellBackdrop`) needs its background on `html`, not `body` — in the
   CSS painting order, `body`'s own background paints *above* any
   negative-z-index descendant of `body`, silently hiding it. See
   `globals.css`'s comment.
2. `@react-three/drei`'s `Html` component doesn't unmount cleanly when the
   whole Canvas tree is torn down by React 19 (confirmed: real
   `removeChild` DOM errors, not just a dev-mode warning). Toggled 3D
   views (like `RoiLadder3D`'s list/3D switch) must stay mounted and use
   CSS `display: none` to hide, never conditional unmount — see
   `TransformationGoalsBoard.tsx`'s comment.

## Explicitly rejected directions

For future reference — don't re-propose these:
- A plain "broadsheet hairline" neutral admin-dashboard look (the original
  default this whole redesign moved away from).
- A literal 3D rotating globe as a *decorative replacement* for the Rogers
  curve (rejected pre-launch for being less legible/on-topic than the 2D
  curve). This is different from `AdoptionCurve3D` above, which renders
  the *same* curve math in WebGL rather than replacing it with an
  unrelated decorative shape — the 2026-10-16 three.js pass didn't reverse
  this decision, it answered a later, more specific request.

## Prior exploration, for context

`design/archive/` holds the mockups that led to the current direction
(JARVIS/HUD refinement, typography pairings, earlier pyramid attempts). They
are superseded where they conflict with this file or the PRD — see
`references/open-decisions-and-artifacts.md` for the full artifact list and
what each one explored.
