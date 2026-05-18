export type EnemyVisualThemeKey = 'slime' | 'skeleton' | 'bat' | 'archer' | 'boss' | 'fallback';

export interface EnemyVisualTheme {
  enemyType: EnemyVisualThemeKey;
  bodyColor: number;
  outlineColor: number;
  glowColor: number;
  attackWarnColor: number;
  hitFlashColor: number;
  deathParticleColor: number;
  eliteAuraColor: number;
  bodyShape: 'gel' | 'guard' | 'winged' | 'rune' | 'boss' | 'fallback';
  accentShape: 'crystal' | 'blade' | 'shadow' | 'rune' | 'core' | 'none';
  scale: number;
  dangerStyle: 'low' | 'melee' | 'fast' | 'ranged' | 'boss' | 'fallback';
}

const FALLBACK_ENEMY_THEME: EnemyVisualTheme = {
  enemyType: 'fallback',
  bodyColor: 0x526078,
  outlineColor: 0xd8ffff,
  glowColor: 0x8ffcff,
  attackWarnColor: 0xffd47d,
  hitFlashColor: 0xffffff,
  deathParticleColor: 0xbfd7ff,
  eliteAuraColor: 0xffc24d,
  bodyShape: 'fallback',
  accentShape: 'none',
  scale: 1,
  dangerStyle: 'fallback'
};

export const ENEMY_VISUAL_THEMES: Record<EnemyVisualThemeKey, EnemyVisualTheme> = {
  fallback: FALLBACK_ENEMY_THEME,
  slime: {
    enemyType: 'slime',
    bodyColor: 0x44d8b7,
    outlineColor: 0xbffff1,
    glowColor: 0x7fffee,
    attackWarnColor: 0xcaffff,
    hitFlashColor: 0xeaffff,
    deathParticleColor: 0x37e8d4,
    eliteAuraColor: 0xffd47d,
    bodyShape: 'gel',
    accentShape: 'crystal',
    scale: 1,
    dangerStyle: 'low'
  },
  skeleton: {
    enemyType: 'skeleton',
    bodyColor: 0xd8d3c4,
    outlineColor: 0x5e6d86,
    glowColor: 0xdde8ff,
    attackWarnColor: 0xffe0ad,
    hitFlashColor: 0xfff4df,
    deathParticleColor: 0xdedbd2,
    eliteAuraColor: 0xff6b8a,
    bodyShape: 'guard',
    accentShape: 'blade',
    scale: 1,
    dangerStyle: 'melee'
  },
  bat: {
    enemyType: 'bat',
    bodyColor: 0x2c1b46,
    outlineColor: 0xb18cff,
    glowColor: 0x7b4dff,
    attackWarnColor: 0xd68cff,
    hitFlashColor: 0xf0d2ff,
    deathParticleColor: 0x6a2a8d,
    eliteAuraColor: 0xff5fd2,
    bodyShape: 'winged',
    accentShape: 'shadow',
    scale: 1,
    dangerStyle: 'fast'
  },
  archer: {
    enemyType: 'archer',
    bodyColor: 0x3348b8,
    outlineColor: 0xb8c5ff,
    glowColor: 0x8ffcff,
    attackWarnColor: 0x8ffcff,
    hitFlashColor: 0xded8ff,
    deathParticleColor: 0x8c63ff,
    eliteAuraColor: 0xffd47d,
    bodyShape: 'rune',
    accentShape: 'rune',
    scale: 1,
    dangerStyle: 'ranged'
  },
  boss: {
    enemyType: 'boss',
    bodyColor: 0xff4f9b,
    outlineColor: 0x9ffff0,
    glowColor: 0xff9ac2,
    attackWarnColor: 0xff78ab,
    hitFlashColor: 0xf1fbff,
    deathParticleColor: 0xff6db8,
    eliteAuraColor: 0xff4f9b,
    bodyShape: 'boss',
    accentShape: 'core',
    scale: 1,
    dangerStyle: 'boss'
  }
};

export const getEnemyVisualTheme = (enemyType: string): EnemyVisualTheme => (
  ENEMY_VISUAL_THEMES[enemyType as EnemyVisualThemeKey] ?? ENEMY_VISUAL_THEMES.fallback
);
