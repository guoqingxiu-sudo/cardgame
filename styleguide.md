# Cardgame Visual Style Guide

## 1. Style Direction
- Theme: dark-guofeng tactical battlefield.
- Tone: grounded, warm, strategic, slightly ceremonial.
- Readability first: all decorative effects must not reduce combat clarity.
- Layer priority: gameplay information > interaction state > decoration.

## 2. Core Principles
- `Clarity over decoration`: HP, lane ownership, card availability, cast cooldown must remain instantly recognizable.
- `Functional contrast`: interactive elements must have stronger contrast than ambient background.
- `Stable semantics`: red/orange = pressure/danger, green = advantage, blue = control/cold.
- `Dense but scannable`: compact layout is acceptable only when spacing and hierarchy stay clear.

## 3. Typography
- Primary font stack: `"KaiTi", "STKaiti", "Noto Serif SC", "Songti SC", serif`.
- UI min size: 10px for chips, 11-12px for secondary info, 13-16px for core labels.
- Never use pure white for body text; use warm near-white values from palette.

## 4. Surfaces
- Backgrounds should be layered:
  - base dark gradient
  - subtle radial accents
  - panel overlays with low alpha warm highlights
- Panel style:
  - rounded corners 10-14px
  - 1px warm border
  - soft internal highlight + restrained outer shadow

## 5. Color Usage
- Follow `palette.json` tokens only.
- Do not introduce ad-hoc hex colors unless token expansion is approved.
- Danger/advantage/warn status colors must map to semantic tokens.

## 6. Component Behavior
- Card:
  - overlapping hand is allowed
  - hover lifts card slightly
  - armed/selected card has stronger elevation and border emphasis
- Lane:
  - vertical push direction is mandatory (enemy top, player bottom)
  - lane tags should be icon-first and compact
- HUD:
  - enemy HP at top center, player HP at bottom center
  - avoid large persistent sidebars in default state

## 7. Motion
- Use short transitions (120-200ms) for hover/select/toggle.
- Avoid continuous heavy animations; ambient motion should be low-opacity and slow.
- Combat-critical feedback (damage/hit/cast) should be immediate and short.

## 8. Spacing & Radius
- Spacing scale: `4, 6, 8, 10, 12, 16, 20`.
- Border radius scale: `6, 8, 10, 12, 16`.
- Keep consistent rhythm between panels and combat modules.

## 9. Accessibility
- Ensure text/background contrast stays readable in low-brightness scenes.
- Color must not be the only signal; combine icon/text/state class.
- Maintain visible focus and active states for all actionable controls.

## 10. Implementation Rules
- New visual modules must consume palette + shadow tokens.
- Reuse existing component classes where possible.
- New style variants should extend tokens, not hardcode one-off values.
