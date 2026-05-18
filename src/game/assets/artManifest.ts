export type ArtAssetType = 'spritesheet' | 'image';

export interface ArtAssetConfig {
  key: string;
  path: string;
  type: ArtAssetType;
  frameWidth?: number;
  frameHeight?: number;
  fallback: boolean;
}

export interface AnimationConfig {
  key: string;
  assetKey: string;
  frames: number[];
  frameRate: number;
  repeat: number;
}

type LoaderScene = {
  load: {
    image: (key: string, url: string) => unknown;
    spritesheet: (key: string, url: string, config: { frameWidth: number; frameHeight: number }) => unknown;
  };
};

type AnimationScene = {
  textures: { exists: (key: string) => boolean };
  anims: {
    exists: (key: string) => boolean;
    create: (config: { key: string; frames: Array<{ key: string; frame: number }>; frameRate: number; repeat: number }) => unknown;
  };
};

const GAME_ASSET_ROOT = '/assets/game';

export const ART_ASSETS: ArtAssetConfig[] = [
  {
    key: 'art-relic-hunter-idle',
    path: `${GAME_ASSET_ROOT}/characters/relic_hunter/relic_hunter_idle.png`,
    type: 'spritesheet',
    frameWidth: 48,
    frameHeight: 48,
    fallback: true
  },
  {
    key: 'art-relic-hunter-walk',
    path: `${GAME_ASSET_ROOT}/characters/relic_hunter/relic_hunter_walk.png`,
    type: 'spritesheet',
    frameWidth: 48,
    frameHeight: 48,
    fallback: true
  },
  {
    key: 'art-relic-hunter-hurt',
    path: `${GAME_ASSET_ROOT}/characters/relic_hunter/relic_hunter_hurt.png`,
    type: 'spritesheet',
    frameWidth: 48,
    frameHeight: 48,
    fallback: true
  },
  {
    key: 'art-relic-hunter-death',
    path: `${GAME_ASSET_ROOT}/characters/relic_hunter/relic_hunter_death.png`,
    type: 'spritesheet',
    frameWidth: 48,
    frameHeight: 48,
    fallback: true
  },
  {
    key: 'art-short-sword-attack',
    path: `${GAME_ASSET_ROOT}/weapons/short_sword/relic_hunter_short_sword_attack.png`,
    type: 'spritesheet',
    frameWidth: 72,
    frameHeight: 72,
    fallback: true
  },
  {
    key: 'art-heavy-blade-attack',
    path: `${GAME_ASSET_ROOT}/weapons/heavy_blade/relic_hunter_heavy_blade_attack.png`,
    type: 'spritesheet',
    frameWidth: 96,
    frameHeight: 96,
    fallback: true
  },
  {
    key: 'art-spear-attack',
    path: `${GAME_ASSET_ROOT}/weapons/spear/relic_hunter_spear_attack.png`,
    type: 'spritesheet',
    frameWidth: 96,
    frameHeight: 72,
    fallback: true
  },
  {
    key: 'art-dual-daggers-attack',
    path: `${GAME_ASSET_ROOT}/weapons/dual_daggers/relic_hunter_dual_daggers_attack.png`,
    type: 'spritesheet',
    frameWidth: 72,
    frameHeight: 72,
    fallback: true
  },
  {
    key: 'art-crystal-slime-idle',
    path: `${GAME_ASSET_ROOT}/enemies/crystal_slime/crystal_slime_idle.png`,
    type: 'spritesheet',
    frameWidth: 48,
    frameHeight: 48,
    fallback: true
  },
  {
    key: 'art-skeleton-guard-idle',
    path: `${GAME_ASSET_ROOT}/enemies/skeleton_guard/skeleton_guard_idle.png`,
    type: 'spritesheet',
    frameWidth: 48,
    frameHeight: 56,
    fallback: true
  },
  {
    key: 'art-shadow-bat-idle',
    path: `${GAME_ASSET_ROOT}/enemies/shadow_bat/shadow_bat_idle.png`,
    type: 'spritesheet',
    frameWidth: 48,
    frameHeight: 40,
    fallback: true
  },
  {
    key: 'art-rune-archer-idle',
    path: `${GAME_ASSET_ROOT}/enemies/rune_archer/rune_archer_idle.png`,
    type: 'spritesheet',
    frameWidth: 48,
    frameHeight: 56,
    fallback: true
  },
  {
    key: 'art-crystal-guardian-idle',
    path: `${GAME_ASSET_ROOT}/enemies/boss/crystal_guardian_idle.png`,
    type: 'spritesheet',
    frameWidth: 128,
    frameHeight: 144,
    fallback: true
  },
  {
    key: 'art-lingxu-dungeon-tileset',
    path: `${GAME_ASSET_ROOT}/tilesets/lingxu_dungeon/lingxu_dungeon_tileset.png`,
    type: 'image',
    fallback: true
  },
  {
    key: 'art-lingxu-dungeon-props',
    path: `${GAME_ASSET_ROOT}/tilesets/lingxu_dungeon/lingxu_dungeon_props.png`,
    type: 'image',
    fallback: true
  },
  {
    key: 'art-lingxu-dungeon-doors',
    path: `${GAME_ASSET_ROOT}/tilesets/lingxu_dungeon/lingxu_dungeon_doors.png`,
    type: 'image',
    fallback: true
  },
  {
    key: 'art-slash-short-sword',
    path: `${GAME_ASSET_ROOT}/effects/slash/slash_short_sword.png`,
    type: 'spritesheet',
    frameWidth: 96,
    frameHeight: 96,
    fallback: true
  },
  {
    key: 'art-slash-heavy-blade',
    path: `${GAME_ASSET_ROOT}/effects/slash/slash_heavy_blade.png`,
    type: 'spritesheet',
    frameWidth: 128,
    frameHeight: 128,
    fallback: true
  },
  {
    key: 'art-thrust-spear',
    path: `${GAME_ASSET_ROOT}/effects/slash/thrust_spear.png`,
    type: 'spritesheet',
    frameWidth: 128,
    frameHeight: 96,
    fallback: true
  },
  {
    key: 'art-slash-dual-daggers',
    path: `${GAME_ASSET_ROOT}/effects/slash/slash_dual_daggers.png`,
    type: 'spritesheet',
    frameWidth: 96,
    frameHeight: 96,
    fallback: true
  },
  {
    key: 'art-hit-spark',
    path: `${GAME_ASSET_ROOT}/effects/hit/hit_spark.png`,
    type: 'spritesheet',
    frameWidth: 64,
    frameHeight: 64,
    fallback: true
  },
  {
    key: 'art-shield-burst',
    path: `${GAME_ASSET_ROOT}/effects/shield/shield_burst.png`,
    type: 'spritesheet',
    frameWidth: 96,
    frameHeight: 96,
    fallback: true
  },
  {
    key: 'art-dash-trail',
    path: `${GAME_ASSET_ROOT}/effects/dash/dash_trail.png`,
    type: 'spritesheet',
    frameWidth: 96,
    frameHeight: 64,
    fallback: true
  }
];

