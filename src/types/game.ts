export type Difficulty = 'easy' | 'normal' | 'hard';
export type RoomType = 'battle' | 'treasure' | 'shop' | 'event' | 'rest' | 'boss';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type PlayerClassId = 'knight' | 'mage' | 'ranger';
export type StatusEffectType = 'burn' | 'freeze' | 'poison' | 'shield';

export interface TileConfig {
  x: number;
  y: number;
  type: 'floor' | 'wall' | 'door' | 'trap' | 'chest' | 'shop' | 'portal' | 'bossFloor';
}

export interface RoomConfig {
  id: string;
  floor: number;
  name: string;
  type: RoomType;
  x: number;
  y: number;
  width: 16;
  height: 10;
  connections: string[];
  enemyIds: string[];
  elite?: boolean;
  tiles: TileConfig[];
  eventId?: string;
  rewardHint?: string;
}

export interface DungeonFloorConfig {
  floorIndex: number;
  name: string;
  theme: string;
  rooms: RoomConfig[];
}

export interface SkillConfig {
  id: string;
  name: string;
  description: string;
  key: 'J' | 'K' | 'L' | 'I';
  cooldown: number;
  damageMultiplier: number;
  range: number;
  radius?: number;
  statusEffect?: StatusEffectType;
  ultimate?: boolean;
}

export interface PlayerClassConfig {
  id: PlayerClassId;
  name: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  critRate: number;
  skills: SkillConfig[];
}

export interface EnemyConfig {
  id: string;
  name: string;
  role: 'melee' | 'ranged' | 'summoner' | 'elite';
  hp: number;
  attack: number;
  defense: number;
  moveSpeed: number;
  attackRange: number;
  attackCooldown: number;
  goldReward: number;
  expReward: number;
  statusEffect?: StatusEffectType;
}

export interface BossConfig extends EnemyConfig {
  chineseName: string;
  phases: {
    threshold: number;
    name: string;
    mechanics: string[];
  }[];
}

export interface EquipmentConfig {
  id: string;
  name: string;
  slot: 'weapon' | 'armor' | 'accessory';
  rarity: Rarity;
  attackBonus: number;
  defenseBonus: number;
  hpBonus: number;
  critRateBonus: number;
  speedBonus: number;
}

export interface RelicConfig {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  effectType:
    | 'killHeal'
    | 'fireBoost'
    | 'eventBonus'
    | 'goldBoostDamageTaken'
    | 'lowHpAttack'
    | 'freezeChance'
    | 'roomShield'
    | 'bossDamage';
  value: number;
}

export interface EventChoiceConfig {
  id: string;
  text: string;
  result: string;
  effects: {
    hp?: number;
    gold?: number;
    attack?: number;
    defense?: number;
    relicId?: string;
    equipmentId?: string;
    spawnEnemyId?: string;
  };
}

export interface EventConfig {
  id: string;
  type: 'mysteriousMerchant' | 'ancientAltar' | 'injuredNpc' | 'corruptedChest' | 'dataRift';
  title: string;
  description: string;
  choices: EventChoiceConfig[];
}

export interface NPCDialogueConfig {
  id: string;
  speaker: string;
  lines: string[];
  triggerRoomType?: RoomType;
}

export interface OperationCopyConfig {
  headline: string;
  pushNotification: string;
  eventBanner: string;
  socialPost: string;
}

export interface LevelConfig {
  id: string;
  name: string;
  theme: string;
  difficulty: Difficulty;
  targetAudience: 'casual' | 'midcore' | 'hardcore';
  durationMinutes: number;
  artStyle: string;
  gameplayFocus: string;
  worldIntro: string;
  floors: DungeonFloorConfig[];
  enemies: EnemyConfig[];
  boss: BossConfig;
  items: { id: string; name: string; description: string; effect: string }[];
  equipment: EquipmentConfig[];
  relics: RelicConfig[];
  events: EventConfig[];
  npcDialogues: NPCDialogueConfig[];
  operationCopy: OperationCopyConfig;
  balanceNotes: string[];
  designNotes: string[];
}

export interface GameRun {
  id: string;
  levelId: string;
  classId: PlayerClassId;
  className: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  victory: boolean;
  kills: number;
  elitesDefeated: number;
  goldEarned: number;
  equipmentFound: number;
  relicsFound: number;
  eventsTriggered: number;
  bossRemainingHpPercent: number;
  deathReason: string;
  score: number;
  routeSummary?: string;
  roomCount?: number;
  eventChoices?: number;
  eliteRooms?: number;
  rewardChoices?: number;
  finalRoomType?: string;
  reachedBoss?: boolean;
}

export interface AssetManifest {
  id: string;
  theme: string;
  artStyle: string;
  generatedAt: string;
  sprites: {
    tileset: string[];
    heroes: string[];
    enemies: string[];
    skills: string[];
    icons: string[];
  };
  prompts: string[];
  notes: string[];
}

export interface AnalysisReport {
  summary: string;
  balanceIssues: string[];
  pacingIssues: string[];
  classBalanceIssues: string[];
  artSuggestions: string[];
  operationSuggestions: string[];
  nextIterationPlan: string[];
}
