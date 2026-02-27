# Shadow Rules

## 1. Shadow Intent
- Shadows are used to express hierarchy and interaction state.
- Avoid heavy, blurry shadows that muddy battlefield readability.

## 2. Token Set
- `shadow_inset_soft`: `inset 0 5px 14px rgba(0,0,0,0.28)`
- `shadow_panel`: `0 4px 12px rgba(0,0,0,0.22)`
- `shadow_panel_strong`: `0 6px 14px rgba(0,0,0,0.28)`
- `shadow_card`: `0 10px 20px rgba(0,0,0,0.36)`
- `shadow_focus`: `0 0 12px rgba(249, 207, 136, 0.24)`

## 3. Application Rules
- Panels:
  - use `shadow_panel` by default
  - use `shadow_panel_strong` only for floating overlays (HUD, pop panels)
- Cards:
  - default `shadow_card`
  - hover/armed: keep same blur class, increase z-index first, then slight translateY
- Lanes:
  - prefer inset depth (`shadow_inset_soft`) over large drop shadows
  - recommended lane may add one `shadow_focus` glow

## 4. Interaction States
- `default`: subtle shadow only
- `hover`: max +15% shadow intensity, short transition (120-160ms)
- `active/selected`: +1 tier shadow OR border glow, not both at maximum
- `disabled`: reduce shadow intensity and saturation

## 5. Performance Constraints
- Avoid stacking >3 simultaneous shadow layers on frequently animated elements.
- For mobile, reduce large blur shadows by ~20-30%.

## 6. Consistency Rules
- Do not define one-off component shadows if existing token is semantically close.
- When new token needed, document intent + usage scope before introducing it.