export const ANIMATION_CONFIGS: AnimationConfig[] = [
  { key: 'anim-relic-hunter-idle', assetKey: 'art-relic-hunter-idle', frames: [0, 1, 2, 3], frameRate: 6, repeat: -1 },
  { key: 'anim-relic-hunter-walk', assetKey: 'art-relic-hunter-walk', frames: [0, 1, 2, 3, 4, 5], frameRate: 10, repeat: -1 },
  { key: 'anim-relic-hunter-hurt', assetKey: 'art-relic-hunter-hurt', frames: [0, 1, 2], frameRate: 12, repeat: 0 },
  { key: 'anim-relic-hunter-death', assetKey: 'art-relic-hunter-death', frames: [0, 1, 2, 3, 4], frameRate: 8, repeat: 0 },
  { key: 'anim-short-sword-attack', assetKey: 'art-short-sword-attack', frames: [0, 1, 2, 3], frameRate: 16, repeat: 0 },
  { key: 'anim-heavy-blade-attack', assetKey: 'art-heavy-blade-attack', frames: [0, 1, 2, 3, 4], frameRate: 12, repeat: 0 },
  { key: 'anim-spear-attack', assetKey: 'art-spear-attack', frames: [0, 1, 2, 3], frameRate: 15, repeat: 0 },
  { key: 'anim-dual-daggers-attack', assetKey: 'art-dual-daggers-attack', frames: [0, 1, 2, 3, 4, 5], frameRate: 18, repeat: 0 },
  { key: 'anim-crystal-slime-idle', assetKey: 'art-crystal-slime-idle', frames: [0, 1, 2, 3], frameRate: 6, repeat: -1 },
  { key: 'anim-skeleton-guard-idle', assetKey: 'art-skeleton-guard-idle', frames: [0, 1, 2, 3], frameRate: 6, repeat: -1 },
  { key: 'anim-shadow-bat-idle', assetKey: 'art-shadow-bat-idle', frames: [0, 1, 2, 3], frameRate: 8, repeat: -1 },
  { key: 'anim-rune-archer-idle', assetKey: 'art-rune-archer-idle', frames: [0, 1, 2, 3], frameRate: 6, repeat: -1 },
  { key: 'anim-crystal-guardian-idle', assetKey: 'art-crystal-guardian-idle', frames: [0, 1, 2, 3], frameRate: 5, repeat: -1 },
  { key: 'anim-hit-spark', assetKey: 'art-hit-spark', frames: [0, 1, 2, 3], frameRate: 18, repeat: 0 },
  { key: 'anim-shield-burst', assetKey: 'art-shield-burst', frames: [0, 1, 2, 3, 4], frameRate: 16, repeat: 0 },
  { key: 'anim-dash-trail', assetKey: 'art-dash-trail', frames: [0, 1, 2, 3], frameRate: 14, repeat: 0 }
];

