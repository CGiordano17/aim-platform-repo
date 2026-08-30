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

## Explicitly rejected directions

For future reference — don't re-propose these:
- A plain "broadsheet hairline" neutral admin-dashboard look (the original
  default this whole redesign moved away from).
- A literal 3D rotating globe as the hero visualization (replaced by the
  Rogers curve — more legible, more on-topic).

## Prior exploration, for context

`design/archive/` holds the mockups that led to the current direction
(JARVIS/HUD refinement, typography pairings, earlier pyramid attempts). They
are superseded where they conflict with this file or the PRD — see
`references/open-decisions-and-artifacts.md` for the full artifact list and
what each one explored.
