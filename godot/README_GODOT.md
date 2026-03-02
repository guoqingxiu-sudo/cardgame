# Godot Migration Starter

This folder is a minimal Godot 4 starter for the card game.

## Open
1. Open Godot 4.x.
2. Import project from `godot/project.godot`.
3. Run.

## Current scope
- Basic project bootstrap
- Autoload singletons:
  - `GameState`
  - `CardDatabase`
- Deck load from `data/cards.json`
- Draw 5 cards on reset
- 3-lane placeholder battlefield with lane buttons
- Card play flow:
  - Instant cards: click to cast
  - Lane cards: click card, then click lane
- Discard flow:
  - select card then click `Discard Selected`
- Basic action queue:
  - attack/control cards travel then resolve
  - lane units chip each tick
- Enemy AI upgraded from random to scored choice (lane-aware)
- AI difficulty switch in top bar (`Easy/Normal/Hard/Nightmare`)
- Lane panel shows queue/units/ETA snapshot for both sides
- Lane panel includes simple projectile track visualization
- Hand cards now show element icons and tooltip details
- Lane buttons now render lightweight unit/projectile glyphs:
  - bottom green shields = your units
  - top red swords = enemy units
  - moving dots/diamonds = queued actions in flight
- Lane hit feedback:
  - lane tint flash on damage
  - floating damage text glyphs
- Auto draw timer + enemy turn loop
- Battle log and lane last-play tracking

## Next steps
1. Replace lane placeholder buttons with actual lane actors/entities.
2. Port battle queue and projectile resolution from JS.
3. Add hand drag-to-lane targeting.
4. Upgrade enemy AI from random policy to scored policy.
5. Move all card data from JS to `cards.json`.