export const hasArtAsset = (scene: { textures: { exists: (key: string) => boolean } }, key: string) => scene.textures.exists(key);

export const getHeroAnimationKey = (heroId: string, _weaponId: string, action: 'idle' | 'walk' | 'hurt' | 'death') => {
  if (heroId !== 'relic-hunter') return undefined;
  return `anim-relic-hunter-${action}`;
};

export const getWeaponAttackEffectKey = (weaponId: string) => {
  const keyByWeapon: Record<string, string> = {
    'short-sword': 'anim-short-sword-attack',
    'heavy-blade': 'anim-heavy-blade-attack',
    spear: 'anim-spear-attack',
    'dual-daggers': 'anim-dual-daggers-attack'
  };
  return keyByWeapon[weaponId];
};

export const registerConfiguredArtAssets = (scene: LoaderScene) => {
  ART_ASSETS.forEach((asset) => {
    if (asset.fallback) return;
    if (asset.type === 'image') {
      scene.load.image(asset.key, asset.path);
      return;
    }
    if (!asset.frameWidth || !asset.frameHeight) return;
    scene.load.spritesheet(asset.key, asset.path, { frameWidth: asset.frameWidth, frameHeight: asset.frameHeight });
  });
};

export const registerFallbackAnimations = (scene: AnimationScene) => {
  ANIMATION_CONFIGS.forEach((animation) => {
    if (scene.anims.exists(animation.key) || !scene.textures.exists(animation.assetKey)) return;
    scene.anims.create({
      key: animation.key,
      frames: animation.frames.map((frame) => ({ key: animation.assetKey, frame })),
      frameRate: animation.frameRate,
      repeat: animation.repeat
    });
  });
};
