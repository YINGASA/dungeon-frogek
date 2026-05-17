# V1.5 Art Resource Pipeline

This document defines the first-floor art resource structure for Lingxu Dungeon. V1.5 does not add a second floor, new theme, new boss, or runtime dependency. It prepares naming, manifest, and fallback rules so future FrameRonin exports can be added safely.

## V1.5.1 Direction

V1.5.1 does not directly integrate temporary hero or weapon sprite sheets. The current priority is to define the first-floor art style, asset source policy, sizing rules, and import order before replacing runtime visuals.

Future official assets should follow:

- `docs/art-style-guide.md`
- `docs/art-import-plan.md`
- The directory and naming rules in this document

Temporary or mismatched art should not replace the current game visuals unless it is explicitly accepted as a stable placeholder. The existing Graphics fallback remains the safe baseline.

## Directory Layout

Place future first-floor runtime art under:

```text
public/assets/game/
  characters/relic_hunter/
  weapons/short_sword/
  weapons/heavy_blade/
  weapons/spear/
  weapons/dual_daggers/
  enemies/crystal_slime/
  enemies/skeleton_guard/
  enemies/shadow_bat/
  enemies/rune_archer/
  enemies/boss/
  tilesets/lingxu_dungeon/
  effects/slash/
  effects/hit/
  effects/shield/
  effects/dash/
  effects/poison/
  ui/icons/
```

Do not place unlicensed or downloaded third-party assets here. Large PNG sprite sheets should only be added when they are final enough to use.

## Naming Rules

Characters:

- `relic_hunter_idle.png`
- `relic_hunter_walk.png`
- `relic_hunter_hurt.png`
- `relic_hunter_death.png`

Weapon attacks:

- `relic_hunter_short_sword_attack.png`
- `relic_hunter_heavy_blade_attack.png`
- `relic_hunter_spear_attack.png`
- `relic_hunter_dual_daggers_attack.png`

Enemies:

- `crystal_slime_idle.png`
- `crystal_slime_move.png`
- `crystal_slime_attack.png`
- `crystal_slime_hurt.png`
- `crystal_slime_death.png`

Maps:

- `lingxu_dungeon_tileset.png`
- `lingxu_dungeon_props.png`
- `lingxu_dungeon_doors.png`

Effects:

- `slash_short_sword.png`
- `slash_heavy_blade.png`
- `thrust_spear.png`
- `slash_dual_daggers.png`
- `hit_spark.png`
- `shield_burst.png`
- `dash_trail.png`

If a sprite sheet has a paired JSON file, keep the same basename, for example `relic_hunter_walk.png` and `relic_hunter_walk.json`.

## Manifest Rules

Register future assets in `src/game/assets/artManifest.ts`.

Each asset entry should define:

- `key`
- `path`
- `type`: `spritesheet` or `image`
- `frameWidth`
- `frameHeight`
- `fallback`

Each animation entry should define:

- `key`
- `assetKey`
- `frames`
- `frameRate`
- `repeat`

The manifest is allowed to describe assets before the PNG files exist. Optional sprite sheets must not be loaded until their asset entry is marked as non-fallback, so missing files do not break the Game page.

## Phaser Fallback Contract

The runtime contract is:

1. If a registered sprite sheet exists and is enabled in the manifest, Phaser can load it and create animations.
2. If a sprite sheet does not exist or remains marked as fallback, the game keeps using current generated SVG/PNG assets and Graphics fallback textures.
3. Gameplay hitboxes, weapon damage, J/K/L timing, enemy AI, and room routing stay controlled by game logic, not animation frames.
4. Animation is visual only. Sprite frames must not drive damage, knockback, cooldown, dash distance, collision, reward timing, or room completion.
5. If a resource is missing, disabled, or fails to load, fallback is expected behavior rather than an error state.

V1.5 intentionally does not replace the current character, enemy, map, or effect rendering. It only provides the manifest and safe hooks for later replacement.

## First-Floor Art Direction

Birth room:

- Safe atmosphere
- Soft source-crystal glow
- Clear operation hint area

Normal battle room:

- Lightly polluted floor
- Sparse cracks and crystal fragments

Advanced battle room:

- Stronger pollution
- Ground fissures
- Higher danger feel

Elite battle room:

- Elite runes
- Stronger pressure
- Visual hint that enemies are empowered

Dust-sealed treasury:

- Chest pedestal
- Dusty stone platform
- Gold or cyan-green resource glow

Event room:

- Random encounter atmosphere
- Expandable traps, altars, poison fog, weapon racks

Dust-sealed merchant:

- Merchant counter
- Trade light source
- Coin and source-crystal item display

Boss room:

- Larger, more oppressive space
- Boss domain boundary
- Clearer skill area warnings

## FrameRonin Workflow

FrameRonin can be used later as an external art preparation tool:

1. Generate or draw character, enemy, weapon, and effect action art.
2. Use FrameRonin to split frames, crop, cut out backgrounds, and compose sprite sheets.
3. Export PNG and optional JSON metadata.
4. Place exported files under the matching `public/assets/game` directory.
5. Register the asset and animation in `src/game/assets/artManifest.ts`.
6. Let Phaser load registered resources; missing or disabled resources continue using fallback.
7. Keep combat judgment in game logic. Animation timing must not silently change attack hitboxes or damage.

Do not install FrameRonin, copy FrameRonin code into this project, or add it as a runtime dependency.
