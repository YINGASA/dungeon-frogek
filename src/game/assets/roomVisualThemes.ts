export type RoomVisualThemeKey = 'start' | 'battle' | 'advanced' | 'elite' | 'treasure' | 'event' | 'merchant' | 'boss' | 'default';

export interface RoomVisualTheme {
  roomType: RoomVisualThemeKey;
  floorColor: number;
  floorLineColor: number;
  wallColor: number;
  wallInnerColor: number;
  accentColor: number;
  glowColor: number;
  crackColor: number;
  runeColor: number;
  propDensity: number;
  crystalDensity: number;
  dangerLevel: number;
  decorationStyle: 'clean' | 'battle' | 'danger' | 'rune' | 'treasure' | 'event' | 'merchant' | 'boss';
}

const DEFAULT_ROOM_THEME: RoomVisualTheme = {
  roomType: 'default',
  floorColor: 0x101a2b,
  floorLineColor: 0x1f3149,
  wallColor: 0x26364f,
  wallInnerColor: 0x2d6f78,
  accentColor: 0x35e7c4,
  glowColor: 0x8ffcff,
  crackColor: 0x29364b,
  runeColor: 0x5fd8ff,
  propDensity: 0.45,
  crystalDensity: 0.45,
  dangerLevel: 0.25,
  decorationStyle: 'battle'
};

export const ROOM_VISUAL_THEMES: Record<RoomVisualThemeKey, RoomVisualTheme> = {
  default: DEFAULT_ROOM_THEME,
  start: {
    ...DEFAULT_ROOM_THEME,
    roomType: 'start',
    floorColor: 0x111f30,
    floorLineColor: 0x253a54,
    wallColor: 0x283a53,
    wallInnerColor: 0x3a8a88,
    accentColor: 0x8ffcff,
    glowColor: 0xbaffff,
    crackColor: 0x2c4159,
    runeColor: 0x9fffee,
    propDensity: 0.24,
    crystalDensity: 0.35,
    dangerLevel: 0.08,
    decorationStyle: 'clean'
  },
  battle: {
    ...DEFAULT_ROOM_THEME,
    roomType: 'battle',
    floorColor: 0x10192a,
    floorLineColor: 0x203149,
    wallColor: 0x26364e,
    wallInnerColor: 0x2d6474,
    accentColor: 0x35e7c4,
    glowColor: 0x8ffcff,
    crackColor: 0x354055,
    runeColor: 0x5fd8ff,
    propDensity: 0.46,
    crystalDensity: 0.42,
    dangerLevel: 0.28,
    decorationStyle: 'battle'
  },
  advanced: {
    ...DEFAULT_ROOM_THEME,
    roomType: 'advanced',
    floorColor: 0x111623,
    floorLineColor: 0x2a3349,
    wallColor: 0x2b344e,
    wallInnerColor: 0x375f7a,
    accentColor: 0x7fdfff,
    glowColor: 0x82e6ff,
    crackColor: 0x4a3158,
    runeColor: 0x8fb8ff,
    propDensity: 0.58,
    crystalDensity: 0.52,
    dangerLevel: 0.46,
    decorationStyle: 'danger'
  },
  elite: {
    ...DEFAULT_ROOM_THEME,
    roomType: 'elite',
    floorColor: 0x120f1d,
    floorLineColor: 0x332746,
    wallColor: 0x2f2a48,
    wallInnerColor: 0x7d5b93,
    accentColor: 0xffc85a,
    glowColor: 0xffe6ad,
    crackColor: 0x5c335f,
    runeColor: 0xffcf75,
    propDensity: 0.7,
    crystalDensity: 0.46,
    dangerLevel: 0.68,
    decorationStyle: 'rune'
  },
  treasure: {
    ...DEFAULT_ROOM_THEME,
    roomType: 'treasure',
    floorColor: 0x171a24,
    floorLineColor: 0x3a3844,
    wallColor: 0x342f43,
    wallInnerColor: 0x95714a,
    accentColor: 0xffc85a,
    glowColor: 0xffe6ad,
    crackColor: 0x4b4150,
    runeColor: 0x8ffcff,
    propDensity: 0.56,
    crystalDensity: 0.38,
    dangerLevel: 0.14,
    decorationStyle: 'treasure'
  },
  event: {
    ...DEFAULT_ROOM_THEME,
    roomType: 'event',
    floorColor: 0x111326,
    floorLineColor: 0x2d2c48,
    wallColor: 0x272b48,
    wallInnerColor: 0x6f4f99,
    accentColor: 0xb87cff,
    glowColor: 0xd6b4ff,
    crackColor: 0x513265,
    runeColor: 0xc995ff,
    propDensity: 0.62,
    crystalDensity: 0.32,
    dangerLevel: 0.36,
    decorationStyle: 'event'
  },
  merchant: {
    ...DEFAULT_ROOM_THEME,
    roomType: 'merchant',
    floorColor: 0x151b25,
    floorLineColor: 0x33394a,
    wallColor: 0x293448,
    wallInnerColor: 0x8a7142,
    accentColor: 0xffd47d,
    glowColor: 0xffe6ad,
    crackColor: 0x3d4656,
    runeColor: 0x8ffcff,
    propDensity: 0.54,
    crystalDensity: 0.3,
    dangerLevel: 0.12,
    decorationStyle: 'merchant'
  },
  boss: {
    ...DEFAULT_ROOM_THEME,
    roomType: 'boss',
    floorColor: 0x12091d,
    floorLineColor: 0x33172f,
    wallColor: 0x34172d,
    wallInnerColor: 0x8b3157,
    accentColor: 0xff4f9b,
    glowColor: 0xff9ac2,
    crackColor: 0x6b254f,
    runeColor: 0xff78ab,
    propDensity: 0.78,
    crystalDensity: 0.6,
    dangerLevel: 0.86,
    decorationStyle: 'boss'
  }
};

export const getRoomVisualTheme = (roomType: string): RoomVisualTheme => (
  ROOM_VISUAL_THEMES[roomType as RoomVisualThemeKey] ?? ROOM_VISUAL_THEMES.default
);
