import Phaser from 'phaser';
import { GameRun, LevelConfig, PlayerClassConfig } from '../../types/game';
import { storageService } from '../../services/storageService';

type EnemyKind = 'slime' | 'skeleton' | 'bat' | 'archer' | 'boss';
type RoomKind = 'start' | 'battle' | 'treasure' | 'event' | 'elite' | 'rest' | 'boss';
type GameFlowState = 'title' | 'weapon' | 'playing' | 'paused' | 'reward' | 'event' | 'status' | 'ended';
type PlayerActionState = 'normal' | 'attacking' | 'dashing' | 'dead';
type RewardRarity = 'common' | 'rare' | 'epic';
type RewardType = '攻击' | '生存' | '回复' | '技能';
type RewardTrigger = 'battle' | 'treasure' | 'elite';
type EnemySpawnDef = EnemyKind | { kind: EnemyKind; elite?: boolean };
type CombatWave = EnemySpawnDef[];
type WeaponId = 'short-sword' | 'heavy-blade' | 'spear' | 'dual-daggers';
type HeroId = 'relic-hunter';

interface HeroConfig {
  id: HeroId;
  name: string;
  description: string;
  defaultWeaponId: WeaponId;
  allowedWeaponIds: WeaponId[];
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    speed: number;
  };
  passiveText: string;
}

interface WeaponConfig {
  id: WeaponId;
  name: string;
  role: string;
  description: string;
  pros: string;
  cons: string;
  attackDamageMultiplier: number;
  attackRange: number;
  attackWidth: number;
  attackCooldown: number;
  knockbackPower: number;
  dashDamageMultiplier: number;
  dashDistanceMultiplier: number;
  dashCooldownMultiplier: number;
  dashHitRadius: number;
  moveSpeedMultiplier: number;
  attackColor: number;
  attackAlpha: number;
  attackVisual: string;
  dashVisual: string;
  specialText: string;
  styleSummary: string;
}
type SoundName =
  | 'swing'
  | 'hit'
  | 'hurt'
  | 'enemyDie'
  | 'pickup'
  | 'chest'
  | 'portal'
  | 'bossEnter'
  | 'bossPhase'
  | 'victory'
  | 'defeat';

type Fighter = Phaser.Physics.Arcade.Sprite & {
  stats: {
    id: string;
    name: string;
    kind: EnemyKind | 'player';
    hp: number;
    maxHp: number;
    atk: number;
    def: number;
    speed: number;
    range: number;
    cooldown: number;
    nextAttack: number;
    ranged?: boolean;
    boss?: boolean;
  };
};

interface UnitHud {
  name: Phaser.GameObjects.Text;
  hpBg: Phaser.GameObjects.Rectangle;
  hpFill: Phaser.GameObjects.Rectangle;
}

interface RoomDef {
  id: string;
  roomIndex: number;
  name: string;
  kind: RoomKind;
  description: string;
  enemies: EnemyKind[];
  reward?: 'chest' | 'potion';
  nextOptions: number[];
  isCleared: boolean;
  rewardClaimed: boolean;
  eventResolved: boolean;
  selectedBranch?: number;
}

type RoomTemplate = Omit<RoomDef, 'id' | 'roomIndex' | 'nextOptions' | 'isCleared' | 'rewardClaimed' | 'eventResolved' | 'selectedBranch'>;

interface RewardOption {
  id: string;
  name: string;
  rarity: RewardRarity;
  type: RewardType;
  description: string;
  effectText: string;
  stackable?: boolean;
  apply: (scene: DungeonScene) => void;
}

interface PlayerRelicState {
  moveSpeedMultiplier: number;
  dashDamageMultiplier: number;
  dashDistanceMultiplier: number;
  bonusDamage: number;
  potionHealBonus: number;
  cooldownReduction: number;
  relics: RewardOption[];
  temporaryShield: number;
  damageReductionFromMinions: number;
  bossRoomHealUsed: boolean;
  dashCooldownRefunded: boolean;
}

interface DungeonEventOption {
  text: string;
  disabledText?: string;
  canChoose: (scene: DungeonScene) => boolean;
  apply: (scene: DungeonScene) => string;
}

interface DungeonEventDef {
  title: string;
  description: string;
  options: DungeonEventOption[];
}

type EventCategory = 'benefit' | 'penalty' | 'combat' | 'mixed' | 'supply' | 'curse';
type EventEffectType =
  | 'spike'
  | 'collapse'
  | 'poison'
  | 'rust'
  | 'attack'
  | 'defense'
  | 'gold'
  | 'heal'
  | 'potion-box'
  | 'cleanse'
  | 'ambush'
  | 'elite-patrol'
  | 'unstable-crystal';

interface EventPackDef {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  rarity: RewardRarity;
  weight: number;
  effectType: EventEffectType;
  effectText: string;
  followUpObjective: string;
  roomTags: RoomKind[];
  minRoomIndex?: number;
  maxRoomIndex?: number;
  oncePerRun?: boolean;
  applyEffect: (scene: DungeonScene) => EventResult;
}

interface EventResult {
  log: string;
  floatingText?: string;
  opensPortal?: boolean;
  enemies?: EnemyKind[];
  goldReward?: number;
  rareRewardChance?: number;
}

interface EventRunStats {
  triggered: number;
  negative: number;
  combat: number;
  poisoned: boolean;
  cursed: boolean;
}

const ROOM_TEMPLATES: Record<RoomKind, RoomTemplate[]> = {
  start: [
    { name: '出生房', kind: 'start', description: '灵墟入口，空气里漂浮着发光的晶尘。', enemies: [] }
  ],
  battle: [
    { name: '普通战斗房', kind: 'battle', description: '晶化史莱姆与骷髅守卫堵住了通道。', enemies: ['slime', 'skeleton'] },
    { name: '回廊战斗房', kind: 'battle', description: '晶尘回廊里传来黏液与骨甲摩擦的声音。', enemies: ['slime', 'slime', 'skeleton'] },
    { name: '裂隙战斗房', kind: 'battle', description: '暗影蝙蝠从裂隙里俯冲而下。', enemies: ['slime', 'bat'] }
  ],
  treasure: [
    { name: '封尘宝库', kind: 'treasure', description: '一座封尘石台上摆着仍在发亮的古旧宝箱。', enemies: [], reward: 'chest' },
    { name: '封尘宝库', kind: 'treasure', description: '尘封宝库里残留着源晶光芒，古旧宝箱静静等待开启。', enemies: [], reward: 'chest' }
  ],
  event: [
    { name: '随机事件房', kind: 'event', description: '这里的源晶回声让时间变得迟缓。', enemies: [] }
  ],
  elite: [
    { name: '高级战斗房', kind: 'elite', description: '暗影蝙蝠盘旋，符文射手正在蓄能。', enemies: ['bat', 'archer', 'skeleton'] },
    { name: '精英战斗房', kind: 'elite', description: '精英守卫封锁了路口，空气里压着危险的源晶波动。', enemies: ['skeleton', 'archer', 'bat'] }
  ],
  rest: [
    { name: '补给房', kind: 'rest', description: '石台上的药剂散发着温热光芒。', enemies: [] }
  ],
  boss: [
    { name: '首领房', kind: 'boss', description: '污染源晶凝聚成晶核守卫。', enemies: ['boss'] }
  ]
};

const WEAPONS: WeaponConfig[] = [
  {
    id: 'short-sword',
    name: '短剑',
    role: '均衡稳定',
    description: '当前默认手感，攻击、击退和冲刺斩都保持标准。',
    pros: '手感稳定，容错较高',
    cons: '没有突出的爆发或距离优势',
    attackDamageMultiplier: 1,
    attackRange: 62,
    attackWidth: 38,
    attackCooldown: 330,
    knockbackPower: 32,
    dashDamageMultiplier: 1,
    dashDistanceMultiplier: 1,
    dashCooldownMultiplier: 1,
    dashHitRadius: 44,
    moveSpeedMultiplier: 1,
    attackColor: 0xffffff,
    attackAlpha: 0.26,
    attackVisual: '标准弧形斩击',
    dashVisual: '标准冲刺斩',
    specialText: '普攻：标准弧形斩击｜冲刺：标准冲刺斩',
    styleSummary: '均衡稳定 / 标准作战'
  },
  {
    id: 'heavy-blade',
    name: '重刃',
    role: '高伤害慢攻',
    description: '高伤害慢攻，强击退但出手窗口更危险。',
    pros: '伤害高，击退强，冲刺斩更痛',
    cons: '攻击慢，移动略慢，站桩风险更高',
    attackDamageMultiplier: 1.35,
    attackRange: 68,
    attackWidth: 44,
    attackCooldown: 425,
    knockbackPower: 42,
    dashDamageMultiplier: 1.22,
    dashDistanceMultiplier: 0.96,
    dashCooldownMultiplier: 1.1,
    dashHitRadius: 48,
    moveSpeedMultiplier: 0.95,
    attackColor: 0xffd28a,
    attackAlpha: 0.3,
    attackVisual: '高伤害重斩，冷却较慢',
    dashVisual: '高伤害冲刺重斩，冷却略长',
    specialText: '普攻：高伤害重斩，冷却较慢｜冲刺：高伤害，冷却略长',
    styleSummary: '高伤害慢攻 / 强击退'
  },
  {
    id: 'spear',
    name: '长枪',
    role: '远距穿刺',
    description: '攻击距离更远但判定更窄，适合拉扯。',
    pros: '攻击距离长，冲刺斩距离更远',
    cons: '近身被围时判定不如短剑舒服',
    attackDamageMultiplier: 0.92,
    attackRange: 88,
    attackWidth: 22,
    attackCooldown: 335,
    knockbackPower: 30,
    dashDamageMultiplier: 0.95,
    dashDistanceMultiplier: 1.18,
    dashCooldownMultiplier: 1,
    dashHitRadius: 34,
    moveSpeedMultiplier: 1,
    attackColor: 0x8ffcff,
    attackAlpha: 0.24,
    attackVisual: '长距离窄刺击',
    dashVisual: '更远距离穿刺突进',
    specialText: '普攻：长距离窄刺击｜冲刺：更远距离穿刺突进',
    styleSummary: '长距离穿刺 / 拉扯输出'
  },
  {
    id: 'dual-daggers',
    name: '双匕',
    role: '快速双段',
    description: '两段短斩，范围短且击退弱，需要贴身输出。',
    pros: '两段全中伤害高，冷却短，移动更灵活',
    cons: '范围短，击退弱，贴脸风险高',
    attackDamageMultiplier: 0.58,
    attackRange: 48,
    attackWidth: 28,
    attackCooldown: 220,
    knockbackPower: 23,
    dashDamageMultiplier: 0.88,
    dashDistanceMultiplier: 1,
    dashCooldownMultiplier: 0.82,
    dashHitRadius: 40,
    moveSpeedMultiplier: 1.06,
    attackColor: 0xd9b8ff,
    attackAlpha: 0.28,
    attackVisual: '两段短斩，范围短，冷却快',
    dashVisual: '冷却较短，伤害略低',
    specialText: '普攻：两段短斩，范围短，冷却快｜冲刺：冷却较短，伤害略低',
    styleSummary: '快速双段 / 高风险贴身输出'
  }
];

const DEFAULT_WEAPON = WEAPONS[0];
const WEAPON_BY_ID = new Map<WeaponId, WeaponConfig>(WEAPONS.map((weapon) => [weapon.id, weapon]));

const HEROES: HeroConfig[] = [
  {
    id: 'relic-hunter',
    name: '遗迹猎人',
    description: '进入灵墟寻找源晶的探索者',
    defaultWeaponId: 'short-sword',
    allowedWeaponIds: ['short-sword', 'heavy-blade', 'spear', 'dual-daggers'],
    baseStats: {
      hp: 120,
      atk: 14,
      def: 4,
      speed: 175
    },
    passiveText: '无专属被动'
  }
];

const DEFAULT_HERO = HEROES[0];

const getWeaponById = (id?: WeaponId) => (id ? WEAPON_BY_ID.get(id) : undefined) ?? DEFAULT_WEAPON;

const ENEMIES: Record<EnemyKind, Omit<Fighter['stats'], 'id' | 'nextAttack'>> = {
  slime: { name: '晶化史莱姆', kind: 'slime', hp: 25, maxHp: 25, atk: 7, def: 0, speed: 55, range: 30, cooldown: 1100 },
  skeleton: { name: '骷髅守卫', kind: 'skeleton', hp: 45, maxHp: 45, atk: 10, def: 2, speed: 82, range: 34, cooldown: 1050 },
  bat: { name: '暗影蝙蝠', kind: 'bat', hp: 20, maxHp: 20, atk: 9, def: 0, speed: 140, range: 28, cooldown: 820 },
  archer: { name: '符文射手', kind: 'archer', hp: 35, maxHp: 35, atk: 10, def: 1, speed: 70, range: 230, cooldown: 1450, ranged: true },
  boss: { name: '晶核守卫', kind: 'boss', hp: 220, maxHp: 220, atk: 12, def: 3, speed: 62, range: 62, cooldown: 1100, boss: true }
};

const REWARD_POOL: RewardOption[] = [
  { id: 'sharp-blade', name: '锋利剑刃', rarity: 'common', type: '攻击', description: '剑刃重新开锋，普通攻击与冲刺斩基础伤害提高。', effectText: 'ATK +2', apply: (scene) => { scene.player.stats.atk += 2; } },
  { id: 'attack-crystal', name: '攻击晶石', rarity: 'rare', type: '攻击', description: '源晶强化武器核心，但出现频率较低。', effectText: 'ATK +3', apply: (scene) => { scene.player.stats.atk += 3; } },
  { id: 'armor-rune', name: '破甲符文', rarity: 'rare', type: '攻击', description: '普通攻击和冲刺斩额外造成固定伤害。', effectText: '普攻 / 冲刺斩伤害 +2', apply: (scene) => { scene.relicState.bonusDamage += 2; } },
  { id: 'source-dagger', name: '源晶短刃', rarity: 'epic', type: '攻击', description: '冲刺斩获得源晶刃影加成，不影响普通攻击。', effectText: '冲刺斩伤害 +25%', apply: (scene) => { scene.relicState.dashDamageMultiplier += 0.25; } },

  { id: 'defense-charm', name: '防御护符', rarity: 'common', type: '生存', description: '稳定的护符让正面承伤更可靠。', effectText: 'DEF +1', apply: (scene) => { scene.player.stats.def += 1; } },
  { id: 'life-crystal', name: '生命结晶', rarity: 'rare', type: '生存', description: '提升最大生命，并立即回复同等生命。', effectText: 'MaxHP +15，回复 15 HP', apply: (scene) => { scene.player.stats.maxHp += 15; scene.player.stats.hp = Math.min(scene.player.stats.maxHp, scene.player.stats.hp + 15); } },
  { id: 'crystal-shield', name: '晶体护盾', rarity: 'rare', type: '生存', description: '进入新房间时生成一层独立临时护盾。', effectText: '每个新房间获得 Shield 10', apply: () => undefined },
  { id: 'source-plate', name: '源晶甲片', rarity: 'epic', type: '生存', description: '源晶甲片削弱普通怪造成的伤害。', effectText: '普通怪伤害 -15%', apply: (scene) => { scene.relicState.damageReductionFromMinions += 0.15; } },

  { id: 'small-potion', name: '小型生命药水', rarity: 'common', type: '回复', description: '立即饮用的应急药剂。', effectText: '立即回复 25 HP', stackable: true, apply: (scene) => { scene.healPlayer(25); } },
  { id: 'life-drain', name: '生命汲取', rarity: 'rare', type: '回复', description: '击杀普通敌人时抽取微弱生命。', effectText: '击杀普通敌人回复 3 HP', apply: () => undefined },
  { id: 'potion-belt', name: '药剂腰包', rarity: 'rare', type: '回复', description: '让补给房与药水奖励的治疗更有效。', effectText: '生命药水回复量 +10', apply: (scene) => { scene.relicState.potionHealBonus += 10; } },
  { id: 'spring-echo', name: '源泉残响', rarity: 'epic', type: '回复', description: '源泉回声只会在进入 Boss 房时触发一次。', effectText: '进入 Boss 房回复 20 HP', apply: () => undefined },

  { id: 'swift-boots', name: '疾步靴', rarity: 'common', type: '技能', description: '脚步变轻，更容易拉开敌人攻击前摇。', effectText: '移动速度 +10%', apply: (scene) => { scene.relicState.moveSpeedMultiplier += 0.1; } },
  { id: 'cooldown-core', name: '冷却核心', rarity: 'rare', type: '技能', description: '降低 K 冲刺斩与 L 护盾的冷却。', effectText: 'K / L 冷却 -10%', apply: (scene) => { scene.relicState.cooldownReduction = Math.min(0.35, scene.relicState.cooldownReduction + 0.1); } },
  { id: 'charge-emblem', name: '冲锋纹章', rarity: 'rare', type: '技能', description: '冲刺斩位移距离提高，路径命中范围保持稳定。', effectText: 'K 冲刺距离 +15%', apply: (scene) => { scene.relicState.dashDistanceMultiplier += 0.15; } },
  { id: 'echo-core', name: '回响核心', rarity: 'epic', type: '技能', description: '每次冲刺斩首次命中敌人时返还少量冷却。', effectText: 'K 命中后返还 1 秒冷却', apply: () => undefined }
];

const WEAPON_AWARE_RELIC_TEXT: Partial<Record<WeaponId, Record<string, { name: string; description: string }>>> = {
  'short-sword': {
    'sharp-blade': { name: '锋利剑刃', description: '剑刃重新开锋，短剑斩击更加凌厉。' },
    'source-dagger': { name: '源晶短刃', description: '源晶强化短剑核心，冲刺斩更加锋利。' }
  },
  'heavy-blade': {
    'sharp-blade': { name: '重刃淬火', description: '重刃被重新淬火，劈砍威力提升。' },
    'source-dagger': { name: '源晶重锋', description: '源晶附着在重刃上，冲刺重斩威力提升。' }
  },
  spear: {
    'sharp-blade': { name: '锋锐枪尖', description: '枪尖被源晶打磨，刺击更加精准。' },
    'source-dagger': { name: '源晶枪芒', description: '枪尖凝聚源晶锋芒，冲刺穿刺更具威胁。' }
  },
  'dual-daggers': {
    'sharp-blade': { name: '双刃开锋', description: '双匕刃口泛起寒光，连击更加致命。' },
    'source-dagger': { name: '源晶双刃', description: '双匕吸附源晶能量，冲刺连斩更加迅捷。' }
  }
};

const DUNGEON_EVENTS: DungeonEventDef[] = [
  {
    title: '古老祭坛',
    description: '一座布满裂纹的祭坛仍在低声共鸣，源晶碎片漂浮在祭坛上方。',
    options: [
      { text: '献祭 15 HP，获得 ATK +3', disabledText: '生命不足', canChoose: (scene) => scene.player.stats.hp > 15, apply: (scene) => { scene.player.stats.hp -= 15; scene.player.stats.atk += 3; return '献祭生命，ATK +3。'; } },
      { text: '献祭 20 金币，获得随机 rare 奖励', disabledText: '金币不足', canChoose: (scene) => scene.gold >= 20, apply: (scene) => { scene.gold -= 20; const reward = scene.pickRewardByRarity('rare', []); if (reward) scene.grantReward(reward); return reward ? `献祭金币，获得 ${scene.getRewardDisplayName(reward)}。` : '祭坛沉默了。'; } },
      { text: '离开，无事发生', canChoose: () => true, apply: () => '你离开了古老祭坛。' }
    ]
  },
  {
    title: '受伤的探险者',
    description: '一名受伤的探险者靠在墙边，他手里紧握着一枚微光护符。',
    options: [
      { text: '给予 10 金币，获得小型生命药水效果', disabledText: '金币不足', canChoose: (scene) => scene.gold >= 10, apply: (scene) => { scene.gold -= 10; const healed = scene.healPlayer(25 + scene.relicState.potionHealBonus); return `给予金币，回复 ${healed} HP。`; } },
      { text: '帮助治疗，回复 15 HP', canChoose: () => true, apply: (scene) => { const healed = scene.healPlayer(15); return `帮助探险者，回复 ${healed} HP。`; } },
      { text: '离开', canChoose: () => true, apply: () => '你没有停留。' }
    ]
  },
  {
    title: '污染源晶',
    description: '一枚污染源晶嵌在地面，里面传来微弱心跳声。',
    options: [
      { text: '吸收源晶，获得随机奖励，但受到 12 点伤害', canChoose: (scene) => scene.player.stats.hp > 12, disabledText: '生命不足', apply: (scene) => { const reward = scene.pickRewardByRarity(Phaser.Math.Between(1, 100) <= 75 ? 'rare' : 'common', []); scene.player.stats.hp = Math.max(1, scene.player.stats.hp - 12); if (reward) scene.grantReward(reward); return reward ? `吸收源晶，获得 ${scene.getRewardDisplayName(reward)}，受到 12 点伤害。` : '源晶碎裂，你受到 12 点伤害。'; } },
      { text: '净化源晶，回复 20 HP', canChoose: () => true, apply: (scene) => { const healed = scene.healPlayer(20); return `净化源晶，回复 ${healed} HP。`; } },
      { text: '打碎源晶，获得 20 金币', canChoose: () => true, apply: (scene) => { scene.gold += 20; return '打碎源晶，获得 20 金币。'; } }
    ]
  },
  {
    title: '破损武器架',
    description: '一座腐朽武器架倒在角落，仍能看见几件可用的装备。',
    options: [
      { text: '搜索武器，获得 ATK +2', canChoose: () => true, apply: (scene) => { scene.player.stats.atk += 2; return '找到可用武器，ATK +2。'; } },
      { text: '搜索护甲，获得 DEF +1', canChoose: () => true, apply: (scene) => { scene.player.stats.def += 1; return '找到护甲残片，DEF +1。'; } },
      { text: '离开', canChoose: () => true, apply: () => '你离开了武器架。' }
    ]
  }
];

const EVENT_PACK: EventPackDef[] = [
  {
    id: 'spike-trap',
    title: '尖刺陷阱',
    description: '石缝里弹出一排隐藏尖刺，寒光贴着护甲划过。',
    category: 'penalty',
    rarity: 'common',
    weight: 10,
    effectType: 'spike',
    effectText: '受到 10-16 点伤害，最低保留 1 HP。',
    followUpObjective: '通道会在陷阱停止后开启。',
    roomTags: ['event'],
    applyEffect: (scene) => {
      const damage = Phaser.Math.Between(10, 16);
      scene.applySafeEventDamage(damage, '尖刺陷阱');
      return {
        log: `尖刺陷阱刺穿护甲，造成 ${damage} 点伤害。`,
        floatingText: `尖刺陷阱 -${damage} HP`,
        opensPortal: true
      };
    }
  },
  {
    id: 'collapsing-floor',
    title: '塌陷地面',
    description: '脚下石板突然崩裂，碎石滚落进漆黑裂隙。',
    category: 'penalty',
    rarity: 'common',
    weight: 9,
    effectType: 'collapse',
    effectText: '受到 8-12 点伤害，下一房间移动速度降低 8%。',
    followUpObjective: '带着碎石拖累继续前进。',
    roomTags: ['event'],
    applyEffect: (scene) => {
      const damage = Phaser.Math.Between(8, 12);
      scene.applySafeEventDamage(damage, '塌陷地面');
      scene.applyNextRoomSlow();
      return {
        log: '地面塌陷，碎石拖慢了你的脚步。',
        floatingText: `塌陷 -${damage} HP / 下房减速`,
        opensPortal: true
      };
    }
  },
  {
    id: 'toxic-fog',
    title: '污染毒雾',
    description: '绿色雾气从破裂源晶中渗出，顺着呼吸侵入体内。',
    category: 'curse',
    rarity: 'common',
    weight: 8,
    effectType: 'poison',
    effectText: '获得中毒 2 房；每进入新房扣 4 HP，最低保留 1 HP。',
    followUpObjective: '寻找净化或撑过接下来的房间。',
    roomTags: ['event'],
    applyEffect: (scene) => {
      scene.applyPoison(2);
      return {
        log: '污染毒雾侵入体内，接下来 2 个房间会持续损伤生命。',
        floatingText: '中毒 2 房',
        opensPortal: true
      };
    }
  },
  {
    id: 'rust-curse',
    title: '锈蚀诅咒',
    description: '铁锈色符文爬上护甲，防护层发出细碎裂响。',
    category: 'curse',
    rarity: 'common',
    weight: 8,
    effectType: 'rust',
    effectText: '接下来 2 个房间 DEF -1，不会低于 0。',
    followUpObjective: '诅咒结束后护甲会恢复。',
    roomTags: ['event'],
    applyEffect: (scene) => {
      scene.applyRust(2);
      return {
        log: '锈蚀诅咒削弱了你的护甲。',
        floatingText: '锈蚀 2 房',
        opensPortal: true
      };
    }
  },
  {
    id: 'broken-weapon-rack',
    title: '破损武器架',
    description: '倒塌的武器架里还有一把能用的源晶短刃。',
    category: 'benefit',
    rarity: 'common',
    weight: 10,
    effectType: 'attack',
    effectText: '获得 ATK +2。',
    followUpObjective: '整理武器后继续前进。',
    roomTags: ['event'],
    applyEffect: (scene) => {
      scene.player.stats.atk += 2;
      return {
        log: '你从破损武器架中找到可用武器，ATK +2。',
        floatingText: 'ATK +2',
        opensPortal: true
      };
    }
  },
  {
    id: 'abandoned-armor-box',
    title: '废弃护甲箱',
    description: '一只旧箱子半埋在灰尘里，里面留着还能装配的护甲片。',
    category: 'benefit',
    rarity: 'common',
    weight: 10,
    effectType: 'defense',
    effectText: '获得 DEF +1。',
    followUpObjective: '装好护甲后继续前进。',
    roomTags: ['event'],
    applyEffect: (scene) => {
      scene.player.stats.def += 1;
      return {
        log: '你找到一块还能使用的护甲片，DEF +1。',
        floatingText: 'DEF +1',
        opensPortal: true
      };
    }
  },
  {
    id: 'lost-coin-pouch',
    title: '遗失钱袋',
    description: '墙角散着一只旧钱袋，几枚金币还带着微弱温度。',
    category: 'benefit',
    rarity: 'common',
    weight: 10,
    effectType: 'gold',
    effectText: '获得 15-30 金币。',
    followUpObjective: '收起金币后通道开启。',
    roomTags: ['event'],
    applyEffect: (scene) => {
      const gold = Phaser.Math.Between(15, 30);
      scene.gold += gold;
      return {
        log: '你发现了遗失的钱袋。',
        floatingText: `金币 +${gold}`,
        opensPortal: true
      };
    }
  },
  {
    id: 'source-healing-spring',
    title: '源晶治疗泉',
    description: '一眼源晶泉水仍未被完全污染，清亮的光晕缓慢荡开。',
    category: 'supply',
    rarity: 'rare',
    weight: 5,
    effectType: 'heal',
    effectText: '回复 20-30 HP；低于 35% HP 时额外回复 10 HP。',
    followUpObjective: '恢复后继续深入。',
    roomTags: ['event'],
    applyEffect: (scene) => {
      const baseHeal = Phaser.Math.Between(20, 30);
      const lowHpBonus = scene.player.stats.hp / scene.player.stats.maxHp < 0.35 ? 10 : 0;
      const healed = scene.healPlayer(baseHeal + lowHpBonus);
      return {
        log: '源晶治疗泉恢复了你的生命。',
        floatingText: healed > 0 ? `HP +${healed}` : '生命已满',
        opensPortal: true
      };
    }
  },
  {
    id: 'abandoned-potion-box',
    title: '废弃药剂箱',
    description: '破损木箱里还剩下一支密封药剂，药液已经有些浑浊。',
    category: 'supply',
    rarity: 'common',
    weight: 4,
    effectType: 'potion-box',
    effectText: '回复 12-18 HP，受药剂遗物加成影响。',
    followUpObjective: '使用药剂后继续前进。',
    roomTags: ['event'],
    applyEffect: (scene) => {
      const healed = scene.healPlayer(Phaser.Math.Between(12, 18) + scene.relicState.potionHealBonus);
      return {
        log: '你在废弃药剂箱中找到一支还能使用的药剂。',
        floatingText: healed > 0 ? `HP +${healed}` : '生命已满',
        opensPortal: true
      };
    }
  },
  {
    id: 'purifying-light',
    title: '净化之光',
    description: '一束洁白源光穿过穹顶裂缝，短暂压住了污染回声。',
    category: 'supply',
    rarity: 'rare',
    weight: 4,
    effectType: 'cleanse',
    effectText: '清除中毒或锈蚀；若没有异常状态，获得 10 点临时护盾。',
    followUpObjective: '净化完成后通道开启。',
    roomTags: ['event'],
    applyEffect: (scene) => {
      const cleansed = scene.cleanseNegativeStatuses();
      if (!cleansed) scene.relicState.temporaryShield = Math.max(scene.relicState.temporaryShield, 10);
      return {
        log: cleansed ? '净化之光驱散了异常状态。' : '净化之光没有找到异常状态，转化为 10 点临时护盾。',
        floatingText: cleansed ? '异常状态已清除' : 'Shield 10',
        opensPortal: true
      };
    }
  },
  {
    id: 'monster-ambush',
    title: '怪物伏击',
    description: '脚步声从墙后同时响起，通道被突然落下的石门封锁。',
    category: 'combat',
    rarity: 'common',
    weight: 6,
    effectType: 'ambush',
    effectText: '生成一小波普通怪；清完后开启传送门。',
    followUpObjective: '击败伏击怪物。',
    roomTags: ['event'],
    applyEffect: () => ({
      log: '你误入怪物伏击，通道被封锁了！',
      floatingText: '怪物伏击',
      enemies: ['slime', 'skeleton'],
      goldReward: 6,
      opensPortal: false
    })
  },
  {
    id: 'elite-patrol',
    title: '精英巡逻',
    description: '带着源晶徽记的巡逻队从阴影中逼近，精英守卫已经锁定你。',
    category: 'combat',
    rarity: 'rare',
    weight: 2,
    effectType: 'elite-patrol',
    effectText: '生成 1 个精英怪和 1 个普通怪；清完后给少量金币，低概率给 rare 奖励。',
    followUpObjective: '击败精英巡逻队。',
    roomTags: ['event'],
    minRoomIndex: 3,
    oncePerRun: true,
    applyEffect: () => ({
      log: '精英巡逻队发现了你！',
      floatingText: '精英巡逻',
      enemies: ['skeleton', 'archer'],
      goldReward: 12,
      rareRewardChance: 18,
      opensPortal: false
    })
  },
  {
    id: 'unstable-crystal',
    title: '不稳定源晶',
    description: '裂纹源晶在掌心震颤，危险能量和可用力量同时溢出。',
    category: 'mixed',
    rarity: 'rare',
    weight: 4,
    effectType: 'unstable-crystal',
    effectText: '受到 8 点伤害，并获得随机 common 或 rare 奖励。',
    followUpObjective: '吸收残余能量后继续前进。',
    roomTags: ['event'],
    applyEffect: (scene) => {
      scene.applySafeEventDamage(8, '不稳定源晶');
      const reward = scene.pickRewardByRarity(Phaser.Math.Between(1, 100) <= 70 ? 'common' : 'rare', []);
      if (reward) scene.grantReward(reward);
      return {
        log: reward ? `不稳定源晶灼伤了你，但也释放出可用能量：${scene.getRewardDisplayName(reward)}。` : '不稳定源晶灼伤了你，但残余能量很快消散。',
        floatingText: reward ? `-${8} HP / ${scene.getRewardDisplayName(reward)}` : '-8 HP',
        opensPortal: true
      };
    }
  }
];

const DUNGEON_ASSETS = [
  'floor',
  'wall',
  'door_closed',
  'door_open',
  'crystal_01',
  'crystal_02',
  'chest_closed',
  'chest_open',
  'potion_hp',
  'attack_crystal',
  'defense_charm'
] as const;

type DungeonAssetName = (typeof DUNGEON_ASSETS)[number];
const HUNTER_DIRECTIONS = ['down', 'up', 'left', 'right'] as const;
const HUNTER_FRAMES = ['1', '2'] as const;
const HUNTER_DISPLAY_SIZE = 51;
type HunterDirection = (typeof HUNTER_DIRECTIONS)[number];
type HunterFrame = 'idle' | (typeof HUNTER_FRAMES)[number];
const SLIME_FRAMES = ['idle_1', 'idle_2', 'move_1', 'move_2'] as const;
type SlimeFrame = (typeof SLIME_FRAMES)[number];
const SKELETON_FRAMES = ['idle_1', 'idle_2', 'walk_1', 'walk_2', 'attack'] as const;
type SkeletonFrame = (typeof SKELETON_FRAMES)[number];
const BAT_FRAMES = ['idle_1', 'idle_2', 'fly_1', 'fly_2', 'attack'] as const;
type BatFrame = (typeof BAT_FRAMES)[number];
const RUNE_ARCHER_FRAMES = ['idle_1', 'idle_2', 'cast_1', 'cast_2', 'attack'] as const;
type RuneArcherFrame = (typeof RUNE_ARCHER_FRAMES)[number];
const GUARDIAN_FRAMES = ['idle_1', 'idle_2', 'walk_1', 'walk_2', 'melee', 'shoot', 'phase2_idle_1', 'phase2_idle_2', 'phase2_melee', 'phase2_shoot'] as const;
type GuardianFrame = (typeof GUARDIAN_FRAMES)[number];

const BOSS_SKILL_DAMAGE = {
  phase1: {
    melee: 18,
    projectile: 14,
    spike: 18,
    shock: 18
  },
  phase2: {
    melee: 22,
    projectile: 16,
    spike: 24,
    shock: 20
  }
} as const;

interface PlayerDamageOptions {
  minDamageRatio?: number;
  invincibleMs?: number;
  shakeDuration?: number;
  shakeIntensity?: number;
  emphasized?: boolean;
  minionDamage?: boolean;
}

class ProceduralSoundManager {
  private ctx?: AudioContext;
  private enabled = false;

  async init() {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      this.ctx ??= new AudioContextClass();
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      this.enabled = true;
    } catch {
      this.enabled = false;
    }
  }

  play(name: SoundName) {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const presets: Record<SoundName, { freq: number; end: number; type: OscillatorType; gain: number; slide?: number }> = {
        swing: { freq: 320, end: 0.08, type: 'triangle', gain: 0.035, slide: 160 },
        hit: { freq: 150, end: 0.07, type: 'square', gain: 0.045, slide: 70 },
        hurt: { freq: 110, end: 0.12, type: 'sawtooth', gain: 0.05, slide: 55 },
        enemyDie: { freq: 240, end: 0.18, type: 'triangle', gain: 0.04, slide: 80 },
        pickup: { freq: 640, end: 0.16, type: 'sine', gain: 0.035, slide: 980 },
        chest: { freq: 430, end: 0.2, type: 'triangle', gain: 0.04, slide: 760 },
        portal: { freq: 520, end: 0.26, type: 'sine', gain: 0.035, slide: 260 },
        bossEnter: { freq: 90, end: 0.32, type: 'sawtooth', gain: 0.055, slide: 130 },
        bossPhase: { freq: 120, end: 0.38, type: 'sawtooth', gain: 0.06, slide: 240 },
        victory: { freq: 520, end: 0.34, type: 'triangle', gain: 0.045, slide: 1040 },
        defeat: { freq: 220, end: 0.36, type: 'sawtooth', gain: 0.045, slide: 80 }
      };
      const preset = presets[name];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = preset.type;
      osc.frequency.setValueAtTime(preset.freq, now);
      if (preset.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(1, preset.slide), now + preset.end);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(preset.gain, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + preset.end);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + preset.end + 0.02);
    } catch {
      // Audio should never block gameplay.
    }
  }
}

export class DungeonScene extends Phaser.Scene {
  private level: LevelConfig;
  private playerClass: PlayerClassConfig;
  private onRunEnd: (runId: string) => void;

  public player!: Fighter;
  private enemies!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private items!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  private statusText!: Phaser.GameObjects.Text;
  private skillText!: Phaser.GameObjects.Text;
  private roomText!: Phaser.GameObjects.Text;
  private roomTitleToast?: Phaser.GameObjects.Text;
  private logText!: Phaser.GameObjects.Text;
  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private hudPanel?: Phaser.GameObjects.Container;
  private titlePanel?: Phaser.GameObjects.Container;
  private pausePanel?: Phaser.GameObjects.Container;
  private weaponPanel?: Phaser.GameObjects.Container;
  private statusPanel?: Phaser.GameObjects.Container;
  private settlementPanel?: Phaser.GameObjects.Container;
  private rewardPanel?: Phaser.GameObjects.Container;
  private eventPanel?: Phaser.GameObjects.Container;
  private activeRewardChoices: RewardOption[] = [];
  private activeEvent?: EventPackDef;
  private doorSprite?: Phaser.GameObjects.Image;
  private doorTween?: Phaser.Tweens.Tween;
  private branchDoorSprites: Phaser.GameObjects.Image[] = [];
  private branchDoorLabels: Phaser.GameObjects.GameObject[] = [];
  private branchDoorTweens: Phaser.Tweens.Tween[] = [];
  private shieldRing?: Phaser.GameObjects.Arc;
  private playerWeaponVisual?: Phaser.GameObjects.Graphics;
  private bossBarBg?: Phaser.GameObjects.Rectangle;
  private bossBarFill?: Phaser.GameObjects.Rectangle;
  private bossBarText?: Phaser.GameObjects.Text;
  private unitHuds = new Map<string, UnitHud>();
  private sfx = new ProceduralSoundManager();
  private flowState: GameFlowState = 'title';
  private gameReady = false;
  private pendingHitStopUntil = 0;
  private hitStopActive = false;
  private playerActionState: PlayerActionState = 'normal';
  private dashHitEnemies = new Set<string>();
  private dashDamageTotal = 0;
  private dashLine?: Phaser.GameObjects.Line;
  private currentRoomBounds = new Phaser.Geom.Rectangle(128, 128, 704, 384);

  private currentRoomIndex = 0;
  private dungeonRoute: RoomDef[] = [];
  private visitedRoomIds: string[] = [];
  private enteredRoomNumbers = new Map<string, number>();
  private currentRoom = this.createRouteRoom(ROOM_TEMPLATES.start[0], 0);
  private selectedHero: HeroConfig = DEFAULT_HERO;
  private selectedWeapon: WeaponConfig = DEFAULT_WEAPON;
  private roomCleared = false;
  private rewardTaken = false;
  private runEnded = false;
  private shieldUntil = 0;
  private invincibleUntil = 0;
  private skillCooldowns = { attack: 0, dashSlash: 0, shield: 0 };
  private startedAt = Date.now();
  private kills = 0;
  public gold = 0;
  private damageTaken = 0;
  private skillUses = 0;
  private reachedBossPhaseTwo = false;
  private itemsObtained: string[] = [];
  private eventChoiceCount = 0;
  private eventStats: EventRunStats = this.createDefaultEventStats();
  private eventsSeen = new Set<string>();
  private poisonRooms = 0;
  private rustRooms = 0;
  private rustDefensePenalty = 0;
  private slowRooms = 0;
  private roomSpeedMultiplier = 1;
  private eventCombatGoldReward = 0;
  private eventCombatRareRewardChance = 0;
  private combatWaves: CombatWave[] = [];
  private currentWaveIndex = 0;
  private waveTransitionPending = false;
  private waveToast?: Phaser.GameObjects.Text;
  private rewardChoiceCount = 0;
  public relicState: PlayerRelicState = this.createDefaultRelicState();
  private epicRewardsTaken = 0;
  private lastFacing = new Phaser.Math.Vector2(1, 0);
  private playerDirection: HunterDirection = 'down';
  private playerWalkFrame: HunterFrame = 'idle';
  private nextWalkFrameAt = 0;

  constructor(level: LevelConfig, playerClass: PlayerClassConfig, onRunEnd: (runId: string) => void) {
    super('DungeonScene');
    this.level = level;
    this.playerClass = playerClass;
    this.onRunEnd = onRunEnd;
  }

  preload() {
    DUNGEON_ASSETS.forEach((name) => {
      this.load.image(`dungeon-${name}-png`, `/assets/generated/dungeon/${name}.png`);
      this.load.image(`dungeon-${name}-svg`, `/assets/generated/dungeon/${name}.svg`);
    });
    HUNTER_DIRECTIONS.forEach((direction) => {
      this.load.image(`hunter-${direction}-png`, `/assets/generated/characters/hunter/hunter_${direction}.png`);
      this.load.image(`hunter-${direction}-svg`, `/assets/generated/characters/hunter/hunter_${direction}.svg`);
      HUNTER_FRAMES.forEach((frame) => {
        this.load.image(`hunter-${direction}-${frame}-png`, `/assets/generated/characters/hunter/hunter_${direction}_${frame}.png`);
        this.load.image(`hunter-${direction}-${frame}-svg`, `/assets/generated/characters/hunter/hunter_${direction}_${frame}.svg`);
      });
    });
    SLIME_FRAMES.forEach((frame) => {
      this.load.image(`slime-${frame}-png`, `/assets/generated/monsters/crystal_slime/slime_${frame}.png`);
      this.load.image(`slime-${frame}-svg`, `/assets/generated/monsters/crystal_slime/slime_${frame}.svg`);
    });
    SKELETON_FRAMES.forEach((frame) => {
      this.load.image(`skeleton-${frame}-png`, `/assets/generated/monsters/skeleton_guard/skeleton_${frame}.png`);
      this.load.image(`skeleton-${frame}-svg`, `/assets/generated/monsters/skeleton_guard/skeleton_${frame}.svg`);
    });
    BAT_FRAMES.forEach((frame) => {
      this.load.image(`bat-${frame}-png`, `/assets/generated/monsters/shadow_bat/bat_${frame}.png`);
      this.load.image(`bat-${frame}-svg`, `/assets/generated/monsters/shadow_bat/bat_${frame}.svg`);
    });
    RUNE_ARCHER_FRAMES.forEach((frame) => {
      this.load.image(`rune-archer-${frame}-png`, `/assets/generated/monsters/rune_archer/rune_archer_${frame}.png`);
      this.load.image(`rune-archer-${frame}-svg`, `/assets/generated/monsters/rune_archer/rune_archer_${frame}.svg`);
    });
    this.load.image('rune-projectile-png', '/assets/generated/monsters/rune_archer/rune_projectile.png');
    this.load.image('rune-projectile-svg', '/assets/generated/monsters/rune_archer/rune_projectile.svg');
    GUARDIAN_FRAMES.forEach((frame) => {
      this.load.image(`guardian-${frame}-png`, `/assets/generated/boss/crystal_guardian/guardian_${frame}.png`);
      this.load.image(`guardian-${frame}-svg`, `/assets/generated/boss/crystal_guardian/guardian_${frame}.svg`);
    });
    this.load.image('guardian-crystal-projectile-png', '/assets/generated/boss/crystal_guardian/crystal_projectile.png');
    this.load.image('guardian-crystal-projectile-svg', '/assets/generated/boss/crystal_guardian/crystal_projectile.svg');
    this.load.image('guardian-crystal-spike-png', '/assets/generated/boss/crystal_guardian/crystal_spike.png');
    this.load.image('guardian-crystal-spike-svg', '/assets/generated/boss/crystal_guardian/crystal_spike.svg');
  }

  create() {
    this.resetRunState();
    this.createTextures();
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,J,K,L,E,I,ESC,R,ONE,TWO,THREE,FOUR') as Record<string, Phaser.Input.Keyboard.Key>;
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.walls = this.physics.add.staticGroup();
    this.items = this.physics.add.staticGroup();
    this.createPlayer();

    this.physics.world.setBounds(0, 0, 960, 600);
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => this.handleProjectileHitEnemy(bullet as Phaser.Physics.Arcade.Sprite, enemy as Fighter));

    this.hudPanel = this.add.container(18, 16).setDepth(80);
    this.hudPanel.add(this.add.rectangle(0, 0, 318, 124, 0x07101e, 0.72).setOrigin(0).setStrokeStyle(1, 0x2d5f78, 0.8));
    this.hudPanel.add(this.add.text(14, 10, '遗迹猎人', { fontFamily: 'monospace', fontSize: '15px', color: '#eaffff' }));
    this.hpBarBg = this.add.rectangle(14, 37, 176, 13, 0x27101b).setOrigin(0);
    this.hpBarFill = this.add.rectangle(14, 37, 176, 13, 0x35e7c4).setOrigin(0);
    this.hudPanel.add([this.hpBarBg, this.hpBarFill]);
    this.statusText = this.add.text(14, 58, '', { fontFamily: 'monospace', fontSize: '13px', color: '#dff7ff', lineSpacing: 4 });
    this.hudPanel.add(this.statusText);
    this.skillText = this.add.text(18, 458, '', { fontFamily: 'monospace', fontSize: '15px', color: '#aefcff', lineSpacing: 7 }).setDepth(80);
    this.roomText = this.add.text(690, 14, '', { fontFamily: 'monospace', fontSize: '15px', color: '#8fffe6', align: 'right', wordWrap: { width: 250 } }).setDepth(80);
    this.logText = this.add.text(18, 552, '', { fontFamily: 'monospace', fontSize: '15px', color: '#ffe6ad', wordWrap: { width: 900 } }).setDepth(80);
    this.setGameplayUiVisible(false);
    this.player.setVisible(false);
    this.showTitleScreen();
  }

  private setGameplayUiVisible(visible: boolean) {
    this.hudPanel?.setVisible(visible);
    this.skillText?.setVisible(visible);
    this.roomText?.setVisible(visible);
    this.logText?.setVisible(visible);
  }

  private showTitleScreen() {
    this.flowState = 'title';
    this.gameReady = false;
    this.physics.world.pause();
    this.setGameplayUiVisible(false);
    this.destroyBossBar();
    this.roomTitleToast?.destroy();
    this.pausePanel?.destroy();
    this.setWorldVisible(false);
    this.titlePanel?.destroy();
    this.titlePanel = this.add.container(480, 300).setDepth(220);
    this.titlePanel.add(this.add.rectangle(0, 0, 690, 430, 0x07101e, 0.96).setStrokeStyle(2, 0x35e7c4, 0.95));
    this.titlePanel.add(this.add.text(0, -145, '灵墟地牢', { fontFamily: 'monospace', fontSize: '46px', color: '#ffffff', stroke: '#0bd8c7', strokeThickness: 2 }).setOrigin(0.5));
    this.titlePanel.add(this.add.text(0, -88, '进入被污染的地下遗迹，击败晶核守卫，净化源晶核心。', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#dff7ff'
    }).setOrigin(0.5));
    const startButton = this.createMenuButton(0, 0, 210, '开始游戏', () => {
      void this.sfx.init();
      this.showWeaponSelection();
    });
    const helpButton = this.createMenuButton(0, 66, 210, '操作说明', () => this.showControlHelp());
    this.titlePanel.add(startButton);
    this.titlePanel.add(helpButton);
    this.titlePanel.add(this.add.text(0, 145, 'WASD 移动  J 攻击  K 冲刺斩  L 护盾  E 互动  Esc 暂停', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#8fffe6'
    }).setOrigin(0.5));
  }

  private showControlHelp() {
    if (!this.titlePanel) return;
    const help = this.add.container(0, 34).setDepth(221);
    help.add(this.add.rectangle(0, 0, 390, 170, 0x0b1628, 0.96).setStrokeStyle(1, 0x8ffcff));
    help.add(this.add.text(-160, -64, [
      'WASD / 方向键移动',
      'J 普通攻击',
      'K 冲刺斩',
      'L 护盾',
      'E 互动',
      'Esc 暂停'
    ], { fontFamily: 'monospace', fontSize: '17px', color: '#eaffff', lineSpacing: 7 }));
    this.titlePanel.add(help);
    this.time.delayedCall(2600, () => help.destroy());
  }

  private createMenuButton(x: number, y: number, width: number, label: string, onClick: () => void) {
    const button = this.add.container(x, y);
    const rect = this.add.rectangle(0, 0, width, 44, 0x12314c, 0.94).setStrokeStyle(2, 0x35e7c4).setInteractive({ useHandCursor: true });
    const text = this.add.text(0, 0, label, { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);
    rect.on('pointerover', () => rect.setFillStyle(0x1d4d70, 0.98));
    rect.on('pointerout', () => rect.setFillStyle(0x12314c, 0.94));
    rect.on('pointerdown', onClick);
    button.add([rect, text]);
    return button;
  }

  private startGame() {
    this.titlePanel?.destroy();
    this.titlePanel = undefined;
    this.resetRunState();
    this.flowState = 'playing';
    this.gameReady = true;
    this.time.paused = false;
    this.physics.world.resume();
    this.setGameplayUiVisible(true);
    this.player.stats = {
      id: 'player',
      name: this.selectedHero.name,
      kind: 'player',
      hp: this.selectedHero.baseStats.hp,
      maxHp: this.selectedHero.baseStats.hp,
      atk: this.selectedHero.baseStats.atk,
      def: this.selectedHero.baseStats.def,
      speed: this.selectedHero.baseStats.speed,
      range: 54,
      cooldown: 330,
      nextAttack: 0
    };
    this.player.setTexture(this.hunterAssetKey('down')).setDisplaySize(HUNTER_DISPLAY_SIZE, HUNTER_DISPLAY_SIZE).setVisible(true).setActive(true).enableBody(true, 480, 330, true, true);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(30, 30, true);
    this.unitHuds.forEach((hud) => {
      hud.name.destroy();
      hud.hpBg.destroy();
      hud.hpFill.destroy();
    });
    this.unitHuds.clear();
    this.createUnitHud(this.player);
    this.loadRoom(0);
    this.log('进入灵墟。按 E 进入下一房间，战斗房必须清空后才能继续。');
    this.updateUi(this.time.now);
  }

  private pauseGame() {
    if (this.flowState !== 'playing' || this.runEnded) return;
    this.flowState = 'paused';
    this.physics.world.pause();
    this.tweens.pauseAll();
    this.time.paused = true;
    this.player.setVelocity(0, 0);
    this.enemies.getChildren().forEach((enemy) => (enemy as Fighter).setVelocity(0, 0));
    this.pausePanel?.destroy();
    this.pausePanel = this.add.container(480, 300).setDepth(210);
    this.pausePanel.add(this.add.rectangle(0, 0, 430, 315, 0x07101e, 0.97).setStrokeStyle(2, 0x8ffcff));
    this.pausePanel.add(this.add.text(0, -112, '游戏暂停', { fontFamily: 'monospace', fontSize: '30px', color: '#ffffff' }).setOrigin(0.5));
    this.pausePanel.add(this.createMenuButton(0, -42, 180, '继续游戏', () => this.resumeGame()));
    this.pausePanel.add(this.createMenuButton(0, 22, 180, '重新开始', () => this.restartRun()));
    this.pausePanel.add(this.createMenuButton(0, 86, 180, '返回标题', () => this.returnToTitle()));
  }

  private resumeGame() {
    if (this.flowState !== 'paused') return;
    this.flowState = 'playing';
    this.pausePanel?.destroy();
    this.pausePanel = undefined;
    this.time.paused = false;
    this.physics.world.resume();
    this.tweens.resumeAll();
  }

  private showStatusPanel() {
    if (this.flowState !== 'playing' || this.runEnded) return;
    this.flowState = 'status';
    this.physics.world.pause();
    this.tweens.pauseAll();
    this.time.paused = true;
    this.player.setVelocity(0, 0);
    this.enemies.getChildren().forEach((enemy) => (enemy as Fighter).setVelocity(0, 0));
    this.statusPanel?.destroy();
    this.statusPanel = this.add.container(480, 300).setDepth(235);
    this.statusPanel.add(this.add.rectangle(0, 0, 760, 460, 0x07101e, 0.94).setStrokeStyle(2, 0x35e7c4, 0.92));
    this.statusPanel.add(this.add.text(0, -205, '当前状态', { fontFamily: 'monospace', fontSize: '28px', color: '#ffffff' }).setOrigin(0.5));

    this.statusPanel.add(this.add.text(-340, -165, '基础属性', { fontFamily: 'monospace', fontSize: '17px', color: '#8ffcff' }));
    this.statusPanel.add(this.add.text(-340, -137, this.getStatusBasicLines(), {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#dff7ff',
      lineSpacing: 2,
      wordWrap: { width: 330 }
    }));

    this.statusPanel.add(this.add.text(-340, 22, '当前增益', { fontFamily: 'monospace', fontSize: '17px', color: '#8ffcff' }));
    this.statusPanel.add(this.add.text(-340, 50, this.getStatusBuffLines(), {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#eaffff',
      lineSpacing: 4,
      wordWrap: { width: 330 }
    }));

    this.statusPanel.add(this.add.text(-340, 144, '当前减益', { fontFamily: 'monospace', fontSize: '17px', color: '#ffb0b0' }));
    this.statusPanel.add(this.add.text(-340, 172, this.getStatusDebuffLines(), {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#ffe0e0',
      lineSpacing: 4,
      wordWrap: { width: 330 }
    }));

    this.statusPanel.add(this.add.text(40, -165, '已获得遗物', { fontFamily: 'monospace', fontSize: '17px', color: '#8ffcff' }));
    this.statusPanel.add(this.add.text(40, -137, this.getStatusRelicLines(), {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#dff7ff',
      lineSpacing: 2,
      wordWrap: { width: 330 }
    }));

    this.statusPanel.add(this.add.text(40, 128, '最近获得', { fontFamily: 'monospace', fontSize: '17px', color: '#ffe6ad' }));
    this.statusPanel.add(this.add.text(40, 156, this.getRecentObtainedText(), {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#fff5d6',
      lineSpacing: 4,
      wordWrap: { width: 330 }
    }));

    this.statusPanel.add(this.add.text(0, 204, 'I / Esc 关闭', { fontFamily: 'monospace', fontSize: '15px', color: '#8ffcff' }).setOrigin(0.5));
  }

  private closeStatusPanel() {
    if (this.flowState !== 'status') return;
    this.statusPanel?.destroy();
    this.statusPanel = undefined;
    this.flowState = 'playing';
    this.time.paused = false;
    this.physics.world.resume();
    this.tweens.resumeAll();
  }

  private getStatusBasicLines() {
    return [
      `HP：${Math.max(0, Math.ceil(this.player.stats.hp))} / ${this.player.stats.maxHp}`,
      `ATK：${this.player.stats.atk}`,
      `DEF：${this.player.stats.def}`,
      `金币：${this.gold}`,
      `遗物：${this.relicState.relics.length}`,
      `当前角色：${this.selectedHero.name}`,
      `角色说明：${this.selectedHero.description}`,
      `当前武器：${this.selectedWeapon.name}`,
      `武器特点：${this.selectedWeapon.styleSummary}`,
      `普攻：${this.selectedWeapon.attackVisual}`,
      `K 冲刺：${this.selectedWeapon.dashVisual}`,
      `当前房间：第 ${this.getDisplayRoomNumber()} / ${this.getDisplayTotalRooms()} 房`,
      `房间类型：${this.getRoomTypeLabel()}`
    ].join('\n');
  }

  private getStatusBuffLines() {
    const buffs: string[] = [];
    if (this.relicState.temporaryShield > 0) buffs.push(`临时护盾：${this.relicState.temporaryShield}`);
    if (this.relicState.moveSpeedMultiplier !== 1) buffs.push(`移动速度 +${Math.round((this.relicState.moveSpeedMultiplier - 1) * 100)}%`);
    if (this.relicState.dashDamageMultiplier !== 1) buffs.push(`冲刺伤害 +${Math.round((this.relicState.dashDamageMultiplier - 1) * 100)}%`);
    if (this.relicState.dashDistanceMultiplier !== 1) buffs.push(`冲刺距离 +${Math.round((this.relicState.dashDistanceMultiplier - 1) * 100)}%`);
    if (this.relicState.cooldownReduction > 0) buffs.push(`K / L 冷却缩减 ${Math.round(this.relicState.cooldownReduction * 100)}%`);
    if (this.relicState.potionHealBonus > 0) buffs.push(`药水回复 +${this.relicState.potionHealBonus}`);
    if (this.relicState.bonusDamage > 0) buffs.push(`普通攻击额外伤害 +${this.relicState.bonusDamage}`);
    if (this.relicState.damageReductionFromMinions > 0) buffs.push(`小怪伤害减免 ${Math.round(this.relicState.damageReductionFromMinions * 100)}%`);
    if (this.player.stats.maxHp > this.selectedHero.baseStats.hp) buffs.push(`最大生命提升 +${this.player.stats.maxHp - this.selectedHero.baseStats.hp}`);
    if (this.player.stats.atk > this.selectedHero.baseStats.atk) buffs.push(`攻击提升 +${this.player.stats.atk - this.selectedHero.baseStats.atk}`);
    if (this.player.stats.def + this.rustDefensePenalty > this.selectedHero.baseStats.def) buffs.push(`防御提升 +${this.player.stats.def + this.rustDefensePenalty - this.selectedHero.baseStats.def}`);
    return buffs.length > 0 ? buffs.join('\n') : '暂无增益';
  }

  private getStatusDebuffLines() {
    const debuffs: string[] = [];
    if (this.poisonRooms > 0) debuffs.push(`中毒：剩余 ${this.poisonRooms} 房`);
    if (this.rustRooms > 0) debuffs.push(`锈蚀：剩余 ${this.rustRooms} 房`);
    if (this.slowRooms > 0 || this.roomSpeedMultiplier < 1) debuffs.push(`减速：剩余 ${Math.max(this.slowRooms, this.roomSpeedMultiplier < 1 ? 1 : 0)} 房`);
    return debuffs.length > 0 ? debuffs.join('\n') : '暂无减益';
  }

  private getStatusRelicLines() {
    if (this.relicState.relics.length === 0) return '暂无遗物';
    return this.relicState.relics
      .map((relic) => `${this.getRewardDisplayName(relic)}｜${relic.rarity.toUpperCase()}｜${relic.effectText}\n${this.getRewardDisplayDescription(relic)}`)
      .join('\n');
  }

  private getRewardDisplayText(reward: RewardOption) {
    return WEAPON_AWARE_RELIC_TEXT[this.selectedWeapon.id]?.[reward.id];
  }

  public getRewardDisplayName(reward: RewardOption) {
    return this.getRewardDisplayText(reward)?.name ?? reward.name;
  }

  private getRewardDisplayDescription(reward: RewardOption) {
    return this.getRewardDisplayText(reward)?.description ?? reward.description;
  }

  private getRecentObtainedText() {
    const recent = this.itemsObtained.slice(-3);
    return recent.length > 0 ? recent.join(' / ') : '暂无记录';
  }

  private restartRun() {
    this.pausePanel?.destroy();
    this.time.paused = false;
    this.tweens.resumeAll();
    this.physics.world.resume();
    this.setWorldVisible(true);
    this.showWeaponSelection();
  }

  private returnToTitle() {
    this.pausePanel?.destroy();
    this.time.paused = false;
    this.tweens.resumeAll();
    this.physics.world.resume();
    this.setWorldVisible(false);
    this.showTitleScreen();
  }

  private setWorldVisible(visible: boolean) {
    this.player?.setVisible(visible);
    this.playerWeaponVisual?.setVisible(visible);
    this.enemies?.setVisible(visible);
    this.bullets?.setVisible(visible);
    this.walls?.setVisible(visible);
    this.items?.setVisible(visible);
    this.children.list
      .filter((child) => child.getData?.('roomObj'))
      .forEach((child) => (child as Phaser.GameObjects.GameObject & { setVisible?: (value: boolean) => void }).setVisible?.(visible));
    this.unitHuds.forEach((hud) => {
      hud.name.setVisible(visible);
      hud.hpBg.setVisible(visible);
      hud.hpFill.setVisible(visible);
    });
  }

  update(time: number) {
    if (this.flowState === 'title') return;
    if (this.flowState === 'weapon') {
      if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.chooseWeapon(0);
      if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) this.chooseWeapon(1);
      if (Phaser.Input.Keyboard.JustDown(this.keys.THREE)) this.chooseWeapon(2);
      if (Phaser.Input.Keyboard.JustDown(this.keys.FOUR)) this.chooseWeapon(3);
      return;
    }
    if (this.flowState === 'ended' || this.runEnded) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.scene.restart();
      return;
    }
    if (this.flowState === 'status') {
      if (Phaser.Input.Keyboard.JustDown(this.keys.I) || Phaser.Input.Keyboard.JustDown(this.keys.ESC)) this.closeStatusPanel();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      if (this.flowState === 'reward' || this.flowState === 'event') return;
      if (this.flowState === 'paused') this.resumeGame();
      else this.pauseGame();
      return;
    }
    if (this.flowState === 'reward') {
      if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.chooseRewardByIndex(0);
      if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) this.chooseRewardByIndex(1);
      if (Phaser.Input.Keyboard.JustDown(this.keys.THREE)) this.chooseRewardByIndex(2);
      return;
    }
    if (this.flowState === 'event') {
      if (Phaser.Input.Keyboard.JustDown(this.keys.E) || Phaser.Input.Keyboard.JustDown(this.cursors.space)) this.resolveActiveEvent();
      return;
    }
    if (this.flowState === 'paused') return;
    if (Phaser.Input.Keyboard.JustDown(this.keys.I)) {
      if (this.hitStopActive) return;
      this.showStatusPanel();
      return;
    }
    if (this.hitStopActive) {
      if (time >= this.pendingHitStopUntil) this.endHitStop();
      else return;
    }

    if (this.playerActionState === 'dashing') {
      this.updateDashHits();
      if (Phaser.Input.Keyboard.JustDown(this.keys.L)) this.activateShield(time);
    } else {
      this.movePlayer(time);
      if (Phaser.Input.Keyboard.JustDown(this.keys.J)) this.normalAttack(time);
      if (Phaser.Input.Keyboard.JustDown(this.keys.K)) this.dashSlash(time);
      if (Phaser.Input.Keyboard.JustDown(this.keys.L)) this.activateShield(time);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.interact();
    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.scene.restart();

    this.updateEnemies(time);
    this.updateBossHazards(time);
    if (!this.roomCleared && this.currentRoom.enemies.length > 0 && this.countLivingEnemies() === 0) this.handleRoomEnemiesCleared();
    this.updateInvincibleVisual(time);
    this.updatePlayerWeaponVisual();
    this.updateUi(time);
    this.updateUnitHuds();
    this.handleEnemyProjectileHits();
    this.cleanupProjectiles();
  }

  private assetKey(name: DungeonAssetName) {
    const png = `dungeon-${name}-png`;
    const svg = `dungeon-${name}-svg`;
    const fallback = `dungeon-${name}-fallback`;
    if (this.textures.exists(png)) return png;
    if (this.textures.exists(svg)) return svg;
    return fallback;
  }

  private hunterAssetKey(direction: HunterDirection, frame: HunterFrame = 'idle'): string {
    const suffix = frame === 'idle' ? '' : `-${frame}`;
    const png = `hunter-${direction}${suffix}-png`;
    const svg = `hunter-${direction}${suffix}-svg`;
    if (this.textures.exists(png)) return png;
    if (this.textures.exists(svg)) return svg;
    if (frame !== 'idle') return this.hunterAssetKey(direction, 'idle');
    return 'hunter';
  }

  private hasGeneratedHunter(direction: HunterDirection, frame: HunterFrame = 'idle') {
    const suffix = frame === 'idle' ? '' : `-${frame}`;
    return this.textures.exists(`hunter-${direction}${suffix}-png`) || this.textures.exists(`hunter-${direction}${suffix}-svg`);
  }

  private slimeAssetKey(frame: SlimeFrame = 'idle_1'): string {
    const png = `slime-${frame}-png`;
    const svg = `slime-${frame}-svg`;
    if (this.textures.exists(png)) return png;
    if (this.textures.exists(svg)) return svg;
    if (frame !== 'idle_1') return this.slimeAssetKey('idle_1');
    return 'slime';
  }

  private hasGeneratedSlime(frame: SlimeFrame = 'idle_1') {
    return this.textures.exists(`slime-${frame}-png`) || this.textures.exists(`slime-${frame}-svg`);
  }

  private skeletonAssetKey(frame: SkeletonFrame = 'idle_1'): string {
    const png = `skeleton-${frame}-png`;
    const svg = `skeleton-${frame}-svg`;
    if (this.textures.exists(png)) return png;
    if (this.textures.exists(svg)) return svg;
    if (frame !== 'idle_1') return this.skeletonAssetKey('idle_1');
    return 'skeleton';
  }

  private hasGeneratedSkeleton(frame: SkeletonFrame = 'idle_1') {
    return this.textures.exists(`skeleton-${frame}-png`) || this.textures.exists(`skeleton-${frame}-svg`);
  }

  private batAssetKey(frame: BatFrame = 'idle_1'): string {
    const png = `bat-${frame}-png`;
    const svg = `bat-${frame}-svg`;
    if (this.textures.exists(png)) return png;
    if (this.textures.exists(svg)) return svg;
    if (frame !== 'idle_1') return this.batAssetKey('idle_1');
    return 'bat';
  }

  private hasGeneratedBat(frame: BatFrame = 'idle_1') {
    return this.textures.exists(`bat-${frame}-png`) || this.textures.exists(`bat-${frame}-svg`);
  }

  private runeArcherAssetKey(frame: RuneArcherFrame = 'idle_1'): string {
    const png = `rune-archer-${frame}-png`;
    const svg = `rune-archer-${frame}-svg`;
    if (this.textures.exists(png)) return png;
    if (this.textures.exists(svg)) return svg;
    if (frame !== 'idle_1') return this.runeArcherAssetKey('idle_1');
    return 'archer';
  }

  private hasGeneratedRuneArcher(frame: RuneArcherFrame = 'idle_1') {
    return this.textures.exists(`rune-archer-${frame}-png`) || this.textures.exists(`rune-archer-${frame}-svg`);
  }

  private runeProjectileKey() {
    if (this.textures.exists('rune-projectile-png')) return 'rune-projectile-png';
    if (this.textures.exists('rune-projectile-svg')) return 'rune-projectile-svg';
    return 'bullet';
  }

  private guardianAssetKey(frame: GuardianFrame = 'idle_1'): string {
    const png = `guardian-${frame}-png`;
    const svg = `guardian-${frame}-svg`;
    if (this.textures.exists(png)) return png;
    if (this.textures.exists(svg)) return svg;
    if (frame !== 'idle_1') return this.guardianAssetKey('idle_1');
    return 'boss';
  }

  private hasGeneratedGuardian(frame: GuardianFrame = 'idle_1') {
    return this.textures.exists(`guardian-${frame}-png`) || this.textures.exists(`guardian-${frame}-svg`);
  }

  private guardianProjectileKey() {
    if (this.textures.exists('guardian-crystal-projectile-png')) return 'guardian-crystal-projectile-png';
    if (this.textures.exists('guardian-crystal-projectile-svg')) return 'guardian-crystal-projectile-svg';
    return 'bullet';
  }

  private guardianSpikeKey() {
    if (this.textures.exists('guardian-crystal-spike-png')) return 'guardian-crystal-spike-png';
    if (this.textures.exists('guardian-crystal-spike-svg')) return 'guardian-crystal-spike-svg';
    return 'spike';
  }

  private createRouteRoom(template: RoomTemplate, index: number): RoomDef {
    return {
      ...template,
      enemies: [...template.enemies],
      id: `room-${index + 1}-${template.kind}`,
      roomIndex: index,
      nextOptions: [],
      isCleared: false,
      rewardClaimed: template.kind === 'rest' ? false : !template.reward,
      eventResolved: template.kind !== 'event'
    };
  }

  private randomTemplate(kind: RoomKind) {
    return Phaser.Utils.Array.GetRandom(ROOM_TEMPLATES[kind]);
  }

  private generateDungeonRoute() {
    const targetLength = Phaser.Math.Between(6, 8);
    const maxOptionalRooms = targetLength >= 7 ? 2 : 1;
    const optionalKinds = Phaser.Utils.Array.Shuffle([
      ...(Phaser.Math.Between(1, 100) <= 55 ? ['event' as RoomKind] : []),
      ...(Phaser.Math.Between(1, 100) <= 75 ? ['treasure' as RoomKind] : [])
    ]).slice(0, maxOptionalRooms);
    if (optionalKinds.length === 0) optionalKinds.push('treasure');

    const middleCount = Math.max(3, targetLength - optionalKinds.length - 2);
    const eliteSlot = Phaser.Math.Between(1, middleCount - 1);
    const backboneKinds: RoomKind[] = ['start'];
    for (let index = 0; index < middleCount; index += 1) {
      if (index === 0) backboneKinds.push('battle');
      else if (index === eliteSlot) backboneKinds.push('elite');
      else backboneKinds.push(Phaser.Math.Between(1, 100) <= 24 ? 'elite' : 'battle');
    }
    if (backboneKinds.filter((kind) => kind === 'battle').length < 2) {
      for (let index = backboneKinds.length - 1; index > 0; index -= 1) {
        if (backboneKinds[index] !== 'elite' || index === eliteSlot + 1) continue;
        backboneKinds[index] = 'battle';
        break;
      }
    }
    backboneKinds.push('boss');

    const eligibleEdges = backboneKinds
      .map((kind, index) => ({ kind, index }))
      .filter(({ kind, index }) => index > 0 && index < backboneKinds.length - 2 && (kind === 'battle' || kind === 'elite'))
      .map(({ index }) => index);
    const optionalByEdge = new Map<number, RoomKind>();
    Phaser.Utils.Array.Shuffle([...eligibleEdges]).slice(0, optionalKinds.length).forEach((edgeIndex, index) => {
      optionalByEdge.set(edgeIndex, optionalKinds[index]);
    });

    const entries: Array<{ kind: RoomKind; backboneIndex?: number; optionalForEdge?: number }> = [{ kind: backboneKinds[0], backboneIndex: 0 }];
    for (let edgeIndex = 0; edgeIndex < backboneKinds.length - 1; edgeIndex += 1) {
      const optionalKind = optionalByEdge.get(edgeIndex);
      if (optionalKind) entries.push({ kind: optionalKind, optionalForEdge: edgeIndex });
      entries.push({ kind: backboneKinds[edgeIndex + 1], backboneIndex: edgeIndex + 1 });
    }

    const route = entries.map((entry, index) => this.createRouteRoom(this.randomTemplate(entry.kind), index));
    const finalIndexByBackbone = new Map<number, number>();
    const optionalIndexByEdge = new Map<number, number>();
    entries.forEach((entry, index) => {
      if (entry.backboneIndex !== undefined) finalIndexByBackbone.set(entry.backboneIndex, index);
      if (entry.optionalForEdge !== undefined) optionalIndexByEdge.set(entry.optionalForEdge, index);
    });

    entries.forEach((entry, index) => {
      if (entry.optionalForEdge !== undefined) {
        route[index].nextOptions = [finalIndexByBackbone.get(entry.optionalForEdge + 1)!];
        return;
      }
      if (entry.backboneIndex === undefined || entry.backboneIndex >= backboneKinds.length - 1) {
        route[index].nextOptions = [];
        return;
      }
      const mainTarget = finalIndexByBackbone.get(entry.backboneIndex + 1)!;
      const optionalTarget = optionalIndexByEdge.get(entry.backboneIndex);
      route[index].nextOptions = optionalTarget === undefined ? [mainTarget] : [mainTarget, optionalTarget];
    });

    return route;
  }

  private pickWeightedRoomKind(entries: Array<[RoomKind, number]>) {
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = Phaser.Math.Between(1, total);
    for (const [kind, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return kind;
    }
    return entries[0][0];
  }

  private getDisplayRoomNumber(room: RoomDef = this.currentRoom) {
    return this.enteredRoomNumbers.get(room.id) ?? this.visitedRoomIds.length + 1;
  }

  private getDisplayTotalRooms() {
    if (this.currentRoom.kind === 'boss') return this.getDisplayRoomNumber();
    return this.getDisplayRoomNumber() + this.countRemainingDisplayRooms(this.currentRoomIndex, new Set([this.currentRoomIndex]));
  }

  private countRemainingDisplayRooms(fromIndex: number, seen: Set<number>): number {
    const room = this.dungeonRoute[fromIndex];
    if (!room || room.kind === 'boss' || room.nextOptions.length === 0) return 0;

    const selectedTarget = room.selectedBranch;
    const targets = selectedTarget !== undefined ? [selectedTarget] : room.nextOptions;
    let best = 0;
    targets.forEach((targetIndex) => {
      if (seen.has(targetIndex)) return;
      const nextRoom = this.dungeonRoute[targetIndex];
      if (!nextRoom) return;
      const nextSeen = new Set(seen);
      nextSeen.add(targetIndex);
      best = Math.max(best, 1 + this.countRemainingDisplayRooms(targetIndex, nextSeen));
    });
    return best;
  }

  private getRoomDisplayName(room: RoomDef = this.currentRoom) {
    if (room.kind === 'treasure') return '封尘宝库';
    return room.name;
  }

  private getRoomTypeLabel(room: RoomDef = this.currentRoom) {
    if (room.kind === 'start') return '出生房';
    if (room.kind === 'battle') return '普通战斗房';
    if (room.kind === 'elite') return room.name.includes('精英') ? '精英战斗房' : '高级战斗房';
    if (room.kind === 'treasure') return '封尘宝库';
    if (room.kind === 'event') return '事件房';
    if (room.kind === 'boss') return '首领房';
    if (room.kind === 'rest') return '补给房';
    return room.name;
  }

  private createDefaultRelicState(): PlayerRelicState {
    return {
      moveSpeedMultiplier: 1,
      dashDamageMultiplier: 1,
      dashDistanceMultiplier: 1,
      bonusDamage: 0,
      potionHealBonus: 0,
      cooldownReduction: 0,
      relics: [],
      temporaryShield: 0,
      damageReductionFromMinions: 0,
      bossRoomHealUsed: false,
      dashCooldownRefunded: false
    };
  }

  private createDefaultEventStats(): EventRunStats {
    return {
      triggered: 0,
      negative: 0,
      combat: 0,
      poisoned: false,
      cursed: false
    };
  }

  private resetRunState() {
    this.unitHuds.forEach((hud) => {
      hud.name.destroy();
      hud.hpBg.destroy();
      hud.hpFill.destroy();
    });
    this.unitHuds.clear();
    this.currentRoomIndex = 0;
    this.dungeonRoute = this.generateDungeonRoute();
    this.visitedRoomIds = [];
    this.enteredRoomNumbers.clear();
    this.currentRoom = this.dungeonRoute[0];
    this.roomCleared = false;
    this.rewardTaken = false;
    this.runEnded = false;
    this.shieldUntil = 0;
    this.invincibleUntil = 0;
    this.skillCooldowns = { attack: 0, dashSlash: 0, shield: 0 };
    this.startedAt = Date.now();
    this.kills = 0;
    this.gold = 0;
    this.damageTaken = 0;
    this.skillUses = 0;
    this.eventChoiceCount = 0;
    this.rewardChoiceCount = 0;
    this.reachedBossPhaseTwo = false;
    this.itemsObtained = [];
    this.eventStats = this.createDefaultEventStats();
    this.eventsSeen.clear();
    this.poisonRooms = 0;
    this.rustRooms = 0;
    this.rustDefensePenalty = 0;
    this.slowRooms = 0;
    this.roomSpeedMultiplier = 1;
    this.eventCombatGoldReward = 0;
    this.eventCombatRareRewardChance = 0;
    this.relicState = this.createDefaultRelicState();
    this.epicRewardsTaken = 0;
    this.activeRewardChoices = [];
    this.rewardPanel?.destroy();
    this.rewardPanel = undefined;
    this.statusPanel?.destroy();
    this.statusPanel = undefined;
    this.lastFacing = new Phaser.Math.Vector2(1, 0);
    this.playerDirection = 'down';
    this.playerWalkFrame = 'idle';
    this.nextWalkFrameAt = 0;
    this.playerActionState = 'normal';
    this.dashHitEnemies.clear();
    this.dashDamageTotal = 0;
    this.dashLine = undefined;
    this.doorSprite = undefined;
    this.clearBranchDoors();
    this.shieldRing = undefined;
    this.bossBarBg = undefined;
    this.bossBarFill = undefined;
    this.bossBarText = undefined;
  }

  private createTextures() {
    this.createHunterTexture();
    this.createEnemyTexture('slime', 0x56d7b4, 0xbffff1, 'slime');
    this.createEnemyTexture('skeleton', 0xdedede, 0x7b8496, 'skeleton');
    this.createEnemyTexture('bat', 0x32224f, 0xb18cff, 'bat');
    this.createEnemyTexture('archer', 0x4356d8, 0xb8c5ff, 'archer');
    this.createEnemyTexture('boss', 0xff4f9b, 0x9ffff0, 'boss');
    this.createTileFallbacks();
    this.createTileTexture('bullet', 0x8ffcff, 0xffffff, 18);
    this.createTileTexture('spike', 0xff4f5f, 0xffd1d7, 4);
  }

  private createHunterTexture() {
    if (this.textures.exists('hunter')) return;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x102033).fillCircle(24, 24, 22);
    g.lineStyle(3, 0x8ffcff).strokeCircle(24, 24, 20);
    g.fillStyle(0x35e7c4).fillTriangle(24, 6, 9, 37, 39, 37);
    g.fillStyle(0xffffff).fillRect(22, 13, 4, 23);
    g.fillStyle(0xffe6ad).fillCircle(24, 21, 5);
    g.generateTexture('hunter', 48, 48);
    g.destroy();
  }

  private createEnemyTexture(key: string, fill: number, stroke: number, icon: EnemyKind) {
    if (this.textures.exists(key)) return;
    const size = icon === 'boss' ? 72 : 44;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(fill).fillRoundedRect(0, 0, size, size, icon === 'slime' ? 18 : 8);
    g.lineStyle(3, stroke).strokeRoundedRect(3, 3, size - 6, size - 6, icon === 'slime' ? 16 : 8);
    g.fillStyle(0xffffff, 0.92);
    if (icon === 'slime') g.fillCircle(size / 2, size / 2, 9);
    if (icon === 'skeleton') {
      g.fillCircle(size / 2, 16, 9);
      g.fillRect(size / 2 - 3, 24, 6, 14);
    }
    if (icon === 'bat') {
      g.fillTriangle(8, 22, 20, 12, 20, 32);
      g.fillTriangle(size - 8, 22, size - 20, 12, size - 20, 32);
      g.fillCircle(size / 2, 22, 7);
    }
    if (icon === 'archer') {
      g.lineStyle(4, 0xffffff).strokeCircle(size / 2, size / 2, 12);
      g.fillTriangle(size / 2 + 14, size / 2, size / 2 + 4, size / 2 - 6, size / 2 + 4, size / 2 + 6);
    }
    if (icon === 'boss') {
      g.fillStyle(0xffffff).fillTriangle(36, 7, 13, 56, 59, 56);
      g.lineStyle(5, 0x8ffcff).strokeCircle(36, 36, 18);
    }
    g.generateTexture(key, size, size);
    g.destroy();
  }

  private createTileFallbacks() {
    this.createTileTexture('dungeon-floor-fallback', 0x121f33, 0x21354f, 0);
    this.createTileTexture('dungeon-wall-fallback', 0x303c59, 0x5a6f98, 8);
    this.createTileTexture('dungeon-door_closed-fallback', 0x25364f, 0x60799f, 6);
    this.createTileTexture('dungeon-door_open-fallback', 0x28f1d0, 0xcffff7, 12);
    this.createTileTexture('dungeon-crystal_01-fallback', 0x36f0df, 0xcaffff, 4);
    this.createTileTexture('dungeon-crystal_02-fallback', 0x4aa8ff, 0xd8ffff, 4);
    this.createTileTexture('dungeon-chest_closed-fallback', 0xffb84d, 0xffffff, 4);
    this.createTileTexture('dungeon-chest_open-fallback', 0xffd47d, 0x8ffcff, 4);
    this.createTileTexture('dungeon-potion_hp-fallback', 0xff4f7b, 0xffffff, 12);
    this.createTileTexture('dungeon-attack_crystal-fallback', 0xff6538, 0xffe0b2, 4);
    this.createTileTexture('dungeon-defense_charm-fallback', 0x2b8cff, 0xd9ffff, 8);
  }

  private createTileTexture(key: string, fill: number, stroke: number, radius = 6) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(fill).fillRoundedRect(0, 0, 36, 36, radius);
    g.lineStyle(3, stroke).strokeRoundedRect(2, 2, 32, 32, radius);
    g.generateTexture(key, 36, 36);
    g.destroy();
  }

  private createPlayer() {
    this.player = this.physics.add.sprite(480, 330, this.hunterAssetKey('down')) as Fighter;
    this.player.setDepth(30).setDisplaySize(HUNTER_DISPLAY_SIZE, HUNTER_DISPLAY_SIZE).setCollideWorldBounds(true);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(30, 30, true);
    this.player.stats = {
      id: 'player',
      name: '遗迹猎人',
      kind: 'player',
      hp: 120,
      maxHp: 120,
      atk: 14,
      def: 4,
      speed: 175,
      range: 54,
      cooldown: 330,
      nextAttack: 0
    };
    this.playerWeaponVisual = this.add.graphics().setDepth(31);
    this.createUnitHud(this.player);
  }

  private loadRoom(index: number) {
    this.currentRoomIndex = index;
    this.currentRoom = this.dungeonRoute[index] ?? this.dungeonRoute[this.dungeonRoute.length - 1];
    if (!this.visitedRoomIds.includes(this.currentRoom.id)) {
      this.visitedRoomIds.push(this.currentRoom.id);
      this.enteredRoomNumbers.set(this.currentRoom.id, this.visitedRoomIds.length);
    }
    this.roomCleared = this.currentRoom.isCleared || (this.currentRoom.enemies.length === 0 && this.currentRoom.kind !== 'treasure' && this.currentRoom.kind !== 'event' && this.currentRoom.kind !== 'rest');
    this.rewardTaken = this.currentRoom.rewardClaimed;
    this.enemies.clear(true, true);
    this.bullets.clear(true, true);
    this.walls.clear(true, true);
    this.items.clear(true, true);
    this.clearEnemyHuds();
    this.doorTween?.stop();
    this.doorTween = undefined;
    this.clearBranchDoors();
    this.roomTitleToast?.destroy();
    this.roomTitleToast = undefined;
    this.children.list.filter((child) => child.getData?.('roomObj')).forEach((child) => child.destroy());
    if (this.currentRoom.kind === 'rest' && !this.currentRoom.rewardClaimed) this.currentRoom.isCleared = false;
    this.player.setPosition(170, 320);
    this.combatWaves = [];
    this.currentWaveIndex = 0;
    this.waveTransitionPending = false;
    this.waveToast?.destroy();
    this.waveToast = undefined;
    this.drawRoom();
    this.spawnInitialRoomEnemies();
    this.applyRoomEntryStatuses();
    this.applyRoomEntryRelics();
    this.showRoomTitle();
    this.updateDoor();
    if (this.currentRoom.kind === 'boss') this.sfx.play('bossEnter');
    if (this.currentRoom.kind === 'rest' && this.currentRoom.rewardClaimed) {
      this.openPortal('补给已使用。传送门已开启，按 E 前往下一房间。');
      return;
    }
    if (this.currentRoom.kind === 'event' && !this.currentRoom.eventResolved) this.time.delayedCall(420, () => this.openEventChoice());
    this.log(this.currentRoom.kind === 'start' ? '出生房安全。按 E 进入普通战斗房。' : `${this.getRoomDisplayName()}：${this.currentRoom.description}`);
  }

  private claimRestRoomSupply() {
    if (this.currentRoom.rewardClaimed) return;
    const lowHpBonus = this.player.stats.hp / this.player.stats.maxHp < 0.4 ? 10 : 0;
    const healAmount = 25 + lowHpBonus + this.relicState.potionHealBonus;
    const healed = this.healPlayer(healAmount);
    this.currentRoom.rewardClaimed = true;
    this.rewardTaken = true;
    this.sfx.play('pickup');
    this.showRestUsedEffect();
    this.showFloatingText(this.player.x, this.player.y - 72, healed > 0 ? `恢复 +${healed} HP` : '生命已满', '#8ffcff');
    this.openPortal(healed > 0 ? `补给房：源晶治疗台恢复了 ${healed} 点生命。` : '补给房：生命已满，补给已使用。');
  }

  private applyRoomEntryRelics() {
    if (this.currentRoomIndex > 0 && this.hasRelic('crystal-shield')) {
      this.relicState.temporaryShield = Math.max(this.relicState.temporaryShield, 10);
      this.showFloatingText(this.player.x, this.player.y - 70, '晶体护盾 Shield 10', '#8ffcff');
    }
    if (this.currentRoom.kind === 'boss' && this.hasRelic('spring-echo') && !this.relicState.bossRoomHealUsed) {
      this.relicState.bossRoomHealUsed = true;
      this.healPlayer(20);
      this.showFloatingText(this.player.x, this.player.y - 92, '源泉残响 HP +20', '#d6b4ff');
      this.log('源泉残响触发：进入 Boss 房回复 20 HP。');
    }
  }

  private applyRoomEntryStatuses() {
    this.roomSpeedMultiplier = 1;
    if (this.currentRoomIndex <= 0) return;

    if (this.poisonRooms > 0) {
      this.applySafeEventDamage(4, '中毒');
      this.poisonRooms = Math.max(0, this.poisonRooms - 1);
      this.showFloatingText(this.player.x, this.player.y - 92, '中毒 -4 HP', '#9bff7a');
      this.log(`中毒发作，损失 4 HP。剩余 ${this.poisonRooms} 房。`);
    }

    if (this.rustRooms > 0) {
      this.rustRooms = Math.max(0, this.rustRooms - 1);
      if (this.rustRooms === 0) this.restoreRustDefense();
    }

    if (this.slowRooms > 0) {
      this.roomSpeedMultiplier = 0.92;
      this.slowRooms = Math.max(0, this.slowRooms - 1);
      this.showFloatingText(this.player.x, this.player.y - 112, '碎石拖慢脚步', '#ffe6ad');
      this.log('碎石拖慢了你的脚步，本房间移动速度降低 8%。');
    }
  }

  public applySafeEventDamage(amount: number, reason: string) {
    const damage = Math.min(amount, Math.max(0, this.player.stats.hp - 1));
    this.player.stats.hp = Math.max(1, this.player.stats.hp - damage);
    this.damageTaken += damage;
    this.sfx.play('hurt');
    if (damage > 0) this.showDamageNumber(this.player.x, this.player.y - 34, damage, '#ff8aa8', true);
    this.cameras.main.shake(120, 0.004);
    this.log(`${reason}造成 ${damage} 点伤害。`);
    return damage;
  }

  public applyNextRoomSlow() {
    this.slowRooms = 1;
  }

  public applyPoison(rooms: number) {
    this.poisonRooms = Math.max(this.poisonRooms, rooms);
    this.eventStats.poisoned = true;
  }

  public applyRust(rooms: number) {
    this.rustRooms = Math.max(this.rustRooms, rooms);
    this.eventStats.cursed = true;
    if (this.rustDefensePenalty > 0) return;
    const penalty = Math.min(1, this.player.stats.def);
    this.rustDefensePenalty = penalty;
    this.player.stats.def = Math.max(0, this.player.stats.def - penalty);
  }

  private restoreRustDefense() {
    if (this.rustDefensePenalty <= 0) return;
    this.player.stats.def += this.rustDefensePenalty;
    this.rustDefensePenalty = 0;
    this.showFloatingText(this.player.x, this.player.y - 92, '锈蚀解除', '#8ffcff');
    this.log('锈蚀诅咒消退，护甲恢复。');
  }

  public cleanseNegativeStatuses() {
    const hadStatus = this.poisonRooms > 0 || this.rustRooms > 0 || this.rustDefensePenalty > 0;
    this.poisonRooms = 0;
    this.rustRooms = 0;
    this.restoreRustDefense();
    return hadStatus;
  }

  private drawRoom() {
    const bossRoom = this.currentRoom.kind === 'boss';
    const roomColor = bossRoom ? 0x12091d : 0x101a2b;
    const borderColor = bossRoom ? 0xff4f9b : 0x2b4665;
    this.add.rectangle(480, 320, bossRoom ? 780 : 720, bossRoom ? 450 : 410, roomColor).setStrokeStyle(3, borderColor).setData('roomObj', true).setDepth(0);
    const cols = bossRoom ? 20 : 18;
    const rows = bossRoom ? 11 : 10;
    const startX = 480 - (cols * 32) / 2 + 16;
    const startY = 320 - (rows * 32) / 2 + 16;
    for (let x = 0; x < cols; x += 1) {
      for (let y = 0; y < rows; y += 1) {
        this.add.image(startX + x * 32, startY + y * 32, this.assetKey('floor')).setDisplaySize(32, 32).setData('roomObj', true).setDepth(1);
      }
    }
    const left = bossRoom ? 80 : 128;
    const right = bossRoom ? 880 : 832;
    const top = bossRoom ? 80 : 128;
    const bottom = bossRoom ? 560 : 512;
    this.currentRoomBounds = new Phaser.Geom.Rectangle(left + 34, top + 34, right - left - 68, bottom - top - 68);
    const wallKey = this.assetKey('wall');
    for (let x = left; x <= right; x += 32) {
      this.walls.add(this.physics.add.staticSprite(x, top, wallKey).setDisplaySize(34, 34).setDepth(4));
      this.walls.add(this.physics.add.staticSprite(x, bottom, wallKey).setDisplaySize(34, 34).setDepth(4));
    }
    for (let y = top; y <= bottom; y += 32) {
      this.walls.add(this.physics.add.staticSprite(left, y, wallKey).setDisplaySize(34, 34).setDepth(4));
      this.walls.add(this.physics.add.staticSprite(right, y, wallKey).setDisplaySize(34, 34).setDepth(4));
    }
    this.addCrystalDecorations(bossRoom);
    this.doorSprite = this.add.image(right, 320, this.assetKey('door_closed')).setDisplaySize(46, 98).setData('roomObj', true).setDepth(6);
    if (this.currentRoom.reward === 'chest') this.items.add(this.physics.add.staticSprite(480, 320, this.assetKey(this.currentRoom.rewardClaimed ? 'chest_open' : 'chest_closed')).setDisplaySize(52, 52).setDepth(20).setData('item', 'chest'));
    if (this.currentRoom.reward === 'potion') this.items.add(this.physics.add.staticSprite(480, 320, this.assetKey('potion_hp')).setDisplaySize(44, 44).setDepth(20).setData('item', 'potion'));
    if (this.currentRoom.kind === 'rest') this.createRestSupplyObject();
    if (bossRoom) this.createBossBar();
    else this.destroyBossBar();
  }

  private createRestSupplyObject() {
    const used = this.currentRoom.rewardClaimed;
    const glow = this.add.circle(480, 328, 42, used ? 0x30495a : 0x35e7c4, used ? 0.08 : 0.18).setStrokeStyle(2, used ? 0x526879 : 0x8ffcff, used ? 0.35 : 0.9).setData('roomObj', true).setDepth(18);
    const altar = this.physics.add.staticSprite(480, 320, this.assetKey('crystal_01')).setDisplaySize(58, 62).setDepth(21).setData('item', 'rest');
    altar.setTint(used ? 0x5b6875 : 0xbaffff).setAlpha(used ? 0.55 : 1);
    this.items.add(altar);
    this.add.text(480, 266, used ? '源晶治疗台（已使用）' : '源晶治疗台', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: used ? '#7c91a8' : '#8ffcff',
      stroke: '#07101e',
      strokeThickness: 3
    }).setOrigin(0.5).setData('roomObj', true).setDepth(82);
    this.add.text(480, 286, used ? '已使用' : '按 E 使用', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: used ? '#7c91a8' : '#dff7ff',
      stroke: '#07101e',
      strokeThickness: 3
    }).setOrigin(0.5).setData('roomObj', true).setDepth(82);
    if (!used) this.tweens.add({ targets: glow, scale: 1.14, alpha: 0.08, yoyo: true, repeat: -1, duration: 820 });
  }

  private showRestUsedEffect() {
    this.items.getChildren().forEach((item) => {
      const sprite = item as Phaser.Physics.Arcade.Sprite;
      if (sprite.getData('item') === 'rest') sprite.setTint(0x5b6875).setAlpha(0.55);
    });
    this.add.text(480, 266, '源晶治疗台（已使用）', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#7c91a8',
      stroke: '#07101e',
      strokeThickness: 3
    }).setOrigin(0.5).setData('roomObj', true).setDepth(83);
    this.add.text(480, 286, '已使用', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#7c91a8',
      stroke: '#07101e',
      strokeThickness: 3
    }).setOrigin(0.5).setData('roomObj', true).setDepth(83);
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 * i) / 8;
      const mote = this.add.circle(480, 320, 4, 0x8ffcff, 0.78).setDepth(92);
      this.tweens.add({
        targets: mote,
        x: 480 + Math.cos(angle) * 46,
        y: 320 + Math.sin(angle) * 34,
        alpha: 0,
        duration: 620,
        onComplete: () => mote.destroy()
      });
    }
  }

  private clearBranchDoors() {
    this.branchDoorTweens.forEach((tween) => tween.stop());
    this.branchDoorSprites.forEach((sprite) => sprite.destroy());
    this.branchDoorLabels.forEach((label) => label.destroy());
    this.branchDoorTweens = [];
    this.branchDoorSprites = [];
    this.branchDoorLabels = [];
  }

  private addCrystalDecorations(bossRoom: boolean) {
    const points = bossRoom ? [[210, 170], [750, 180], [235, 470], [710, 450], [480, 150]] : [[245, 190], [690, 210], [300, 455], [710, 430]];
    points.forEach(([x, y], index) => {
      const crystal = this.add.image(x, y, this.assetKey(index % 2 ? 'crystal_02' : 'crystal_01')).setDisplaySize(38, 44).setData('roomObj', true).setDepth(3);
      this.tweens.add({ targets: crystal, alpha: 0.42, yoyo: true, repeat: -1, duration: 900 + index * 110 });
    });
  }

  private spawnInitialRoomEnemies() {
    if (this.currentRoom.kind === 'battle' || this.currentRoom.kind === 'elite') {
      this.combatWaves = this.buildCombatWaves();
      this.currentWaveIndex = 0;
      this.waveTransitionPending = false;
      this.spawnCurrentWave();
      return;
    }
    this.spawnEnemies(this.currentRoom.enemies);
  }

  private buildCombatWaves(): CombatWave[] {
    const depth = this.getDepthRatio();
    if (this.currentRoom.kind === 'battle') {
      const waveCount = depth < 0.42 ? 1 : depth < 0.72 ? Phaser.Math.Between(1, 2) : 2;
      const waves: CombatWave[] = [];
      waves.push(this.currentRoom.enemies.slice(0, Math.max(2, Math.min(3, this.currentRoom.enemies.length))));
      if (waveCount >= 2) waves.push(this.pickEnemyMix(depth, 2 + (depth > 0.75 ? 1 : 0)));
      return waves;
    }

    const trueEliteRoom = this.currentRoom.name.includes('精英') || this.currentRoom.name.includes('绮捐嫳');
    const waveCount = trueEliteRoom ? 2 : depth > 0.72 && Phaser.Math.Between(1, 100) <= 45 ? 3 : 2;
    const waves: CombatWave[] = [];
    waves.push(this.pickEnemyMix(depth, trueEliteRoom ? 3 : 2));
    if (waveCount >= 2) {
      waves.push(trueEliteRoom
        ? [this.pickEliteSpawn(), ...this.pickEnemyMix(depth, 1)]
        : [...this.pickEnemyMix(depth, 2), Phaser.Math.Between(1, 100) <= 50 ? 'archer' : 'bat']);
    }
    if (waveCount >= 3) waves.push([...this.pickEnemyMix(depth, 2), Phaser.Math.Between(1, 100) <= 55 ? 'archer' : 'bat']);
    return waves;
  }

  private pickEnemyMix(depth: number, count: number): EnemySpawnDef[] {
    const pool: EnemyKind[] = depth > 0.68
      ? ['slime', 'skeleton', 'skeleton', 'bat', 'archer']
      : depth > 0.42
        ? ['slime', 'slime', 'skeleton', 'bat', 'archer']
        : ['slime', 'slime', 'skeleton', 'bat'];
    return Array.from({ length: count }, () => Phaser.Utils.Array.GetRandom(pool));
  }

  private pickEliteSpawn(): EnemySpawnDef {
    const kind = Phaser.Utils.Array.GetRandom<EnemyKind>(['skeleton', 'bat', 'archer']);
    return { kind, elite: true };
  }

  private spawnCurrentWave() {
    const wave = this.combatWaves[this.currentWaveIndex] ?? [];
    if (wave.length === 0) return;
    this.spawnEnemies(wave);
    const waveText = `第 ${this.currentWaveIndex + 1} / ${this.combatWaves.length} 波`;
    this.showWaveToast(waveText);
    this.log(this.currentWaveIndex === 0 ? `第 1 波敌人出现。` : `源晶波动增强，第 ${this.currentWaveIndex + 1} 波敌人出现。`);
  }

  private scheduleNextWave() {
    if (this.waveTransitionPending) return;
    this.waveTransitionPending = true;
    this.log('源晶波动增强，下一波敌人出现！');
    this.showWaveToast('源晶波动增强，下一波敌人出现！');
    this.time.delayedCall(Phaser.Math.Between(800, 1200), () => {
      if (this.runEnded || this.flowState !== 'playing') return;
      this.currentWaveIndex += 1;
      this.waveTransitionPending = false;
      this.spawnCurrentWave();
    });
  }

  private handleRoomEnemiesCleared() {
    if (this.currentRoom.kind === 'battle' || this.currentRoom.kind === 'elite') {
      if (this.currentWaveIndex < this.combatWaves.length - 1) {
        this.scheduleNextWave();
        return;
      }
      this.log('所有敌人已清除。');
      this.openRewardChoice(this.currentRoom.kind);
      return;
    }
    if (this.currentRoom.kind === 'event') {
      this.grantEventCombatClearBonus();
      this.openPortal('伏击已清理。传送门已开启，按 E 进入下一房间。');
      return;
    }
    this.openPortal(`${this.getRoomDisplayName()} 已清理。右侧传送门已开启，按 E 进入下一房间。`);
  }

  private showWaveToast(message: string) {
    this.waveToast?.destroy();
    this.waveToast = this.add.text(480, 112, message, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#8ffcff',
      stroke: '#07101e',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(96).setAlpha(0);
    this.tweens.add({
      targets: this.waveToast,
      alpha: 1,
      y: 102,
      duration: 180,
      yoyo: true,
      hold: 760,
      onComplete: () => {
        this.waveToast?.destroy();
        this.waveToast = undefined;
      }
    });
  }

  private spawnEnemies(spawns: EnemySpawnDef[] = this.currentRoom.enemies) {
    spawns.forEach((spawn, index) => {
      const kind = typeof spawn === 'string' ? spawn : spawn.kind;
      const isElite = typeof spawn === 'object' && Boolean(spawn.elite);
      const base = ENEMIES[kind];
      const point = kind === 'boss' ? { x: 590, y: 320 } : this.getWaveSpawnPoint(kind, index);
      const { x, y } = point;
      const texture = kind === 'slime' ? this.slimeAssetKey('idle_1') : kind === 'skeleton' ? this.skeletonAssetKey('idle_1') : kind === 'bat' ? this.batAssetKey('idle_1') : kind === 'archer' ? this.runeArcherAssetKey('idle_1') : kind === 'boss' ? this.guardianAssetKey('idle_1') : kind;
      const enemy = this.physics.add.sprite(x, y, texture) as Fighter;
      enemy.setDepth(kind === 'boss' ? 25 : 24).setCollideWorldBounds(true);
      this.setEnemyDisplaySize(enemy, kind === 'boss' ? 112 : kind === 'skeleton' ? 42 : kind === 'bat' ? 42 : kind === 'archer' ? 42 : 38, kind === 'boss' ? 126 : kind === 'skeleton' ? 50 : kind === 'bat' ? 34 : kind === 'archer' ? 48 : 38);
      if (kind === 'boss') (enemy.body as Phaser.Physics.Arcade.Body).setSize(70, 70, true);
      if (kind === 'slime') enemy.setData('animFrame', 0).setData('nextAnimAt', 0);
      if (kind === 'skeleton') enemy.setData('animFrame', 0).setData('nextAnimAt', 0).setData('attackingVisual', false);
      if (kind === 'bat') enemy.setData('animFrame', 0).setData('nextAnimAt', 0).setData('attackingVisual', false).setData('floatPhase', Phaser.Math.FloatBetween(0, Math.PI * 2));
      if (kind === 'archer') enemy.setData('animFrame', 0).setData('nextAnimAt', 0).setData('castingVisual', false);
      if (kind === 'boss') {
        enemy
          .setData('animFrame', 0)
          .setData('nextAnimAt', 0)
          .setData('phase2Visual', false)
          .setData('actionVisual', false)
          .setData('closeSince', 0)
          .setData('nextShock', this.time.now + 2500)
          .setData('shockCharging', false)
          .setData('nextSpike', this.time.now + 2200);
      }
      const depthBoost = this.getEnemyDepthBoost();
      const eliteBoosted = this.currentRoom.kind === 'elite' && kind !== 'boss' && !isElite;
      const hpMultiplier = kind === 'boss' ? 1 : (isElite ? 2 : eliteBoosted ? 1.18 : 1) * depthBoost.hp;
      const atkMultiplier = kind === 'boss' ? 1 : (isElite ? 1.5 : eliteBoosted ? 1.12 : 1) * depthBoost.atk;
      const speedMultiplier = kind === 'boss' ? 1 : isElite ? 1.1 : 1;
      const cooldown = isElite ? Math.round(base.cooldown / 1.25) : eliteBoosted ? Math.round(base.cooldown / 1.08) : base.cooldown;
      const hp = Math.ceil(base.hp * hpMultiplier);
      const maxHp = Math.ceil(base.maxHp * hpMultiplier);
      const atk = Math.ceil(base.atk * atkMultiplier);
      if (isElite) {
        enemy.setData('elite', true).setTint(0xffe6ad);
        this.setEnemyDisplaySize(enemy, kind === 'skeleton' ? 48 : kind === 'bat' ? 48 : kind === 'archer' ? 48 : 44, kind === 'skeleton' ? 58 : kind === 'bat' ? 40 : kind === 'archer' ? 55 : 44);
      }
      enemy.stats = { ...base, name: isElite ? `精英${base.name}` : base.name, hp, maxHp, atk, speed: Math.round(base.speed * speedMultiplier), cooldown, id: `${kind}-${this.currentRoom.id}-${this.currentWaveIndex}-${index}-${this.time.now}`, nextAttack: this.time.now + (isElite ? 1300 : 1000) };
      this.enemies.add(enemy);
      this.createUnitHud(enemy);
    });
  }

  private getDepthRatio() {
    return Phaser.Math.Clamp(this.currentRoomIndex / Math.max(1, this.dungeonRoute.length - 1), 0, 1);
  }

  private getEnemyDepthBoost() {
    const ratio = this.getDepthRatio();
    return {
      hp: 1 + ratio * 0.18,
      atk: 1 + ratio * 0.12
    };
  }

  private getWaveSpawnPoint(kind: EnemyKind, index: number) {
    const margin = kind === 'archer' ? 46 : 32;
    const minDistance = kind === 'bat' ? 165 : 190;
    const candidates = [
      { x: this.currentRoomBounds.right - 90, y: this.currentRoomBounds.top + 70 },
      { x: this.currentRoomBounds.right - 120, y: this.currentRoomBounds.bottom - 70 },
      { x: this.currentRoomBounds.left + 310, y: this.currentRoomBounds.top + 92 },
      { x: this.currentRoomBounds.left + 360, y: this.currentRoomBounds.bottom - 92 },
      { x: this.currentRoomBounds.right - 210, y: this.currentRoomBounds.top + 190 },
      { x: this.currentRoomBounds.left + 440, y: this.currentRoomBounds.bottom - 150 }
    ].map((point) => this.getLegalPoint(point.x, point.y, margin));
    const rotated = candidates.slice(index % candidates.length).concat(candidates.slice(0, index % candidates.length));
    const point = rotated.find((candidate) => (
      Phaser.Math.Distance.Between(candidate.x, candidate.y, this.player.x, this.player.y) >= minDistance
      && (!this.doorSprite || Phaser.Math.Distance.Between(candidate.x, candidate.y, this.doorSprite.x, this.doorSprite.y) >= 92)
    ));
    if (point) return point;
    return this.getLegalPoint(this.currentRoomBounds.right - 120, this.currentRoomBounds.top + 80 + index * 56, margin);
  }

  private setEnemyDisplaySize(enemy: Fighter, width: number, height: number) {
    const eliteScale = enemy.getData('elite') ? 1.14 : 1;
    enemy.setDisplaySize(Math.round(width * eliteScale), Math.round(height * eliteScale));
  }

  private movePlayer(time: number) {
    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown || this.keys.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.keys.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.keys.S.isDown) vy += 1;
    const direction = new Phaser.Math.Vector2(vx, vy);
    if (direction.lengthSq() > 0) {
      direction.normalize();
      this.lastFacing.copy(direction);
      this.updatePlayerDirection(direction, time, true);
    } else {
      this.playerWalkFrame = 'idle';
      const idleKey = this.hunterAssetKey(this.playerDirection, 'idle');
      if (this.player.texture.key !== idleKey) {
        this.player.setTexture(idleKey).setDisplaySize(HUNTER_DISPLAY_SIZE, HUNTER_DISPLAY_SIZE);
        (this.player.body as Phaser.Physics.Arcade.Body).setSize(30, 30, true);
        if (this.hasGeneratedHunter(this.playerDirection, 'idle')) this.player.setRotation(0);
      }
    }
    const speed = this.player.stats.speed * this.selectedWeapon.moveSpeedMultiplier * this.relicState.moveSpeedMultiplier * this.roomSpeedMultiplier;
    this.player.setVelocity(direction.x * speed, direction.y * speed);
  }

  private updatePlayerDirection(direction: Phaser.Math.Vector2, time: number, moving: boolean) {
    const nextDirection: HunterDirection = Math.abs(direction.x) > Math.abs(direction.y)
      ? direction.x < 0 ? 'left' : 'right'
      : direction.y < 0 ? 'up' : 'down';
    let frame: HunterFrame = 'idle';
    if (moving) {
      if (time >= this.nextWalkFrameAt) {
        this.playerWalkFrame = this.playerWalkFrame === '1' ? '2' : '1';
        this.nextWalkFrameAt = time + 160;
      }
      frame = this.playerWalkFrame === 'idle' ? '1' : this.playerWalkFrame;
    } else {
      this.playerWalkFrame = 'idle';
    }
    const textureKey = this.hunterAssetKey(nextDirection, frame);
    if (nextDirection === this.playerDirection && this.player.texture.key === textureKey) return;
    this.playerDirection = nextDirection;
    this.player.setTexture(textureKey).setDisplaySize(HUNTER_DISPLAY_SIZE, HUNTER_DISPLAY_SIZE);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(30, 30, true);
    this.player.setRotation(this.hasGeneratedHunter(nextDirection, frame) ? 0 : Phaser.Math.Angle.Between(0, 0, direction.x, direction.y) + Math.PI / 2);
  }

  private updatePlayerWeaponVisual() {
    if (!this.playerWeaponVisual || !this.player?.active || !this.player.visible || this.flowState !== 'playing') {
      this.playerWeaponVisual?.clear();
      return;
    }
    const weapon = this.selectedWeapon ?? DEFAULT_WEAPON;
    const forward = this.lastFacing.lengthSq() > 0 ? this.lastFacing.clone().normalize() : new Phaser.Math.Vector2(1, 0);
    const side = new Phaser.Math.Vector2(-forward.y, forward.x);
    const origin = new Phaser.Math.Vector2(this.player.x, this.player.y).add(forward.clone().scale(10));
    const hand = origin.clone().add(side.clone().scale(8));
    const g = this.playerWeaponVisual.clear();
    g.lineStyle(3, 0x06101a, 0.9);

    if (weapon.id === 'heavy-blade') {
      const tip = hand.clone().add(forward.clone().scale(34));
      const left = hand.clone().add(forward.clone().scale(8)).add(side.clone().scale(8));
      const right = hand.clone().add(forward.clone().scale(8)).add(side.clone().scale(-8));
      g.fillStyle(0x9a6a38, 1).fillCircle(hand.x - forward.x * 5, hand.y - forward.y * 5, 4);
      g.fillStyle(0xffd28a, 0.96).fillTriangle(tip.x, tip.y, left.x, left.y, right.x, right.y);
      g.lineStyle(2, 0xfff1c8, 0.88).strokeTriangle(tip.x, tip.y, left.x, left.y, right.x, right.y);
      return;
    }

    if (weapon.id === 'spear') {
      const butt = origin.clone().add(forward.clone().scale(-17));
      const shaftEnd = origin.clone().add(forward.clone().scale(38));
      const tip = origin.clone().add(forward.clone().scale(48));
      g.lineStyle(4, 0x8b6944, 0.95).lineBetween(butt.x, butt.y, shaftEnd.x, shaftEnd.y);
      g.fillStyle(0x8ffcff, 0.96).fillTriangle(tip.x, tip.y, shaftEnd.x + side.x * 5, shaftEnd.y + side.y * 5, shaftEnd.x - side.x * 5, shaftEnd.y - side.y * 5);
      g.lineStyle(1, 0xeaffff, 0.88).strokeTriangle(tip.x, tip.y, shaftEnd.x + side.x * 5, shaftEnd.y + side.y * 5, shaftEnd.x - side.x * 5, shaftEnd.y - side.y * 5);
      return;
    }

    if (weapon.id === 'dual-daggers') {
      [-1, 1].forEach((multiplier) => {
        const base = origin.clone().add(side.clone().scale(12 * multiplier));
        const tip = base.clone().add(forward.clone().scale(24)).add(side.clone().scale(3 * multiplier));
        g.lineStyle(3, 0x45395d, 0.95).lineBetween(base.x, base.y, tip.x, tip.y);
        g.lineStyle(2, 0xf0d8ff, 0.96).lineBetween(base.x + side.x * 2 * multiplier, base.y + side.y * 2 * multiplier, tip.x, tip.y);
      });
      return;
    }

    const tip = hand.clone().add(forward.clone().scale(28));
    const guardA = hand.clone().add(side.clone().scale(8));
    const guardB = hand.clone().add(side.clone().scale(-8));
    g.lineStyle(4, 0xf5ffff, 0.95).lineBetween(hand.x, hand.y, tip.x, tip.y);
    g.lineStyle(3, 0x35e7c4, 0.8).lineBetween(guardA.x, guardA.y, guardB.x, guardB.y);
  }

  private normalAttack(time: number) {
    if (this.playerActionState === 'dashing' || this.playerActionState === 'dead') return;
    if (time < this.skillCooldowns.attack) return;
    const weapon = this.selectedWeapon ?? DEFAULT_WEAPON;
    this.playerActionState = 'attacking';
    this.skillCooldowns.attack = time + weapon.attackCooldown;
    this.sfx.play('swing');
    const rawDamage = Math.round((this.player.stats.atk + this.relicState.bonusDamage) * weapon.attackDamageMultiplier);
    if (weapon.id === 'dual-daggers') {
      this.showWeaponAttackEffect(weapon, 1);
      this.hitInArc(rawDamage, weapon.attackRange, '双匕第一段', 42, weapon.knockbackPower, 150, weapon.attackWidth);
      this.time.delayedCall(80, () => {
        if (!this.player.active || this.playerActionState === 'dead') return;
        this.sfx.play('swing');
        this.showWeaponAttackEffect(weapon, 2);
        this.hitInArc(rawDamage, weapon.attackRange * 0.96, '双匕第二段', 38, Math.round(weapon.knockbackPower * 0.65), 110, weapon.attackWidth);
      });
    } else {
      this.showWeaponAttackEffect(weapon);
      this.hitInArc(rawDamage, weapon.attackRange, '普通攻击', weapon.id === 'heavy-blade' ? 72 : 60, weapon.knockbackPower, 220, weapon.attackWidth);
    }
    this.time.delayedCall(Math.min(190, Math.round(weapon.attackCooldown * 0.45)), () => {
      if (this.playerActionState === 'attacking') this.playerActionState = 'normal';
    });
  }

  private dashSlash(time: number) {
    if (this.playerActionState === 'dashing' || this.playerActionState === 'dead') return;
    if (time < this.skillCooldowns.dashSlash) {
      this.log('冲刺斩还在冷却。');
      return;
    }
    const weapon = this.selectedWeapon ?? DEFAULT_WEAPON;
    this.skillCooldowns.dashSlash = time + this.getDashCooldownMs();
    this.skillUses += 1;
    this.sfx.play('swing');
    this.playerActionState = 'dashing';
    this.dashHitEnemies.clear();
    this.dashDamageTotal = 0;
    const startX = this.player.x;
    const startY = this.player.y;
    this.relicState.dashCooldownRefunded = false;
    const dashDistance = 140 * weapon.dashDistanceMultiplier * this.relicState.dashDistanceMultiplier;
    const target = this.getLegalPoint(startX + this.lastFacing.x * dashDistance, startY + this.lastFacing.y * dashDistance, 18);
    this.player.setVelocity(0, 0);
    this.showDashSlashTrail(startX, startY, target.x, target.y);
    for (let i = 0; i < 4; i += 1) this.time.delayedCall(i * 45, () => this.spawnDashTrail());
    this.tweens.add({
      targets: this.player,
      x: target.x,
      y: target.y,
      duration: 200,
      ease: 'Quad.easeOut',
      onUpdate: () => this.updateDashHits(),
      onComplete: () => this.finishDash()
    });
  }

  private activateShield(time: number) {
    if (this.playerActionState === 'dead') return;
    if (time < this.skillCooldowns.shield) {
      this.log('护盾还在冷却。');
      return;
    }
    this.skillCooldowns.shield = time + this.getShieldCooldownMs();
    this.shieldUntil = time + 3000;
    this.skillUses += 1;
    this.shieldRing?.destroy();
    this.shieldRing = this.add.circle(this.player.x, this.player.y, 38, 0x6dfcff, 0.12).setStrokeStyle(3, 0x8ffcff, 0.95).setDepth(29);
    this.tweens.add({ targets: this.shieldRing, scale: 1.18, alpha: 0.58, yoyo: true, repeat: -1, duration: 420 });
    this.player.setTint(0x9ffff0);
    this.time.delayedCall(3000, () => {
      if (this.player.active && this.time.now >= this.invincibleUntil) this.player.clearTint();
      this.shieldRing?.destroy();
      this.shieldRing = undefined;
    });
    this.log('护盾启动：3 秒内受到伤害减少 50%。');
  }

  private showWeaponAttackEffect(weapon: WeaponConfig, phase = 1) {
    if (weapon.id === 'dual-daggers') {
      this.showAttackArc(weapon.attackRange * (phase === 1 ? 1 : 0.94), weapon.attackColor, weapon.attackAlpha, 0.54, phase === 1 ? -22 : 22, 135, 3);
      return;
    }
    if (weapon.id === 'spear') {
      const start = new Phaser.Math.Vector2(this.player.x, this.player.y).add(this.lastFacing.clone().scale(18));
      const end = new Phaser.Math.Vector2(this.player.x, this.player.y).add(this.lastFacing.clone().scale(weapon.attackRange));
      const line = this.add.line(0, 0, start.x, start.y, end.x, end.y, weapon.attackColor, 0.5).setOrigin(0).setLineWidth(4).setDepth(28);
      const tip = this.add.circle(end.x, end.y, 6, 0xeaffff, 0.82).setDepth(28);
      this.tweens.add({ targets: [line, tip], alpha: 0, duration: 165, onComplete: () => { line.destroy(); tip.destroy(); } });
      return;
    }
    this.showAttackArc(weapon.attackRange, weapon.attackColor, weapon.attackAlpha, weapon.id === 'heavy-blade' ? 0.66 : 0.42, 0, weapon.id === 'heavy-blade' ? 245 : 190, weapon.id === 'heavy-blade' ? 8 : 4);
    if (weapon.id === 'heavy-blade') this.cameras.main.shake(70, 0.0025);
  }

  private showAttackArc(range: number, color: number, alpha: number, radiusScale = 0.42, angleOffset = 0, duration = 190, strokeWidth = 4) {
    const center = new Phaser.Math.Vector2(this.player.x, this.player.y).add(this.lastFacing.clone().scale(range * 0.36));
    const arc = this.add.arc(center.x, center.y, range * radiusScale, -42, 42, false, color, alpha).setStrokeStyle(strokeWidth, color, 0.9).setDepth(28);
    arc.setRotation(Phaser.Math.Angle.Between(0, 0, this.lastFacing.x, this.lastFacing.y) + Phaser.Math.DegToRad(angleOffset));
    this.tweens.add({ targets: arc, alpha: 0, scale: 1.18, duration, onComplete: () => arc.destroy() });
  }

  private spawnDashTrail() {
    if (!this.player.active) return;
    const trail = this.add.sprite(this.player.x, this.player.y, this.player.texture.key).setDisplaySize(HUNTER_DISPLAY_SIZE, HUNTER_DISPLAY_SIZE).setDepth(18).setAlpha(0.46).setTint(0x67d8ff).setRotation(this.player.rotation);
    this.tweens.add({ targets: trail, alpha: 0, scale: 0.72, duration: 260, onComplete: () => trail.destroy() });
  }

  private hitInArc(rawDamage: number, range: number, source: string, hitStopMs: number, knockbackDistance = 0, stunMs = 0, width = range * 0.58) {
    let hit = false;
    const knockedNames: string[] = [];
    this.enemies.getChildren().forEach((object) => {
      const enemy = object as Fighter;
      if (!enemy.active) return;
      const toEnemy = new Phaser.Math.Vector2(enemy.x - this.player.x, enemy.y - this.player.y);
      const forward = toEnemy.dot(this.lastFacing);
      const perpendicular = Math.abs(toEnemy.x * this.lastFacing.y - toEnemy.y * this.lastFacing.x);
      const enemyAllowance = enemy.stats.boss ? 34 : 18;
      if (forward >= 4 && forward <= range + enemyAllowance && perpendicular <= width + enemyAllowance) {
        this.damageEnemy(enemy, rawDamage);
        if (!enemy.stats.boss && knockbackDistance > 0) {
          this.knockbackEnemy(enemy, this.player.x, this.player.y, knockbackDistance, stunMs);
          knockedNames.push(enemy.stats.name);
        }
        hit = true;
      }
    });
    if (hit) {
      this.sfx.play('hit');
      this.startHitStop(hitStopMs);
    }
    if (knockedNames.length === 1) this.log(`${source}命中，击退了${knockedNames[0]}。`);
    else if (knockedNames.length > 1) this.log(`${source}命中，击退了 ${knockedNames.length} 个敌人。`);
    else this.log(hit ? `${source}命中敌人。` : `${source}挥空。`);
  }

  private startHitStop(durationMs: number) {
    if (this.hitStopActive || this.flowState !== 'playing') return;
    this.hitStopActive = true;
    this.pendingHitStopUntil = this.time.now + durationMs;
    this.physics.world.pause();
    this.tweens.pauseAll();
  }

  private endHitStop() {
    this.hitStopActive = false;
    if (this.flowState !== 'playing') return;
    this.physics.world.resume();
    this.tweens.resumeAll();
  }

  private getLegalPoint(x: number, y: number, padding = 18) {
    return {
      x: Phaser.Math.Clamp(x, this.currentRoomBounds.left + padding, this.currentRoomBounds.right - padding),
      y: Phaser.Math.Clamp(y, this.currentRoomBounds.top + padding, this.currentRoomBounds.bottom - padding)
    };
  }

  private getDashCooldownMs() {
    return Math.max(2200, Math.round(5000 * this.selectedWeapon.dashCooldownMultiplier * (1 - this.relicState.cooldownReduction)));
  }

  private getShieldCooldownMs() {
    return Math.max(5000, Math.round(8000 * (1 - this.relicState.cooldownReduction)));
  }

  private keepEnemyInsideRoom(enemy: Fighter, padding = 22) {
    const legal = this.getLegalPoint(enemy.x, enemy.y, padding);
    if (legal.x !== enemy.x || legal.y !== enemy.y) {
      enemy.setPosition(legal.x, legal.y);
      enemy.setVelocity(0, 0);
    }
    if (!enemy.stats.boss && this.doorSprite && Phaser.Math.Distance.Between(enemy.x, enemy.y, this.doorSprite.x, this.doorSprite.y) < 58) {
      enemy.setX(Math.min(enemy.x, this.currentRoomBounds.right - 74));
      if ((enemy.body as Phaser.Physics.Arcade.Body).velocity.x > 0) enemy.setVelocityX(0);
    }
  }

  private knockbackEnemy(enemy: Fighter, sourceX: number, sourceY: number, distance: number, stunMs: number) {
    if (!enemy.active || enemy.stats.boss || enemy.getData('dying')) return;
    const eliteControlScale = enemy.getData('elite') ? 0.58 : 1;
    const angle = Phaser.Math.Angle.Between(sourceX, sourceY, enemy.x, enemy.y);
    const target = this.getLegalPoint(enemy.x + Math.cos(angle) * distance * eliteControlScale, enemy.y + Math.sin(angle) * distance * eliteControlScale, 22);
    enemy.setData('stunUntil', this.time.now + stunMs * eliteControlScale);
    enemy.setData('attackCharging', false);
    enemy.setVelocity(0, 0);
    this.tweens.add({
      targets: enemy,
      x: target.x,
      y: target.y,
      duration: Math.min(150, stunMs),
      ease: 'Quad.easeOut'
    });
  }

  private showDashSlashTrail(startX: number, startY: number, endX: number, endY: number) {
    this.dashLine?.destroy();
    const weapon = this.selectedWeapon ?? DEFAULT_WEAPON;
    this.dashLine = this.add.line(0, 0, startX, startY, endX, endY, weapon.attackColor, 0.34).setOrigin(0).setLineWidth(weapon.id === 'heavy-blade' ? 12 : weapon.id === 'spear' ? 5 : 8).setDepth(27);
    this.tweens.add({
      targets: this.dashLine,
      alpha: 0,
      duration: 230,
      onComplete: () => {
        this.dashLine?.destroy();
        this.dashLine = undefined;
      }
    });
  }

  private updateDashHits() {
    if (this.playerActionState !== 'dashing') return;
    let hits = 0;
    this.enemies.getChildren().forEach((object) => {
      const enemy = object as Fighter;
      if (!enemy.active || enemy.getData('dying') || this.dashHitEnemies.has(enemy.stats.id)) return;
      const weapon = this.selectedWeapon ?? DEFAULT_WEAPON;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) > (enemy.stats.boss ? Math.max(72, weapon.dashHitRadius + 28) : weapon.dashHitRadius)) return;
      this.dashHitEnemies.add(enemy.stats.id);
      const rawDamage = Math.round((this.player.stats.atk + this.relicState.bonusDamage) * 1.5 * weapon.dashDamageMultiplier * this.relicState.dashDamageMultiplier);
      this.dashDamageTotal += Math.max(1, rawDamage - enemy.stats.def);
      this.damageEnemy(enemy, rawDamage, true);
      if (this.hasRelic('echo-core') && !this.relicState.dashCooldownRefunded) {
        this.skillCooldowns.dashSlash = Math.max(this.time.now, this.skillCooldowns.dashSlash - 1000);
        this.relicState.dashCooldownRefunded = true;
        this.showFloatingText(this.player.x, this.player.y - 64, '回响核心 -1s', '#d9b8ff');
      }
      if (!enemy.stats.boss) this.knockbackEnemy(enemy, this.player.x - this.lastFacing.x * 24, this.player.y - this.lastFacing.y * 24, 62 * (weapon.id === 'heavy-blade' ? 1.2 : weapon.id === 'dual-daggers' ? 0.8 : 1), 320);
      else this.startHitStop(95);
      hits += 1;
    });
    if (hits === 1) this.log(`冲刺斩贯穿敌人，造成 ${this.dashDamageTotal} 点伤害。`);
    if (hits > 1) this.log(`冲刺斩命中 ${hits} 个敌人。`);
  }

  private finishDash() {
    this.player.setVelocity(0, 0);
    const legal = this.getLegalPoint(this.player.x, this.player.y, 18);
    this.player.setPosition(legal.x, legal.y);
    const boss = this.enemies.getChildren().find((enemy) => (enemy as Fighter).active && (enemy as Fighter).stats.boss) as Fighter | undefined;
    if (boss && Phaser.Math.Distance.Between(this.player.x, this.player.y, boss.x, boss.y) < 58) {
      this.knockbackPlayerFrom(boss.x, boss.y, 38);
    }
    if (this.dashHitEnemies.size > 0) this.log(`冲刺斩命中 ${this.dashHitEnemies.size} 个敌人，共造成 ${this.dashDamageTotal} 点伤害。`);
    else this.log('冲刺斩掠过地面。');
    this.dashHitEnemies.clear();
    if (this.playerActionState === 'dashing') this.playerActionState = 'normal';
  }

  private updateEnemies(time: number) {
    this.enemies.getChildren().forEach((object) => {
      const enemy = object as Fighter;
      if (!enemy.active || enemy.getData('dying')) return;
      if (enemy.getData('attackCharging')) {
        enemy.setVelocity(0, 0);
        this.keepEnemyInsideRoom(enemy);
        return;
      }
      if (!enemy.stats.boss && time < Number(enemy.getData('stunUntil') ?? 0)) {
        enemy.setVelocity(0, 0);
        this.keepEnemyInsideRoom(enemy);
        return;
      }
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      const phaseTwo = Boolean(enemy.stats.boss && enemy.stats.hp / enemy.stats.maxHp < 0.5);
      if (phaseTwo) this.reachedBossPhaseTwo = true;
      const cooldown = enemy.stats.boss
        ? phaseTwo ? enemy.stats.cooldown / 1.35 : enemy.stats.cooldown * 0.9
        : phaseTwo ? enemy.stats.cooldown / 1.3 : enemy.stats.cooldown;
      if (enemy.stats.kind === 'slime') this.updateSlimeAnimation(enemy, time);
      if (enemy.stats.kind === 'skeleton') this.updateSkeletonAnimation(enemy, time, distance);
      if (enemy.stats.kind === 'bat') this.updateBatAnimation(enemy, time, distance);
      if (enemy.stats.kind === 'archer') this.updateRuneArcherAnimation(enemy, time);

      if (enemy.stats.boss) {
        this.updateGuardianAnimation(enemy, time, distance, phaseTwo);
        this.updateBoss(enemy, distance, time, cooldown, phaseTwo);
        return;
      }

      if (enemy.stats.ranged) {
        if (distance > enemy.stats.range) this.physics.moveToObject(enemy, this.player, enemy.stats.speed);
        else if (distance < enemy.stats.range * 0.72) this.physics.moveToObject(enemy, this.player, -enemy.stats.speed * 1.08);
        else enemy.setVelocity(0, 0);
        if (time >= enemy.stats.nextAttack) {
          enemy.stats.nextAttack = time + cooldown;
          if (enemy.stats.kind === 'archer') this.startRuneArcherAttack(enemy);
          else this.fireEnemyProjectile(enemy, false);
        }
        this.keepEnemyInsideRoom(enemy);
        return;
      }

      if (enemy.stats.kind === 'skeleton') {
        const meleeAttackRange = enemy.stats.range + 24;
        if (distance > meleeAttackRange) {
          this.physics.moveToObject(enemy, this.player, enemy.stats.speed);
        } else {
          enemy.setVelocity(0, 0);
          if (time >= enemy.stats.nextAttack) {
            this.startSkeletonAttack(enemy);
          }
        }
        this.keepEnemyInsideRoom(enemy);
        return;
      }

      if (enemy.stats.kind === 'bat') {
        if (distance > enemy.stats.range + 26) this.physics.moveToObject(enemy, this.player, enemy.stats.speed);
        else enemy.setVelocity(0, 0);
      } else {
        if (distance > enemy.stats.range + 10) this.physics.moveToObject(enemy, this.player, enemy.stats.speed);
        else enemy.setVelocity(0, 0);
      }
      if (distance <= enemy.stats.range + 18 && time >= enemy.stats.nextAttack) {
        enemy.stats.nextAttack = time + cooldown;
        if (enemy.stats.kind === 'slime') this.startSlimeAttack(enemy);
        else if (enemy.stats.kind === 'bat') this.startBatDive(enemy);
        else this.damagePlayer(enemy.stats.atk, enemy.stats.name, { minionDamage: true });
      }
      this.keepEnemyInsideRoom(enemy);
    });
  }

  private startSlimeAttack(enemy: Fighter) {
    if (enemy.getData('attackCharging')) return;
    enemy.setData('attackCharging', true);
    enemy.setVelocity(0, 0);
    enemy.setTint(0xbffff1);
    this.tweens.add({ targets: enemy, scaleX: enemy.scaleX * 1.16, scaleY: enemy.scaleY * 1.12, yoyo: true, duration: 125 });
    this.time.delayedCall(250, () => {
      if (!enemy.active || enemy.getData('dying')) return;
      enemy.clearTint();
      const hit = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) <= enemy.stats.range + 22;
      if (hit) this.damagePlayer(enemy.stats.atk, '晶化史莱姆撞击', { shakeDuration: 125, shakeIntensity: 0.005, minionDamage: true });
      enemy.setData('stunUntil', this.time.now + 180);
      this.time.delayedCall(180, () => enemy.active && enemy.setData('attackCharging', false));
    });
  }

  private startSkeletonAttack(enemy: Fighter) {
    if (enemy.getData('attackCharging')) return;
    enemy.setData('attackCharging', true);
    enemy.setVelocity(0, 0);
    enemy.setTexture(this.skeletonAssetKey('attack'));
    this.setEnemyDisplaySize(enemy, 44, 52);
    enemy.setTint(0xf4f0df);
    this.time.delayedCall(300, () => {
      if (!enemy.active || enemy.getData('dying')) return;
      enemy.clearTint();
      this.showSkeletonAttack(enemy);
      const hit = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) <= enemy.stats.range + 24;
      if (hit) this.damagePlayer(enemy.stats.atk, '骷髅守卫挥砍', { shakeDuration: 135, shakeIntensity: 0.006, minionDamage: true });
      this.time.delayedCall(220, () => {
        if (!enemy.active || enemy.getData('dying')) return;
        enemy.stats.nextAttack = this.time.now + enemy.stats.cooldown;
        enemy.setData('attackCharging', false);
      });
    });
  }

  private startBatDive(enemy: Fighter) {
    if (enemy.getData('attackCharging')) return;
    enemy.setData('attackCharging', true);
    enemy.setVelocity(0, 0);
    enemy.setTint(0xd68cff);
    const angleAway = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
    const retreat = this.getLegalPoint(enemy.x + Math.cos(angleAway) * 28, enemy.y + Math.sin(angleAway) * 28, 22);
    this.tweens.add({ targets: enemy, x: retreat.x, y: retreat.y, duration: 120, ease: 'Quad.easeOut' });
    this.time.delayedCall(220, () => {
      if (!enemy.active || enemy.getData('dying')) return;
      enemy.clearTint();
      this.showBatAttack(enemy);
      const diveAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      const diveTarget = this.getLegalPoint(enemy.x + Math.cos(diveAngle) * 92, enemy.y + Math.sin(diveAngle) * 92, 22);
      this.tweens.add({
        targets: enemy,
        x: diveTarget.x,
        y: diveTarget.y,
        duration: 150,
        ease: 'Quad.easeIn',
        onComplete: () => {
          if (!enemy.active || enemy.getData('dying')) return;
          const hit = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) <= enemy.stats.range + 26;
          if (hit) this.damagePlayer(enemy.stats.atk, '暗影蝙蝠俯冲', { shakeDuration: 130, shakeIntensity: 0.006, minionDamage: true });
          const exit = this.getLegalPoint(enemy.x - Math.cos(diveAngle) * 42, enemy.y - Math.sin(diveAngle) * 42, 22);
          this.tweens.add({
            targets: enemy,
            x: exit.x,
            y: exit.y,
            duration: 130,
            ease: 'Quad.easeOut',
            onComplete: () => {
              if (!enemy.active || enemy.getData('dying')) return;
              enemy.setData('stunUntil', this.time.now + 120);
              enemy.setData('attackCharging', false);
            }
          });
        }
      });
      if (false) {
      const hit = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) <= enemy.stats.range + 24;
      if (hit) {
        this.damagePlayer(enemy.stats.atk, '暗影蝙蝠俯冲', { shakeDuration: 130, shakeIntensity: 0.006, minionDamage: true });
        this.knockbackEnemy(enemy, this.player.x, this.player.y, 36, 180);
      }
      this.time.delayedCall(180, () => enemy.active && enemy.setData('attackCharging', false));
      }
    });
  }

  private startRuneArcherAttack(enemy: Fighter) {
    if (enemy.getData('attackCharging')) return;
    enemy.setData('attackCharging', true);
    enemy.setVelocity(0, 0);
    this.showRuneArcherCast(enemy);
    this.time.delayedCall(400, () => {
      if (!enemy.active || enemy.getData('dying')) return;
      this.fireEnemyProjectile(enemy, false);
      this.time.delayedCall(160, () => enemy.active && enemy.setData('attackCharging', false));
    });
  }

  private updateSlimeAnimation(enemy: Fighter, time: number) {
    if (time < Number(enemy.getData('nextAnimAt') ?? 0)) return;
    const moving = Math.abs(enemy.body?.velocity.x ?? 0) + Math.abs(enemy.body?.velocity.y ?? 0) > 10;
    const frameIndex = Number(enemy.getData('animFrame') ?? 0) === 0 ? 1 : 0;
    enemy.setData('animFrame', frameIndex);
    enemy.setData('nextAnimAt', time + (moving ? 180 : 360));
    const frame: SlimeFrame = moving ? frameIndex === 0 ? 'move_1' : 'move_2' : frameIndex === 0 ? 'idle_1' : 'idle_2';
    enemy.setTexture(this.slimeAssetKey(frame));
    this.setEnemyDisplaySize(enemy, 38, moving ? 40 : 38);
    if (!this.hasGeneratedSlime(frame)) enemy.setRotation(0);
  }

  private updateSkeletonAnimation(enemy: Fighter, time: number, distance: number) {
    if (enemy.getData('attackingVisual')) return;
    if (time < Number(enemy.getData('nextAnimAt') ?? 0)) return;
    const moving = distance > enemy.stats.range + 18 && (Math.abs(enemy.body?.velocity.x ?? 0) + Math.abs(enemy.body?.velocity.y ?? 0) > 10);
    const frameIndex = Number(enemy.getData('animFrame') ?? 0) === 0 ? 1 : 0;
    enemy.setData('animFrame', frameIndex);
    enemy.setData('nextAnimAt', time + (moving ? 210 : 430));
    const frame: SkeletonFrame = moving ? frameIndex === 0 ? 'walk_1' : 'walk_2' : frameIndex === 0 ? 'idle_1' : 'idle_2';
    enemy.setTexture(this.skeletonAssetKey(frame));
    this.setEnemyDisplaySize(enemy, 42, 50);
    if (!this.hasGeneratedSkeleton(frame)) enemy.setRotation(0);
  }

  private showSkeletonAttack(enemy: Fighter) {
    enemy.setData('attackingVisual', true);
    enemy.setTexture(this.skeletonAssetKey('attack'));
    this.setEnemyDisplaySize(enemy, 44, 52);
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    const slashX = enemy.x + Math.cos(angle) * 30;
    const slashY = enemy.y + Math.sin(angle) * 30;
    const slash = this.add.arc(slashX, slashY, 22, -50, 50, false, 0xdbe7ff, 0.28).setStrokeStyle(4, 0xe9f2ff, 0.78).setDepth(27);
    slash.setRotation(angle);
    this.tweens.add({ targets: slash, alpha: 0, scale: 1.12, duration: 160, onComplete: () => slash.destroy() });
    this.time.delayedCall(180, () => {
      if (!enemy.active || enemy.getData('dying')) return;
      enemy.setData('attackingVisual', false);
      enemy.setTexture(this.skeletonAssetKey('idle_1'));
      this.setEnemyDisplaySize(enemy, 42, 50);
    });
  }

  private updateBatAnimation(enemy: Fighter, time: number, distance: number) {
    const floatOffset = Math.sin(time / 120 + Number(enemy.getData('floatPhase') ?? 0)) * 0.045;
    enemy.setOrigin(0.5, 0.5 + floatOffset);
    if (enemy.getData('attackingVisual')) return;
    if (time < Number(enemy.getData('nextAnimAt') ?? 0)) return;
    const moving = distance > enemy.stats.range + 18 && (Math.abs(enemy.body?.velocity.x ?? 0) + Math.abs(enemy.body?.velocity.y ?? 0) > 10);
    const frameIndex = Number(enemy.getData('animFrame') ?? 0) === 0 ? 1 : 0;
    enemy.setData('animFrame', frameIndex);
    enemy.setData('nextAnimAt', time + (moving ? 115 : 280));
    const frame: BatFrame = moving ? frameIndex === 0 ? 'fly_1' : 'fly_2' : frameIndex === 0 ? 'idle_1' : 'idle_2';
    enemy.setTexture(this.batAssetKey(frame));
    this.setEnemyDisplaySize(enemy, 42, 34);
    if (!this.hasGeneratedBat(frame)) enemy.setRotation(0);
  }

  private showBatAttack(enemy: Fighter) {
    enemy.setData('attackingVisual', true);
    enemy.setTexture(this.batAssetKey('attack'));
    this.setEnemyDisplaySize(enemy, 44, 36);
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    const x = enemy.x + Math.cos(angle) * 27;
    const y = enemy.y + Math.sin(angle) * 27;
    const claw = this.add.arc(x, y, 20, -55, 55, false, 0xb65cff, 0.32).setStrokeStyle(4, 0xd68cff, 0.78).setDepth(27);
    claw.setRotation(angle);
    const shadow = this.add.ellipse(enemy.x - Math.cos(angle) * 12, enemy.y - Math.sin(angle) * 12, 38, 18, 0x4b1d6b, 0.22).setDepth(23);
    this.tweens.add({ targets: claw, alpha: 0, scale: 1.16, duration: 140, onComplete: () => claw.destroy() });
    this.tweens.add({ targets: shadow, alpha: 0, duration: 180, onComplete: () => shadow.destroy() });
    this.time.delayedCall(150, () => {
      if (!enemy.active || enemy.getData('dying')) return;
      enemy.setData('attackingVisual', false);
      enemy.setTexture(this.batAssetKey('idle_1'));
      this.setEnemyDisplaySize(enemy, 42, 34);
    });
  }

  private updateRuneArcherAnimation(enemy: Fighter, time: number) {
    if (enemy.getData('castingVisual')) return;
    if (time < Number(enemy.getData('nextAnimAt') ?? 0)) return;
    const frameIndex = Number(enemy.getData('animFrame') ?? 0) === 0 ? 1 : 0;
    enemy.setData('animFrame', frameIndex);
    enemy.setData('nextAnimAt', time + 430);
    const frame: RuneArcherFrame = frameIndex === 0 ? 'idle_1' : 'idle_2';
    enemy.setTexture(this.runeArcherAssetKey(frame));
    this.setEnemyDisplaySize(enemy, 42, 48);
    if (!this.hasGeneratedRuneArcher(frame)) enemy.setRotation(0);
  }

  private showRuneArcherCast(enemy: Fighter) {
    enemy.setData('castingVisual', true);
    enemy.setTexture(this.runeArcherAssetKey('cast_1'));
    this.setEnemyDisplaySize(enemy, 42, 48);
    const ring = this.add.circle(enemy.x + 16, enemy.y - 4, 18, 0x615bff, 0.12).setStrokeStyle(2, 0x8ffcff, 0.78).setDepth(27);
    this.tweens.add({ targets: ring, scale: 1.56, alpha: 0, duration: 400, onComplete: () => ring.destroy() });
    this.time.delayedCall(90, () => {
      if (enemy.active && !enemy.getData('dying')) {
        enemy.setTexture(this.runeArcherAssetKey('cast_2'));
        this.setEnemyDisplaySize(enemy, 42, 48);
      }
    });
    this.time.delayedCall(170, () => {
      if (enemy.active && !enemy.getData('dying')) {
        enemy.setTexture(this.runeArcherAssetKey('attack'));
        this.setEnemyDisplaySize(enemy, 44, 50);
      }
    });
    this.time.delayedCall(300, () => {
      if (!enemy.active || enemy.getData('dying')) return;
      enemy.setData('castingVisual', false);
      enemy.setTexture(this.runeArcherAssetKey('idle_1'));
      this.setEnemyDisplaySize(enemy, 42, 48);
    });
  }

  private updateGuardianAnimation(enemy: Fighter, time: number, distance: number, phaseTwo: boolean) {
    if (phaseTwo && !enemy.getData('phase2Visual')) {
      enemy.setData('phase2Visual', true);
      this.cameras.main.shake(260, 0.008);
      this.sfx.play('bossPhase');
      this.log('晶核守卫的源晶开始暴走！');
      const burst = this.add.circle(enemy.x, enemy.y, 42, 0xff4fa3, 0.16).setStrokeStyle(4, 0xffb3dc, 0.86).setDepth(27);
      this.tweens.add({ targets: burst, scale: 2.1, alpha: 0, duration: 520, onComplete: () => burst.destroy() });
    }
    if (enemy.getData('actionVisual')) return;
    if (time < Number(enemy.getData('nextAnimAt') ?? 0)) return;
    const moving = distance > 92 && (Math.abs(enemy.body?.velocity.x ?? 0) + Math.abs(enemy.body?.velocity.y ?? 0) > 10);
    const frameIndex = Number(enemy.getData('animFrame') ?? 0) === 0 ? 1 : 0;
    enemy.setData('animFrame', frameIndex);
    enemy.setData('nextAnimAt', time + (moving ? 260 : 520));
    const frame: GuardianFrame = phaseTwo
      ? frameIndex === 0 ? 'phase2_idle_1' : 'phase2_idle_2'
      : moving ? frameIndex === 0 ? 'walk_1' : 'walk_2' : frameIndex === 0 ? 'idle_1' : 'idle_2';
    enemy.setTexture(this.guardianAssetKey(frame)).setDisplaySize(112, 126);
    (enemy.body as Phaser.Physics.Arcade.Body).setSize(70, 70, true);
    if (!this.hasGeneratedGuardian(frame)) enemy.setRotation(0);
  }

  private updateBoss(enemy: Fighter, distance: number, time: number, cooldown: number, phaseTwo: boolean) {
    this.updateBossShock(enemy, distance, time, phaseTwo);
    if (enemy.getData('shockCharging')) {
      enemy.setVelocity(0, 0);
      return;
    }
    if (distance > 92) this.physics.moveToObject(enemy, this.player, enemy.stats.speed);
    else if (distance < 72) this.physics.moveToObject(enemy, this.player, -enemy.stats.speed * 0.7);
    else enemy.setVelocity(0, 0);

    if (time < enemy.stats.nextAttack) return;
    enemy.stats.nextAttack = time + cooldown;
    if (distance <= 92) this.startBossMelee(enemy, phaseTwo);
    this.fireEnemyProjectile(enemy, phaseTwo);
  }

  private updateBossShock(enemy: Fighter, distance: number, time: number, phaseTwo: boolean) {
    if (enemy.getData('shockCharging')) return;
    const triggerDistance = phaseTwo ? 88 : 80;
    if (distance > triggerDistance) {
      enemy.setData('closeSince', 0);
      return;
    }
    const closeSince = Number(enemy.getData('closeSince') ?? 0) || time;
    enemy.setData('closeSince', closeSince);
    if (time - closeSince < (phaseTwo ? 1200 : 1500)) return;
    if (time < Number(enemy.getData('nextShock') ?? 0)) return;
    this.startBossShock(enemy, phaseTwo);
  }

  private startBossShock(enemy: Fighter, phaseTwo: boolean) {
    enemy.setData('shockCharging', true);
    enemy.setData('nextShock', this.time.now + (phaseTwo ? 4000 : 5000));
    enemy.setData('closeSince', 0);
    const radius = phaseTwo ? 108 : 96;
    const warning = this.add.circle(enemy.x, enemy.y, radius, phaseTwo ? 0xff3f98 : 0x42cfff, 0.12).setStrokeStyle(4, phaseTwo ? 0xff8ac6 : 0x9fffff, 0.9).setDepth(23);
    this.tweens.add({ targets: warning, scale: 1.1, alpha: 0.3, yoyo: true, repeat: 2, duration: 190 });
    this.log('晶核守卫正在蓄积晶核震荡，快拉开距离！');
    this.time.delayedCall(600, () => {
      warning.destroy();
      enemy.setData('shockCharging', false);
      if (!enemy.active || this.runEnded) return;
      const burst = this.add.circle(enemy.x, enemy.y, radius, phaseTwo ? 0xff4fa3 : 0x67d8ff, 0.18).setStrokeStyle(5, phaseTwo ? 0xffd2eb : 0xd8ffff, 0.86).setDepth(27);
      this.tweens.add({ targets: burst, scale: 1.35, alpha: 0, duration: 300, onComplete: () => burst.destroy() });
      if (Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) <= radius) {
        const damage = phaseTwo ? BOSS_SKILL_DAMAGE.phase2.shock : BOSS_SKILL_DAMAGE.phase1.shock;
        const damaged = this.damagePlayer(damage, '晶核震荡', {
          minDamageRatio: 0.7,
          invincibleMs: 600,
          shakeDuration: 230,
          shakeIntensity: 0.01,
          emphasized: true
        });
        if (damaged) this.knockbackPlayerFrom(enemy.x, enemy.y, phaseTwo ? 78 : 68);
      }
    });
  }

  private startBossMelee(enemy: Fighter, phaseTwo: boolean) {
    if (enemy.getData('meleeCharging')) return;
    enemy.setData('meleeCharging', true);
    enemy.setData('actionVisual', true);
    enemy.setTexture(this.guardianAssetKey(phaseTwo ? 'phase2_melee' : 'melee')).setDisplaySize(118, 132);
    const warning = this.add.circle(this.player.x, this.player.y, 46, 0xff4f7b, 0.16).setStrokeStyle(3, 0xff9cab).setDepth(22);
    this.time.delayedCall(520, () => {
      warning.destroy();
      enemy.setData('meleeCharging', false);
      if (!enemy.active || this.runEnded) return;
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      const wave = this.add.arc(enemy.x + Math.cos(angle) * 56, enemy.y + Math.sin(angle) * 56, 44, -45, 45, false, phaseTwo ? 0xff6db8 : 0x8ffcff, 0.24).setStrokeStyle(6, phaseTwo ? 0xffb3dc : 0xd8ffff, 0.74).setDepth(27);
      wave.setRotation(angle);
      this.tweens.add({ targets: wave, alpha: 0, scale: 1.22, duration: 220, onComplete: () => wave.destroy() });
      if (Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) <= 104) {
        const damaged = this.damagePlayer(phaseTwo ? BOSS_SKILL_DAMAGE.phase2.melee : BOSS_SKILL_DAMAGE.phase1.melee, '晶核守卫重击', {
          minDamageRatio: 0.7,
          invincibleMs: 600,
          shakeDuration: 190,
          shakeIntensity: 0.008,
          emphasized: true
        });
        if (damaged) this.knockbackPlayerFrom(enemy.x, enemy.y, 56);
      }
      this.time.delayedCall(150, () => {
        if (!enemy.active || enemy.getData('dying')) return;
        enemy.setData('actionVisual', false);
        enemy.setTexture(this.guardianAssetKey(phaseTwo ? 'phase2_idle_1' : 'idle_1')).setDisplaySize(112, 126);
      });
    });
  }

  private fireEnemyProjectile(enemy: Fighter, spread: boolean) {
    if (!enemy.active || this.runEnded) return;
    const shots = spread ? [-12, 0, 12] : enemy.getData('elite') && enemy.stats.kind === 'archer' ? [-7, 7] : [0];
    shots.forEach((offset) => {
      const isRuneProjectile = enemy.stats.kind === 'archer';
      const isBossProjectile = Boolean(enemy.stats.boss);
      if (isBossProjectile) {
        enemy.setData('actionVisual', true);
        const phaseTwo = enemy.stats.hp / enemy.stats.maxHp < 0.5;
        enemy.setTexture(this.guardianAssetKey(phaseTwo ? 'phase2_shoot' : 'shoot')).setDisplaySize(116, 130);
        this.time.delayedCall(220, () => {
          if (!enemy.active || enemy.getData('dying')) return;
          enemy.setData('actionVisual', false);
        });
      }
      const bullet = this.physics.add.sprite(enemy.x, enemy.y, isBossProjectile ? this.guardianProjectileKey() : isRuneProjectile ? this.runeProjectileKey() : 'bullet');
      bullet.setDepth(26).setDisplaySize(enemy.stats.boss ? 22 : 16, enemy.stats.boss ? 22 : 16);
      const phaseTwo = isBossProjectile && enemy.stats.hp / enemy.stats.maxHp < 0.5;
      bullet.setData('damage', isBossProjectile ? phaseTwo ? BOSS_SKILL_DAMAGE.phase2.projectile : BOSS_SKILL_DAMAGE.phase1.projectile : enemy.stats.atk);
      bullet.setData('owner', 'enemy');
      bullet.setData('handled', false);
      bullet.setData('runeProjectile', isRuneProjectile);
      bullet.setData('guardianProjectile', isBossProjectile);
      bullet.setData('hitReason', isBossProjectile ? '晶体弹' : '符文弹');
      bullet.setData('bossSkill', isBossProjectile);
      this.bullets.add(bullet);
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y) + Phaser.Math.DegToRad(offset);
      bullet.setRotation(angle);
      if (isRuneProjectile) {
        bullet.setDisplaySize(22, 22);
        this.tweens.add({ targets: bullet, angle: bullet.angle + 360, duration: 560, repeat: -1 });
      }
      if (isBossProjectile) {
        bullet.setDisplaySize(26, 26);
        this.tweens.add({ targets: bullet, angle: bullet.angle + 360, duration: 720, repeat: -1 });
      }
      this.physics.velocityFromRotation(angle, enemy.stats.boss ? 185 : 175, bullet.body!.velocity);
      this.time.delayedCall(2600, () => this.destroyProjectile(bullet));
    });
    this.log(enemy.stats.boss ? '晶核守卫释放晶体弹。' : '符文射手发射弹道。');
  }

  private handleProjectileHitEnemy(projectile: Phaser.Physics.Arcade.Sprite, enemy: Fighter) {
    if (!projectile.active || projectile.getData('owner') !== 'player' || projectile.getData('handled')) return;
    projectile.setData('handled', true);
    this.damageEnemy(enemy, Number(projectile.getData('damage')));
    this.destroyProjectile(projectile);
  }

  private handleEnemyProjectileHits() {
    if (this.runEnded || !this.player.active) return;
    this.bullets.getChildren().forEach((object) => {
      const projectile = object as Phaser.Physics.Arcade.Sprite;
      if (!projectile.active || projectile.getData('owner') !== 'enemy' || projectile.getData('handled')) return;
      if (Phaser.Math.Distance.Between(projectile.x, projectile.y, this.player.x, this.player.y) > 24) return;
      projectile.setData('handled', true);
      const bossSkill = Boolean(projectile.getData('bossSkill'));
      this.damagePlayer(Number(projectile.getData('damage')), String(projectile.getData('hitReason') || '符文弹'), bossSkill
        ? { minDamageRatio: 0.7, invincibleMs: 580, shakeDuration: 155, shakeIntensity: 0.007, emphasized: true }
        : { minionDamage: true });
      this.destroyProjectile(projectile);
    });
  }

  private destroyProjectile(projectile: Phaser.Physics.Arcade.Sprite) {
    if (!projectile.active) return;
    const x = projectile.x;
    const y = projectile.y;
    const rune = Boolean(projectile.getData('runeProjectile'));
    const guardian = Boolean(projectile.getData('guardianProjectile'));
    projectile.disableBody(true, true);
    projectile.destroy();
    if (rune) this.spawnRuneBurst(x, y);
    if (guardian) this.spawnGuardianCrystalBurst(x, y);
  }

  private spawnRuneBurst(x: number, y: number) {
    const ring = this.add.circle(x, y, 8, 0x675bff, 0.12).setStrokeStyle(2, 0x8ffcff, 0.76).setDepth(27);
    this.tweens.add({ targets: ring, scale: 2.1, alpha: 0, duration: 220, onComplete: () => ring.destroy() });
    for (let i = 0; i < 4; i += 1) {
      const angle = (Math.PI * 2 * i) / 4 + Math.PI / 4;
      const shard = this.add.rectangle(x, y, 8, 3, i % 2 ? 0x8ffcff : 0x8c63ff, 0.82).setDepth(28).setRotation(angle);
      this.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * 18,
        y: y + Math.sin(angle) * 18,
        alpha: 0,
        duration: 240,
        onComplete: () => shard.destroy()
      });
    }
  }

  private spawnGuardianCrystalBurst(x: number, y: number) {
    const ring = this.add.circle(x, y, 10, 0x4f8cff, 0.14).setStrokeStyle(3, 0xd8ffff, 0.82).setDepth(27);
    this.tweens.add({ targets: ring, scale: 2.25, alpha: 0, duration: 260, onComplete: () => ring.destroy() });
    for (let i = 0; i < 5; i += 1) {
      const angle = (Math.PI * 2 * i) / 5;
      const shard = this.add.triangle(x, y, 0, 10, 6, 0, 12, 10, i % 2 ? 0xff6db8 : 0x6fdcff, 0.86).setStrokeStyle(1, 0xffffff, 0.55).setDepth(28);
      this.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * 22,
        y: y + Math.sin(angle) * 22,
        alpha: 0,
        angle: i % 2 ? 90 : -90,
        duration: 280,
        onComplete: () => shard.destroy()
      });
    }
  }

  private updateBossHazards(time: number) {
    const boss = this.enemies.getChildren().find((enemy) => (enemy as Fighter).stats.boss) as Fighter | undefined;
    if (!boss || time < (boss.getData('nextSpike') ?? 0)) return;
    const phaseTwo = boss.stats.hp / boss.stats.maxHp < 0.5;
    boss.setData('nextSpike', time + (phaseTwo ? 2100 : 3400));
    const x = Phaser.Math.Between(250, 720);
    const y = Phaser.Math.Between(210, 450);
    const warning = this.add.circle(x, y, phaseTwo ? 38 : 34, phaseTwo ? 0xff2f85 : 0x9b3cff, phaseTwo ? 0.24 : 0.18).setStrokeStyle(phaseTwo ? 4 : 3, phaseTwo ? 0xffa1df : 0xff6dff).setDepth(12);
    this.time.delayedCall(800, () => {
      warning.destroy();
      const spike = this.add.sprite(x, y, this.guardianSpikeKey()).setDepth(18).setDisplaySize(46, 46);
      if (!this.runEnded && Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y) < 48) {
        this.damagePlayer(phaseTwo ? BOSS_SKILL_DAMAGE.phase2.spike : BOSS_SKILL_DAMAGE.phase1.spike, '晶体地刺', {
          minDamageRatio: 0.7,
          invincibleMs: 580,
          shakeDuration: 175,
          shakeIntensity: 0.008,
          emphasized: true
        });
      }
      this.tweens.add({ targets: spike, alpha: 0, scale: 1.35, duration: 360, onComplete: () => spike.destroy() });
    });
  }

  private damageEnemy(enemy: Fighter, rawDamage: number, emphasized = false) {
    if (!enemy.active || enemy.getData('dying')) return;
    const damage = Math.max(1, rawDamage - enemy.stats.def);
    enemy.stats.hp -= damage;
    this.sfx.play('hit');
    this.showDamageNumber(enemy.x, enemy.y - 28, damage, emphasized ? '#8ffcff' : '#ffffff', emphasized);
    enemy.setTint(enemy.stats.kind === 'slime' ? 0xeaffff : enemy.stats.kind === 'skeleton' ? 0xffdddd : enemy.stats.kind === 'bat' ? 0xf0d2ff : enemy.stats.kind === 'archer' ? 0xded8ff : enemy.stats.boss ? 0xf1fbff : 0xffffff);
    if (enemy.stats.kind === 'slime') enemy.setAlpha(1);
    this.time.delayedCall(95, () => {
      if (!enemy.active) return;
      enemy.clearTint();
      if (enemy.getData('elite')) enemy.setTint(0xffe6ad);
    });
    if (enemy.stats.hp <= 0) this.killEnemy(enemy);
  }

  private killEnemy(enemy: Fighter) {
    if (enemy.getData('dying')) return;
    enemy.setData('dying', true);
    this.sfx.play('enemyDie');
    const wasBoss = enemy.stats.boss;
    const name = enemy.stats.name;
    this.kills += 1;
    this.gold += wasBoss ? 60 : 8;
    if (!wasBoss && this.hasRelic('life-drain')) {
      this.healPlayer(3);
      this.log(`生命汲取触发：击杀 ${name} 回复 3 HP。`);
    }
    this.destroyUnitHud(enemy);
    enemy.disableBody(true, false);
    if (enemy.stats.kind === 'slime') this.spawnSlimeShards(enemy.x, enemy.y);
    if (enemy.stats.kind === 'skeleton') this.spawnSkeletonBones(enemy.x, enemy.y);
    if (enemy.stats.kind === 'bat') this.spawnBatSmoke(enemy.x, enemy.y);
    if (enemy.stats.kind === 'archer') this.spawnRuneShards(enemy.x, enemy.y);
    if (wasBoss) this.spawnGuardianDeath(enemy.x, enemy.y);
    if (enemy.getData('elite') || name.startsWith('精英')) this.showRewardParticles('epic');
    this.tweens.add({
      targets: enemy,
      alpha: 0,
      scale: wasBoss ? 0.35 : 0.2,
      angle: wasBoss ? 0 : 90,
      duration: wasBoss ? 720 : 260,
      onComplete: () => {
        enemy.destroy();
        if (wasBoss) this.finishRun(true, '源晶净化完成');
      }
    });
    this.log(`${name} 被击败。`);
  }

  private spawnSlimeShards(x: number, y: number) {
    const points = [
      [-14, -10],
      [12, -8],
      [-10, 12],
      [14, 10],
      [0, -16],
      [2, 16]
    ];
    points.forEach(([dx, dy], index) => {
      const shard = this.add.triangle(x, y, 0, 12, 7, 0, 14, 12, index % 2 ? 0x7fffee : 0x37e8d4, 0.86).setStrokeStyle(1, 0xd7ffff, 0.75).setDepth(26);
      this.tweens.add({
        targets: shard,
        x: x + dx,
        y: y + dy,
        alpha: 0,
        angle: index % 2 ? 70 : -70,
        duration: 300,
        onComplete: () => shard.destroy()
      });
    });
  }

  private spawnSkeletonBones(x: number, y: number) {
    const pieces = [
      [-18, -12, 0xdedbd2],
      [18, -10, 0xc7c3b8],
      [-16, 14, 0xbdb8ad],
      [16, 15, 0xe4e0d5],
      [0, -22, 0x8fa8c8],
      [0, 20, 0x9ba5b6]
    ];
    pieces.forEach(([dx, dy, color], index) => {
      const piece = index === 4
        ? this.add.circle(x, y, 4, color, 0.95)
        : this.add.rectangle(x, y, index === 5 ? 12 : 15, index === 5 ? 6 : 5, color, 0.92);
      piece.setStrokeStyle(1, 0xffffff, 0.42).setDepth(26);
      this.tweens.add({
        targets: piece,
        x: x + dx,
        y: y + dy,
        alpha: 0,
        angle: index % 2 ? 85 : -85,
        duration: 340,
        onComplete: () => piece.destroy()
      });
    });
  }

  private spawnBatSmoke(x: number, y: number) {
    const clouds = [
      [-18, -10, 14],
      [16, -12, 12],
      [-12, 13, 10],
      [13, 12, 11],
      [0, -20, 9],
      [0, 18, 13]
    ];
    clouds.forEach(([dx, dy, size], index) => {
      const cloud = this.add.ellipse(x, y, size, size * 0.72, index % 2 ? 0x6a2a8d : 0x2a173d, 0.56).setDepth(26);
      this.tweens.add({
        targets: cloud,
        x: x + dx,
        y: y + dy,
        alpha: 0,
        scale: 1.55,
        duration: 360,
        onComplete: () => cloud.destroy()
      });
    });
  }

  private spawnRuneShards(x: number, y: number) {
    const pieces = [
      [-18, -14],
      [18, -13],
      [-16, 14],
      [16, 15],
      [0, -22],
      [0, 20]
    ];
    pieces.forEach(([dx, dy], index) => {
      const piece = this.add.polygon(x, y, [0, -7, 7, 0, 0, 7, -7, 0], index % 2 ? 0x8ffcff : 0x7b62ff, 0.82).setStrokeStyle(1, 0xe8ffff, 0.5).setDepth(26);
      this.tweens.add({
        targets: piece,
        x: x + dx,
        y: y + dy,
        alpha: 0,
        angle: index % 2 ? 90 : -90,
        duration: 340,
        onComplete: () => piece.destroy()
      });
    });
  }

  private spawnGuardianDeath(x: number, y: number) {
    this.cameras.main.shake(260, 0.006);
    const flash = this.add.circle(x, y, 36, 0xff6db8, 0.22).setStrokeStyle(4, 0xd8ffff, 0.9).setDepth(30);
    this.tweens.add({ targets: flash, scale: 2.4, alpha: 0, duration: 620, onComplete: () => flash.destroy() });
    for (let i = 0; i < 10; i += 1) {
      const angle = (Math.PI * 2 * i) / 10;
      const dist = 36 + (i % 3) * 12;
      const shard = this.add.triangle(x, y, 0, 18, 8, 0, 16, 18, i % 2 ? 0xff6db8 : 0x6fdcff, 0.9).setStrokeStyle(1, 0xffffff, 0.55).setDepth(31);
      this.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        angle: i % 2 ? 160 : -160,
        duration: 720,
        onComplete: () => shard.destroy()
      });
    }
  }

  private damagePlayer(rawDamage: number, reason: string, options: PlayerDamageOptions = {}): boolean {
    if (this.runEnded || this.flowState === 'reward' || !this.player.active || this.time.now < this.invincibleUntil) return false;
    const shieldActive = this.time.now < this.shieldUntil;
    const minionReduction = options.minionDamage ? this.relicState.damageReductionFromMinions : 0;
    const reducedRawDamage = Math.max(1, Math.round(rawDamage * (1 - minionReduction)));
    const reducedDamage = Math.max(1, reducedRawDamage - this.player.stats.def);
    const minDamage = options.minDamageRatio ? Math.ceil(rawDamage * options.minDamageRatio) : 1;
    const damageBeforeShield = Math.max(reducedDamage, minDamage);
    const damageAfterSkillShield = Math.max(1, Math.round(damageBeforeShield * (shieldActive ? 0.5 : 1)));
    const shieldAbsorb = Math.min(this.relicState.temporaryShield, damageAfterSkillShield);
    this.relicState.temporaryShield -= shieldAbsorb;
    const damage = Math.max(0, damageAfterSkillShield - shieldAbsorb);
    this.player.stats.hp -= damage;
    this.damageTaken += damage;
    this.invincibleUntil = this.time.now + (options.invincibleMs ?? 800);
    this.sfx.play('hurt');
    if (damage > 0) this.showDamageNumber(this.player.x, this.player.y - 34, damage, options.emphasized ? '#ff4f7b' : '#ff8aa8', options.emphasized);
    else this.showFloatingText(this.player.x, this.player.y - 34, 'Shield', '#8ffcff');
    this.cameras.main.shake(options.shakeDuration ?? (damage >= 6 ? 150 : 100), options.shakeIntensity ?? (damage >= 6 ? 0.006 : 0.004));
    this.log(`${reason}造成 ${damage} 点伤害。${shieldActive ? 'L 护盾减免了伤害。' : ''}${shieldAbsorb > 0 ? `临时护盾抵消 ${shieldAbsorb} 点。` : ''}`);
    if (this.player.stats.hp <= 0) this.finishRun(false, reason);
    return true;
  }

  private knockbackPlayerFrom(sourceX: number, sourceY: number, distance: number) {
    const angle = Phaser.Math.Angle.Between(sourceX, sourceY, this.player.x, this.player.y);
    const targetX = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * distance, 122, 838);
    const targetY = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * distance, 122, 518);
    this.tweens.add({
      targets: this.player,
      x: targetX,
      y: targetY,
      duration: 105,
      ease: 'Quad.easeOut'
    });
  }

  private updateInvincibleVisual(time: number) {
    if (!this.player.active || this.runEnded) return;
    if (time < this.invincibleUntil) {
      this.player.setAlpha(Math.floor(time / 90) % 2 === 0 ? 0.35 : 1);
      this.player.setTint(0xff9ab1);
      return;
    }
    this.player.setAlpha(1);
    if (time < this.shieldUntil) {
      this.player.setTint(0x9ffff0);
      return;
    }
    if (time >= this.shieldUntil) this.player.clearTint();
  }

  private showDamageNumber(x: number, y: number, damage: number, color: string, emphasized = false) {
    const text = this.add.text(x - 10, y, `-${damage}`, { fontFamily: 'monospace', fontSize: emphasized ? '22px' : '18px', color, stroke: '#07101e', strokeThickness: 3 }).setDepth(90);
    this.tweens.add({ targets: text, y: y - 30, alpha: 0, duration: 680, onComplete: () => text.destroy() });
  }

  public healPlayer(amount: number) {
    const healed = Math.max(0, Math.min(amount, this.player.stats.maxHp - this.player.stats.hp));
    this.player.stats.hp = Math.min(this.player.stats.maxHp, this.player.stats.hp + amount);
    if (healed > 0) this.showFloatingText(this.player.x, this.player.y - 42, `+${healed} HP`, '#8ffcff');
    return healed;
  }

  private hasRelic(id: string) {
    return this.relicState.relics.some((relic) => relic.id === id);
  }

  private showFloatingText(x: number, y: number, message: string, color = '#8ffcff') {
    const text = this.add.text(x, y, message, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color,
      stroke: '#07101e',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(120);
    this.tweens.add({ targets: text, y: y - 34, alpha: 0, duration: 900, onComplete: () => text.destroy() });
  }

  private openPortal(message: string) {
    this.roomCleared = true;
    this.currentRoom.isCleared = true;
    this.updateDoor();
    this.sfx.play('portal');
    this.log(message);
  }

  private grantEventCombatClearBonus() {
    if (this.eventCombatGoldReward > 0) {
      this.gold += this.eventCombatGoldReward;
      this.showFloatingText(this.player.x, this.player.y - 82, `金币 +${this.eventCombatGoldReward}`, '#ffe6ad');
      this.log(`事件战斗奖励：获得 ${this.eventCombatGoldReward} 金币。`);
    }
    if (this.eventCombatRareRewardChance > 0 && Phaser.Math.Between(1, 100) <= this.eventCombatRareRewardChance) {
      const reward = this.pickRewardByRarity('rare', []);
      if (reward) {
        this.grantReward(reward);
        this.showRewardParticles('rare');
        this.showFloatingText(this.player.x, this.player.y - 106, `获得：${this.getRewardDisplayName(reward)}`, '#8ffcff');
        this.log(`精英巡逻掉落：${this.getRewardDisplayName(reward)}。`);
      }
    }
    this.eventCombatGoldReward = 0;
    this.eventCombatRareRewardChance = 0;
  }

  private openRewardChoice(trigger: RewardTrigger) {
    if (this.flowState === 'reward' || this.runEnded) return;
    this.roomCleared = false;
    this.player.setVelocity(0, 0);
    this.enemies.getChildren().forEach((enemy) => (enemy as Fighter).setVelocity(0, 0));
    this.physics.world.pause();
    this.flowState = 'reward';
    this.grantRoomClearBonus(trigger);
    this.activeRewardChoices = this.rollRewardChoices(trigger);
    this.rewardPanel?.destroy();
    this.rewardPanel = this.add.container(480, 300).setDepth(230);
    this.rewardPanel.add(this.add.rectangle(0, 0, 720, 360, 0x07101e, 0.97).setStrokeStyle(2, 0x35e7c4, 0.92));
    this.rewardPanel.add(this.add.text(0, -145, trigger === 'elite' ? '高级战斗奖励' : trigger === 'treasure' ? '封尘宝库奖励' : '战斗奖励', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5));
    this.rewardPanel.add(this.add.text(0, -112, '选择 1 个遗物。按 1 / 2 / 3 或点击卡牌。', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#8ffcff'
    }).setOrigin(0.5));

    this.activeRewardChoices.forEach((reward, index) => {
      this.rewardPanel?.add(this.createRewardCard(reward, index));
    });
  }

  private grantRoomClearBonus(trigger: RewardTrigger) {
    if (trigger === 'treasure') return;
    const trueElite = trigger === 'elite' && this.currentRoom.name.includes('精英');
    const gold = trigger === 'battle'
      ? Phaser.Math.Between(8, 16)
      : trueElite ? Phaser.Math.Between(24, 36) : Phaser.Math.Between(16, 24);
    this.gold += gold;
    this.showFloatingText(this.player.x, this.player.y - 98, `Gold +${gold}`, '#ffe6ad');
  }

  private rollRewardChoices(trigger: RewardTrigger) {
    const trueElite = trigger === 'elite' && this.currentRoom.name.includes('精英');
    const rarityPlan: RewardRarity[] = trigger === 'battle'
      ? ['common', 'common', Phaser.Math.Between(1, 100) <= 42 ? 'rare' : 'common']
      : trigger === 'treasure'
        ? ['common', 'common', Phaser.Math.Between(1, 100) <= 38 ? 'rare' : 'common']
        : trueElite
          ? ['rare', 'rare', Phaser.Math.Between(1, 100) <= 72 && this.epicRewardsTaken < 2 ? 'epic' : 'rare']
          : ['rare', 'rare', Phaser.Math.Between(1, 100) <= 32 && this.epicRewardsTaken < 2 ? 'epic' : 'rare'];
    const selected: RewardOption[] = [];
    rarityPlan.forEach((rarity) => {
      const option = this.pickRewardByRarityForTrigger(rarity, selected.map((reward) => reward.id), trigger);
      if (option) selected.push(option);
    });
    while (selected.length < 3) {
      const fallback = this.pickRewardByRarityForTrigger('common', selected.map((reward) => reward.id), trigger);
      if (!fallback) break;
      selected.push(fallback);
    }
    return selected;
  }

  private pickRewardByRarityForTrigger(rarity: RewardRarity, excludedIds: string[], trigger: RewardTrigger) {
    const blockedForTreasure = new Set(['attack-crystal', 'source-dagger', 'echo-core']);
    const candidates = REWARD_POOL.filter((reward) => {
      if (reward.rarity !== rarity || excludedIds.includes(reward.id)) return false;
      if (reward.rarity === 'epic' && this.epicRewardsTaken >= 2) return false;
      if (!reward.stackable && this.hasRelic(reward.id)) return false;
      if (trigger === 'treasure' && blockedForTreasure.has(reward.id)) return false;
      return true;
    });
    return Phaser.Utils.Array.GetRandom(candidates);
  }

  public pickRewardByRarity(rarity: RewardRarity, excludedIds: string[]) {
    const candidates = REWARD_POOL.filter((reward) => {
      if (reward.rarity !== rarity || excludedIds.includes(reward.id)) return false;
      if (reward.rarity === 'epic' && this.epicRewardsTaken >= 2) return false;
      if (!reward.stackable && this.hasRelic(reward.id)) return false;
      return true;
    });
    return Phaser.Utils.Array.GetRandom(candidates);
  }

  private createRewardCard(reward: RewardOption, index: number) {
    const x = -232 + index * 232;
    const card = this.add.container(x, 38);
    const color = reward.rarity === 'common' ? 0x587089 : reward.rarity === 'rare' ? 0x36d7ff : 0xb87cff;
    const fill = reward.rarity === 'epic' ? 0x1c1231 : 0x0b1628;
    const rect = this.add.rectangle(0, 0, 206, 230, fill, 0.96).setStrokeStyle(2, color, 0.95).setInteractive({ useHandCursor: true });
    rect.on('pointerover', () => rect.setFillStyle(reward.rarity === 'epic' ? 0x261944 : 0x10233a, 0.98));
    rect.on('pointerout', () => rect.setFillStyle(fill, 0.96));
    rect.on('pointerdown', () => this.chooseRewardByIndex(index));
    card.add(rect);
    card.add(this.add.text(-88, -94, `${index + 1}`, { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }));
    card.add(this.add.text(0, -92, this.getRewardDisplayName(reward), { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff', align: 'center', wordWrap: { width: 168 } }).setOrigin(0.5));
    card.add(this.add.text(0, -58, `${reward.rarity.toUpperCase()} · ${reward.type}`, { fontFamily: 'monospace', fontSize: '13px', color: reward.rarity === 'common' ? '#c8d8e8' : reward.rarity === 'rare' ? '#8ffcff' : '#d9b8ff' }).setOrigin(0.5));
    card.add(this.add.text(-82, -26, this.getRewardDisplayDescription(reward), { fontFamily: 'monospace', fontSize: '13px', color: '#dff7ff', wordWrap: { width: 164 }, lineSpacing: 4 }));
    card.add(this.add.rectangle(0, 74, 166, 38, 0x07101e, 0.82).setStrokeStyle(1, color, 0.72));
    card.add(this.add.text(0, 74, reward.effectText, { fontFamily: 'monospace', fontSize: '13px', color: '#ffe6ad', align: 'center', wordWrap: { width: 152 } }).setOrigin(0.5));
    return card;
  }

  private chooseRewardByIndex(index: number) {
    if (this.flowState !== 'reward') return;
    const reward = this.activeRewardChoices[index];
    if (!reward) return;
    this.grantReward(reward);
    this.rewardChoiceCount += 1;
    this.sfx.play('pickup');
    this.showRewardParticles(reward.rarity);
    this.showFloatingText(this.player.x, this.player.y - 76, `获得：${this.getRewardDisplayName(reward)} ${reward.effectText}`, reward.rarity === 'epic' ? '#d9b8ff' : '#8ffcff');
    this.log(`获得遗物：${this.getRewardDisplayName(reward)}，${reward.effectText}。`);
    this.rewardPanel?.destroy();
    this.rewardPanel = undefined;
    this.activeRewardChoices = [];
    this.activeEvent = undefined;
    this.eventPanel?.destroy();
    this.eventPanel = undefined;
    this.rewardTaken = true;
    this.currentRoom.rewardClaimed = true;
    this.flowState = 'playing';
    this.physics.world.resume();
    this.openPortal('奖励已选择。右侧传送门已开启，按 E 进入下一房间。');
  }

  public grantReward(reward: RewardOption) {
    reward.apply(this);
    this.relicState.relics.push(reward);
    if (reward.rarity === 'epic') this.epicRewardsTaken += 1;
    this.itemsObtained.push(this.getRewardDisplayName(reward));
  }

  private showRewardParticles(rarity: RewardRarity) {
    const color = rarity === 'epic' ? 0xb87cff : 0x36d7ff;
    for (let i = 0; i < 10; i += 1) {
      const angle = (Math.PI * 2 * i) / 10;
      const particle = this.add.circle(this.player.x, this.player.y - 8, 4, color, 0.82).setDepth(118);
      this.tweens.add({
        targets: particle,
        x: this.player.x + Math.cos(angle) * 42,
        y: this.player.y - 8 + Math.sin(angle) * 32,
        alpha: 0,
        duration: 520,
        onComplete: () => particle.destroy()
      });
    }
  }

  private openEventChoice() {
    if (this.flowState === 'event' || this.runEnded || this.currentRoom.eventResolved) return;
    this.player.setVelocity(0, 0);
    this.physics.world.pause();
    this.flowState = 'event';
    this.activeEvent = this.pickEventPackEvent();
    this.eventPanel?.destroy();
    this.eventPanel = this.add.container(480, 300).setDepth(232);
    this.eventPanel.add(this.add.rectangle(0, 0, 690, 360, 0x07101e, 0.97).setStrokeStyle(2, 0xb87cff, 0.9));
    this.eventPanel.add(this.add.text(0, -145, this.activeEvent.title, { fontFamily: 'monospace', fontSize: '28px', color: '#ffffff' }).setOrigin(0.5));
    this.eventPanel.add(this.add.text(-290, -104, this.activeEvent.description, {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#dff7ff',
      wordWrap: { width: 580 },
      lineSpacing: 5
    }));
    this.eventPanel.add(this.add.text(-290, -38, `Effect: ${this.activeEvent.effectText}`, {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#ffe6ad',
      wordWrap: { width: 580 },
      lineSpacing: 5
    }));
    this.eventPanel.add(this.add.text(-290, 26, `Next: ${this.activeEvent.followUpObjective}`, {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#8ffcff',
      wordWrap: { width: 580 },
      lineSpacing: 5
    }));
    this.eventPanel.add(this.createEventContinueButton());
  }

  private createEventContinueButton() {
    const button = this.add.container(0, 124);
    const rect = this.add.rectangle(0, 0, 220, 46, 0x10233a, 0.96).setStrokeStyle(1, 0x8ffcff).setInteractive({ useHandCursor: true });
    rect.on('pointerdown', () => this.resolveActiveEvent());
    rect.on('pointerover', () => rect.setFillStyle(0x173756, 0.98));
    rect.on('pointerout', () => rect.setFillStyle(0x10233a, 0.96));
    button.add(rect);
    button.add(this.add.text(0, 0, 'Continue  E / Space', { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' }).setOrigin(0.5));
    return button;
  }

  private showWeaponSelection() {
    this.titlePanel?.destroy();
    this.titlePanel = undefined;
    this.settlementPanel?.destroy();
    this.settlementPanel = undefined;
    this.weaponPanel?.destroy();
    this.flowState = 'weapon';
    this.gameReady = false;
    this.time.paused = false;
    this.physics.world.pause();
    this.setGameplayUiVisible(false);
    this.setWorldVisible(false);
    this.selectedHero = DEFAULT_HERO;

    this.weaponPanel = this.add.container(480, 300).setDepth(225);
    this.weaponPanel.add(this.add.rectangle(0, 0, 820, 500, 0x07101e, 0.97).setStrokeStyle(2, 0x35e7c4, 0.95));
    this.weaponPanel.add(this.add.text(0, -220, '选择初始武器', { fontFamily: 'monospace', fontSize: '32px', color: '#ffffff' }).setOrigin(0.5));
    this.weaponPanel.add(this.add.text(0, -188, `当前角色：${this.selectedHero.name}。本局武器固定，按 1 / 2 / 3 / 4 或点击卡牌选择。`, { fontFamily: 'monospace', fontSize: '15px', color: '#8ffcff' }).setOrigin(0.5));
    this.getCurrentHeroWeapons().forEach((weapon, index) => {
      this.weaponPanel?.add(this.createWeaponCard(weapon, index));
    });
  }

  private getCurrentHeroWeapons() {
    const hero = this.selectedHero ?? DEFAULT_HERO;
    const weapons = hero.allowedWeaponIds.map((id) => getWeaponById(id)).filter(Boolean);
    return weapons.length > 0 ? weapons : [getWeaponById(hero.defaultWeaponId)];
  }

  private createWeaponCard(weapon: WeaponConfig, index: number) {
    const x = -300 + index * 200;
    const card = this.add.container(x, 28);
    const rect = this.add.rectangle(0, 0, 176, 330, 0x0b1628, 0.96).setStrokeStyle(2, weapon.attackColor, 0.92).setInteractive({ useHandCursor: true });
    rect.on('pointerover', () => rect.setFillStyle(0x10233a, 0.98));
    rect.on('pointerout', () => rect.setFillStyle(0x0b1628, 0.96));
    rect.on('pointerdown', () => this.chooseWeapon(index));
    card.add(rect);
    card.add(this.add.text(-76, -146, `${index + 1}`, { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }));
    card.add(this.add.text(0, -128, weapon.name, { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5));
    card.add(this.createWeaponCardPreview(weapon));
    card.add(this.add.text(0, -98, weapon.role, { fontFamily: 'monospace', fontSize: '14px', color: '#8ffcff' }).setOrigin(0.5));
    card.add(this.add.text(-70, -70, weapon.description, { fontFamily: 'monospace', fontSize: '11px', color: '#dff7ff', wordWrap: { width: 140, useAdvancedWrap: true }, lineSpacing: 2 }));
    card.add(this.add.text(-70, -18, `优点：${weapon.pros}`, { fontFamily: 'monospace', fontSize: '11px', color: '#ffe6ad', wordWrap: { width: 140, useAdvancedWrap: true }, lineSpacing: 2 }));
    card.add(this.add.text(-70, 38, `缺点：${weapon.cons}`, { fontFamily: 'monospace', fontSize: '11px', color: '#ffb0b0', wordWrap: { width: 140, useAdvancedWrap: true }, lineSpacing: 2 }));
    card.add(this.add.text(-70, 94, this.getWeaponStatText(weapon), { fontFamily: 'monospace', fontSize: '10px', color: '#eaffff', wordWrap: { width: 142, useAdvancedWrap: true }, lineSpacing: 1 }));
    return card;
  }

  private getWeaponStatText(weapon: WeaponConfig) {
    const damageText = weapon.id === 'dual-daggers'
      ? `每段 ${Math.round(weapon.attackDamageMultiplier * 100)}% x2`
      : `${Math.round(weapon.attackDamageMultiplier * 100)}%`;
    return [
      `伤害 ${damageText}`,
      `范围 ${weapon.attackRange}  宽度 ${weapon.attackWidth}`,
      `冷却 ${weapon.attackCooldown}ms  击退 ${weapon.knockbackPower}`,
      `K伤害 ${Math.round(weapon.dashDamageMultiplier * 100)}%  K距离 ${Math.round(weapon.dashDistanceMultiplier * 100)}%`,
      `K冷却 ${Math.round(weapon.dashCooldownMultiplier * 100)}%  移速 ${Math.round(weapon.moveSpeedMultiplier * 100)}%`
    ].join('\n');
  }

  private createWeaponCardPreview(weapon: WeaponConfig) {
    const preview = this.add.graphics();
    const x = 46;
    const y = -116;
    preview.lineStyle(2, 0x06101a, 0.9);
    if (weapon.id === 'heavy-blade') {
      preview.fillStyle(0xffd28a, 0.95).fillTriangle(x + 20, y - 3, x - 12, y - 13, x - 12, y + 9);
      preview.lineStyle(2, 0xfff1c8, 0.9).strokeTriangle(x + 20, y - 3, x - 12, y - 13, x - 12, y + 9);
    } else if (weapon.id === 'spear') {
      preview.lineStyle(4, 0x8b6944, 0.95).lineBetween(x - 24, y, x + 16, y);
      preview.fillStyle(0x8ffcff, 0.96).fillTriangle(x + 28, y, x + 16, y - 6, x + 16, y + 6);
    } else if (weapon.id === 'dual-daggers') {
      preview.lineStyle(4, 0xf0d8ff, 0.95).lineBetween(x - 18, y + 2, x, y - 10);
      preview.lineStyle(4, 0xf0d8ff, 0.95).lineBetween(x + 4, y - 10, x + 22, y + 2);
    } else {
      preview.lineStyle(4, 0xf5ffff, 0.95).lineBetween(x - 18, y + 4, x + 18, y - 8);
      preview.lineStyle(3, 0x35e7c4, 0.8).lineBetween(x - 8, y - 7, x + 2, y + 8);
    }
    return preview;
  }

  private chooseWeapon(index: number) {
    const weapons = this.getCurrentHeroWeapons();
    const weapon = weapons[index] ?? getWeaponById(this.selectedHero.defaultWeaponId);
    this.selectedWeapon = weapon;
    this.weaponPanel?.destroy();
    this.weaponPanel = undefined;
    this.startGame();
  }

  private resolveActiveEvent() {
    if (this.flowState !== 'event' || !this.activeEvent) return;
    const event = this.activeEvent;
    const result = event.applyEffect(this);
    this.eventChoiceCount += 1;
    this.eventStats.triggered += 1;
    if (event.category === 'penalty' || event.category === 'curse' || event.category === 'mixed') this.eventStats.negative += 1;
    if (event.category === 'combat') this.eventStats.combat += 1;
    if (event.oncePerRun) this.eventsSeen.add(event.id);
    this.currentRoom.eventResolved = true;
    this.eventPanel?.destroy();
    this.eventPanel = undefined;
    this.activeEvent = undefined;
    this.flowState = 'playing';
    this.physics.world.resume();
    if (result.floatingText) this.showFloatingText(this.player.x, this.player.y - 72, result.floatingText, event.category === 'penalty' || event.category === 'curse' ? '#ffb0b0' : '#d9b8ff');
    this.log(result.log);
    if (result.enemies?.length) {
      this.currentRoom.enemies = result.enemies;
      this.currentRoom.isCleared = false;
      this.roomCleared = false;
      this.eventCombatGoldReward = result.goldReward ?? 0;
      this.eventCombatRareRewardChance = result.rareRewardChance ?? 0;
      this.updateDoor();
      this.spawnEnemies();
      return;
    }
    if (result.opensPortal !== false) this.openPortal('Event complete. Portal opened. Press E to choose the next room.');
  }

  private pickEventPackEvent() {
    const roomNumber = this.getDisplayRoomNumber();
    const hpRatio = this.player.stats.hp / this.player.stats.maxHp;
    const candidates = EVENT_PACK.filter((event) => {
      if (!event.roomTags.includes(this.currentRoom.kind)) return false;
      if (event.oncePerRun && this.eventsSeen.has(event.id)) return false;
      if (event.minRoomIndex && roomNumber < event.minRoomIndex) return false;
      if (event.maxRoomIndex && roomNumber > event.maxRoomIndex) return false;
      return true;
    });
    const weighted = candidates.map((event) => {
      let weight = event.weight;
      if (hpRatio < 0.35 && event.category === 'supply') weight += 8;
      if (hpRatio < 0.25 && (event.category === 'penalty' || event.category === 'combat')) weight = Math.max(1, Math.floor(weight * 0.55));
      return { event, weight };
    });
    const total = weighted.reduce((sum, item) => sum + item.weight, 0);
    let roll = Phaser.Math.Between(1, Math.max(1, total));
    for (const item of weighted) {
      roll -= item.weight;
      if (roll <= 0) return item.event;
    }
    return weighted[0]?.event ?? EVENT_PACK[0];
  }

  private interact() {
    if (this.currentRoom.kind === 'rest' && !this.currentRoom.rewardClaimed) {
      const item = (this.items.getChildren() as Phaser.Physics.Arcade.Sprite[]).find((candidate) => candidate.active && candidate.getData('item') === 'rest');
      if (item && Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y) <= 86) {
        this.claimRestRoomSupply();
        return;
      }
      this.log('靠近源晶治疗台后按 E 使用补给。');
      return;
    }
    if (this.currentRoom.reward && !this.rewardTaken) {
      const item = (this.items.getChildren() as Phaser.Physics.Arcade.Sprite[]).find((candidate) => candidate.active);
      if (item && Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y) <= 72) {
        this.pickItem(item);
        return;
      }
      this.log(this.currentRoom.reward === 'chest' ? '靠近封尘宝库中的宝箱，按 E 打开。' : '靠近药水按 E 拾取。');
      return;
    }
    if (!this.roomCleared) {
      this.log('清除敌人后传送门才会开启。');
      return;
    }
    const nextIndex = this.getSelectedPortalTarget();
    if (nextIndex === undefined) return;
    this.sfx.play('portal');
    this.currentRoom.selectedBranch = nextIndex;
    this.loadRoom(nextIndex);
  }

  private getSelectedPortalTarget() {
    const options = this.currentRoom.nextOptions;
    if (options.length <= 1) return options[0];
    const nearest = this.branchDoorSprites
      .map((sprite, index) => ({ index, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y) }))
      .sort((a, b) => a.distance - b.distance)[0];
    if (!nearest || nearest.distance > 96) {
      this.log('靠近一个开启的传送门后按 E 选择路线。');
      return undefined;
    }
    return options[nearest.index];
  }

  private pickItem(item: Phaser.Physics.Arcade.Sprite) {
    if (this.rewardTaken) return;
    const type = item.getData('item') as 'chest' | 'potion' | 'rest';
    if (type === 'rest') {
      this.claimRestRoomSupply();
      return;
    }
    item.disableBody(true, true);
    item.destroy();
    if (type === 'potion') {
      this.rewardTaken = true;
      this.sfx.play('pickup');
      const lowHpBonus = this.player.stats.hp / this.player.stats.maxHp < 0.4 ? 10 : 0;
      const healAmount = 25 + lowHpBonus + this.relicState.potionHealBonus;
      this.healPlayer(healAmount);
      this.currentRoom.rewardClaimed = true;
      this.showRewardToast('potion_hp', `获得：小型生命药水 HP +${healAmount}`);
      this.log(`获得小型生命药水：回复 ${healAmount} 点生命。按 E 继续。`);
      return;
    }
    this.sfx.play('chest');
    this.add.sprite(480, 320, this.assetKey('chest_open')).setDisplaySize(54, 54).setDepth(20).setData('roomObj', true);
    this.openRewardChoice('treasure');
  }

  private showRewardToast(assetName: DungeonAssetName, message: string) {
    const x = Phaser.Math.Clamp(this.player.x + 12, 150, 760);
    const y = Phaser.Math.Clamp(this.player.y - 76, 110, 470);
    const container = this.add.container(x, y).setDepth(98).setData('roomObj', true);
    const bg = this.add.rectangle(0, 0, 250, 48, 0x07101e, 0.88).setStrokeStyle(1, 0x8ffcff);
    const icon = this.add.image(-104, 0, this.assetKey(assetName)).setDisplaySize(34, 34);
    const text = this.add.text(-78, -10, message, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#f5ffff',
      stroke: '#07101e',
      strokeThickness: 2
    });
    container.add([bg, icon, text]);
    this.tweens.add({
      targets: container,
      y: y - 28,
      alpha: 0,
      delay: 1200,
      duration: 520,
      onComplete: () => container.destroy()
    });
  }

  private cleanupProjectiles() {
    this.bullets.getChildren().forEach((object) => {
      const bullet = object as Phaser.Physics.Arcade.Sprite;
      if (bullet.x < 90 || bullet.x > 890 || bullet.y < 70 || bullet.y > 570) this.destroyProjectile(bullet);
    });
  }

  private updateUi(time: number) {
    const dashLeft = Math.max(0, Math.ceil((this.skillCooldowns.dashSlash - time) / 1000));
    const shieldLeft = Math.max(0, Math.ceil((this.skillCooldowns.shield - time) / 1000));
    const shieldActive = time < this.shieldUntil;
    const shieldStatus = shieldActive ? 'Active' : shieldLeft === 0 ? 'Ready' : `CD ${shieldLeft}s`;
    const hpRatio = Phaser.Math.Clamp(this.player.stats.hp / this.player.stats.maxHp, 0, 1);
    this.hpBarFill.width = 176 * hpRatio;
    this.hpBarFill.setFillStyle(hpRatio < 0.32 ? 0xff5f7d : 0x35e7c4);
    const recentRelics = this.relicState.relics.slice(-3).map((relic) => this.getRewardDisplayName(relic)).join(' / ') || 'None';
    const statuses = [
      this.poisonRooms > 0 ? `Poison ${this.poisonRooms} room` : '',
      this.rustRooms > 0 ? `Rust ${this.rustRooms} room` : '',
      this.roomSpeedMultiplier < 1 ? 'Slow' : ''
    ].filter(Boolean).join('  ') || 'Clear';
    this.statusText.setText([
      `HP ${Math.max(0, Math.ceil(this.player.stats.hp))}/${this.player.stats.maxHp}${this.relicState.temporaryShield > 0 ? `  Shield ${this.relicState.temporaryShield}` : ""}`,
      `ATK ${this.player.stats.atk}    DEF ${this.player.stats.def}`,
      `Gold ${this.gold}    Relics ${this.relicState.relics.length}`,
      `Weapon ${this.selectedWeapon.name}`,
      `Status ${statuses}`,
      `Recent ${recentRelics}`
    ]);
    this.skillText.setText([
      '[J] Attack',
      `[K] Dash Slash: ${dashLeft === 0 ? 'Ready' : `CD ${dashLeft}s`}`,
      `[L] Shield: ${shieldStatus}`,
      '[I] 查看状态',
      '[E] 互动  [Esc] 暂停  [R] 重开'
    ]);
    this.roomText.setText([
      `${this.getDisplayRoomNumber()}/${this.getDisplayTotalRooms()} ${this.getRoomDisplayName()}`,
      this.getWaveHudText(),
      this.getContextHint(),
      this.getNearbyBranchHint(),
    ].filter(Boolean));
    const boss = this.enemies.getChildren().find((enemy) => (enemy as Fighter).stats.boss) as Fighter | undefined;
    if (boss && this.bossBarFill && this.bossBarText) {
      this.bossBarFill.width = 340 * Math.max(0, boss.stats.hp / boss.stats.maxHp);
      this.bossBarText.setText(`晶核守卫 ${Math.max(0, Math.ceil(boss.stats.hp))}/${boss.stats.maxHp}${boss.stats.hp / boss.stats.maxHp < 0.5 ? '  第二阶段' : '  第一阶段'}`);
    }
    if (this.shieldRing) this.shieldRing.setPosition(this.player.x, this.player.y);
  }

  private getContextHint() {
    if (this.currentRoom.kind === 'rest' && !this.currentRoom.rewardClaimed) return '源晶治疗台：按 E 使用';
    if (this.roomCleared) return this.currentRoom.nextOptions.length > 1 ? '分支传送门：靠近目标按 E' : '传送门：已开启，按 E 进入';
    if (this.currentRoom.kind === 'treasure') return '传送门：打开封尘宝库后开启';
    if (this.currentRoom.kind === 'event') return '传送门：完成事件后开启';
    return '传送门：清除敌人后开启';
  }

  private getWaveHudText() {
    if (this.roomCleared || this.combatWaves.length <= 1) return '';
    if (this.currentRoom.kind !== 'battle' && this.currentRoom.kind !== 'elite') return '';
    return `第 ${this.currentWaveIndex + 1} / ${this.combatWaves.length} 波`;
  }

  private getNearbyBranchHint() {
    if (!this.roomCleared || this.currentRoom.nextOptions.length <= 1) return '';
    const nearest = this.branchDoorSprites
      .map((sprite, index) => ({ index, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y) }))
      .sort((a, b) => a.distance - b.distance)[0];
    if (!nearest || nearest.distance > 110) return '';
    const target = this.dungeonRoute[this.currentRoom.nextOptions[nearest.index]];
    return `按 E 前往：${this.getRoomDisplayName(target)}`;
  }

  private showRoomTitle() {
    this.roomTitleToast?.destroy();
    const roomNumber = this.getDisplayRoomNumber();
    const totalRooms = this.getDisplayTotalRooms();
    const title = this.currentRoom.kind === 'boss'
      ? `第 ${roomNumber}/${totalRooms} 房：首领房：晶核守卫`
      : `第 ${roomNumber}/${totalRooms} 房：${this.getRoomDisplayName()}`;
    this.roomTitleToast = this.add.text(480, 300, title, {
      fontFamily: 'monospace',
      fontSize: this.currentRoom.kind === 'boss' ? '30px' : '28px',
      color: this.currentRoom.kind === 'boss' ? '#ffd7e6' : '#ffffff',
      stroke: '#07101e',
      strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0).setDepth(95);
    this.tweens.add({
      targets: this.roomTitleToast,
      alpha: 1,
      y: 286,
      duration: 220,
      onComplete: () => {
        if (!this.roomTitleToast || this.runEnded) return;
        this.tweens.add({
          targets: this.roomTitleToast,
          alpha: 0,
          y: 272,
          delay: 1000,
          duration: 420,
          onComplete: () => {
            this.roomTitleToast?.destroy();
            this.roomTitleToast = undefined;
          }
        });
      }
    });
  }

  private updateDoor() {
    if (!this.doorSprite) return;
    this.doorTween?.stop();
    this.doorTween = undefined;
    this.clearBranchDoors();
    const options = this.currentRoom.nextOptions;
    if (options.length > 1) {
      this.doorSprite.setVisible(false);
      this.createBranchDoors(options);
      return;
    }
    this.doorSprite.setVisible(true);
    this.doorSprite.setTexture(this.assetKey(this.roomCleared ? 'door_open' : 'door_closed'));
    this.doorSprite.setDisplaySize(46, 98);
    this.doorSprite.clearTint();
    const baseScaleX = this.doorSprite.scaleX;
    const baseScaleY = this.doorSprite.scaleY;
    if (this.roomCleared) {
      this.doorSprite.setAlpha(1).setTint(0xbaffff);
      this.doorTween = this.tweens.add({
        targets: this.doorSprite,
        alpha: 0.64,
        scaleX: baseScaleX * 1.08,
        scaleY: baseScaleY * 1.08,
        yoyo: true,
        repeat: -1,
        duration: 820
      });
    } else {
      this.doorSprite.setAlpha(0.52).setTint(0x40536a);
    }
  }

  private createBranchDoors(options: number[]) {
    const targets = options.slice(0, 2);
    const positions = targets.length === 1 ? [[806, 320]] : [[806, 246], [806, 394]];
    targets.forEach((targetIndex, index) => {
      const [x, y] = positions[index];
      const targetRoom = this.dungeonRoute[targetIndex];
      const sprite = this.add.image(x, y, this.assetKey(this.roomCleared ? 'door_open' : 'door_closed')).setDisplaySize(44, 84).setData('roomObj', true).setDepth(7);
      sprite.setAlpha(this.roomCleared ? 1 : 0.52).setTint(this.roomCleared ? 0xbaffff : 0x40536a);
      const bg = this.add.rectangle(x - 104, y - 54, 142, 28, 0x07101e, 0.78).setStrokeStyle(1, this.roomCleared ? 0x8ffcff : 0x506070).setData('roomObj', true).setDepth(80);
      const label = this.add.text(x - 104, y - 55, this.getRoomDisplayName(targetRoom), {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: this.roomCleared ? '#dff7ff' : '#7c91a8',
        stroke: '#07101e',
        strokeThickness: 3,
        align: 'center',
        wordWrap: { width: 132 }
      }).setOrigin(0.5).setDepth(81).setData('roomObj', true);
      this.branchDoorSprites.push(sprite);
      this.branchDoorLabels.push(label, bg);
      if (this.roomCleared) {
        this.branchDoorTweens.push(this.tweens.add({
          targets: sprite,
          alpha: 0.64,
          scaleX: sprite.scaleX * 1.08,
          scaleY: sprite.scaleY * 1.08,
          yoyo: true,
          repeat: -1,
          duration: 820
        }));
      }
    });
  }

  private countLivingEnemies() {
    return (this.enemies.getChildren() as Fighter[]).filter((enemy) => enemy.active && !enemy.getData('dying')).length;
  }

  private createBossBar() {
    this.destroyBossBar();
    this.bossBarBg = this.add.rectangle(480, 58, 348, 18, 0x240f1e).setStrokeStyle(2, 0xff78ab).setDepth(85);
    this.bossBarFill = this.add.rectangle(309, 58, 340, 12, 0xff4f9b).setOrigin(0, 0.5).setDepth(86);
    this.bossBarText = this.add.text(480, 30, '晶核守卫', { fontFamily: 'monospace', fontSize: '16px', color: '#ffd7e6' }).setOrigin(0.5).setDepth(86);
  }

  private destroyBossBar() {
    this.bossBarBg?.destroy();
    this.bossBarFill?.destroy();
    this.bossBarText?.destroy();
    this.bossBarBg = undefined;
    this.bossBarFill = undefined;
    this.bossBarText = undefined;
  }

  private createUnitHud(fighter: Fighter) {
    const elite = Boolean(fighter.getData?.('elite'));
    const width = fighter.stats.boss ? 104 : fighter.stats.kind === 'player' ? 58 : elite ? 64 : 52;
    const hud: UnitHud = {
      name: this.add.text(fighter.x, fighter.y - 44, fighter.stats.name, { fontFamily: 'monospace', fontSize: elite ? '13px' : '12px', color: elite ? '#ffe6ad' : '#eaffff', stroke: '#07101e', strokeThickness: 3 }).setOrigin(0.5).setDepth(70),
      hpBg: this.add.rectangle(fighter.x, fighter.y - 28, width, 6, 0x250c18).setDepth(69),
      hpFill: this.add.rectangle(fighter.x - width / 2, fighter.y - 28, width, 6, fighter.stats.kind === 'player' ? 0x35e7c4 : elite ? 0xffc24d : 0xff5f7d).setOrigin(0, 0.5).setDepth(70)
    };
    this.unitHuds.set(fighter.stats.id, hud);
  }

  private updateUnitHuds() {
    const fighters = [this.player, ...(this.enemies.getChildren() as Fighter[])].filter((fighter) => fighter?.active);
    fighters.forEach((fighter) => {
      const hud = this.unitHuds.get(fighter.stats.id);
      if (!hud) return;
      const elite = Boolean(fighter.getData?.('elite'));
      const width = fighter.stats.boss ? 104 : fighter.stats.kind === 'player' ? 58 : elite ? 64 : 52;
      const yOffset = fighter.stats.boss ? 62 : 28;
      hud.name.setPosition(fighter.x, fighter.y - (fighter.stats.boss ? 82 : 42));
      hud.hpBg.setPosition(fighter.x, fighter.y - yOffset);
      hud.hpFill.setPosition(fighter.x - width / 2, fighter.y - yOffset);
      hud.hpFill.width = width * Phaser.Math.Clamp(fighter.stats.hp / fighter.stats.maxHp, 0, 1);
    });
  }

  private destroyUnitHud(fighter: Fighter) {
    const hud = this.unitHuds.get(fighter.stats.id);
    if (!hud) return;
    hud.name.destroy();
    hud.hpBg.destroy();
    hud.hpFill.destroy();
    this.unitHuds.delete(fighter.stats.id);
  }

  private clearEnemyHuds() {
    [...this.unitHuds.entries()].forEach(([id, hud]) => {
      if (id === 'player') return;
      hud.name.destroy();
      hud.hpBg.destroy();
      hud.hpFill.destroy();
      this.unitHuds.delete(id);
    });
  }

  private log(message: string) {
    this.logText.setText(`战斗日志：${message}`);
  }

  private getGrade(victory: boolean, durationSeconds: number) {
    if (victory && durationSeconds <= 240) return 'A';
    if (victory) return 'B';
    if (this.reachedBossPhaseTwo) return 'C';
    return 'D';
  }

  private getBuildSummary() {
    const counts: Record<RewardType, number> = { 攻击: 0, 生存: 0, 回复: 0, 技能: 0 };
    this.relicState.relics.forEach((relic) => { counts[relic.type] += 1; });
    const top = (Object.entries(counts) as [RewardType, number][]).sort((a, b) => b[1] - a[1])[0];
    if (!top || top[1] === 0) return '未成型';
    if (top[0] === '攻击') return '攻击流';
    if (top[0] === '生存') return '防御流';
    if (top[0] === '技能') return '技能流';
    return '续航流';
  }

  private getVisitedRooms() {
    return this.visitedRoomIds
      .map((id) => this.dungeonRoute.find((room) => room.id === id))
      .filter((room): room is RoomDef => Boolean(room));
  }

  private getRouteSummary(visitedOnly = false) {
    const rooms = visitedOnly ? this.getVisitedRooms() : this.dungeonRoute;
    return rooms.map((room) => this.getRoomDisplayName(room)).join(' → ');
  }

  private getEliteRoomsVisited() {
    return this.getVisitedRooms().filter((room) => room.kind === 'elite' && room.name.includes('精英')).length;
  }

  private finishRun(victory: boolean, reason: string) {
    if (this.runEnded) return;
    this.runEnded = true;
    this.flowState = 'ended';
    this.playerActionState = 'dead';
    this.sfx.play(victory ? 'victory' : 'defeat');
    this.player.setVelocity(0, 0);
    this.enemies.getChildren().forEach((enemy) => (enemy as Fighter).setVelocity(0, 0));
    this.bullets.clear(true, true);
    this.destroyBossBar();
    this.doorTween?.stop();
    this.doorTween = undefined;
    this.roomTitleToast?.destroy();
    this.roomTitleToast = undefined;
    this.rewardPanel?.destroy();
    this.rewardPanel = undefined;
    this.eventPanel?.destroy();
    this.eventPanel = undefined;
    this.statusPanel?.destroy();
    this.statusPanel = undefined;
    this.roomText.setVisible(false);
    const endedAt = Date.now();
    const durationSeconds = Math.round((endedAt - this.startedAt) / 1000);
    const boss = this.enemies.getChildren().find((enemy) => (enemy as Fighter).stats.boss) as Fighter | undefined;
    const bossRemainingHpPercent = victory || !boss ? 0 : Math.max(0, (boss.stats.hp / boss.stats.maxHp) * 100);
    const grade = this.getGrade(victory, durationSeconds);
    const visitedRooms = this.getVisitedRooms();
    const routeSummary = this.getRouteSummary(true);
    const run: GameRun = {
      id: `lingxu-${endedAt}`,
      levelId: this.level.id,
      classId: this.playerClass.id,
      className: this.selectedHero.name,
      heroId: this.selectedHero.id,
      heroName: this.selectedHero.name,
      startedAt: new Date(this.startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      durationSeconds,
      victory,
      kills: this.kills,
      elitesDefeated: 0,
      goldEarned: this.gold,
      equipmentFound: 0,
      relicsFound: this.relicState.relics.length,
      eventsTriggered: this.eventStats.triggered,
      bossRemainingHpPercent,
      deathReason: victory ? '源晶净化完成' : reason,
      score: grade === 'A' ? 95 : grade === 'B' ? 82 : grade === 'C' ? 65 : 45,
      routeSummary,
      roomCount: visitedRooms.length,
      eventChoices: this.eventChoiceCount,
      eliteRooms: this.getEliteRoomsVisited(),
      rewardChoices: this.rewardChoiceCount,
      finalRoomType: this.currentRoom.kind,
      reachedBoss: visitedRooms.some((room) => room.kind === 'boss'),
      negativeEvents: this.eventStats.negative,
      combatEvents: this.eventStats.combat,
      wasPoisoned: this.eventStats.poisoned,
      wasCursed: this.eventStats.cursed,
      weaponId: this.selectedWeapon.id,
      weaponName: this.selectedWeapon.name,
      weaponStyle: this.selectedWeapon.styleSummary,
      weaponSummary: this.selectedWeapon.styleSummary
    };
    storageService.saveRun(run);
    this.setGameplayUiVisible(false);
    this.setWorldVisible(true);
    this.settlementPanel?.destroy();
    const panel = this.add.container(480, 300).setDepth(240);
    this.settlementPanel = panel;
    panel.add(this.add.rectangle(0, 0, 720, 470, 0x07101e, 0.98).setStrokeStyle(2, victory ? 0x35e7c4 : 0xff4f7b));
    panel.add(this.add.text(-310, -205, victory ? '源晶已净化' : '遗迹探索终止', { fontFamily: 'monospace', fontSize: '30px', color: '#ffffff' }));
    const relicNames = this.relicState.relics.map((relic) => this.getRewardDisplayName(relic)).join(' / ') || 'None';
    const hasEpic = this.relicState.relics.some((relic) => relic.rarity === 'epic') ? 'Yes' : 'No';
    panel.add(this.add.text(-310, -160, [
      `Result: ${victory ? 'Victory' : 'Defeat'}`,
      `Duration: ${durationSeconds}s`,
      `Kills: ${this.kills}`,
      `Damage Taken: ${this.damageTaken}`,
      `Skill Uses: ${this.skillUses}`,
      `Rooms: ${visitedRooms.length}  Events: ${this.eventStats.triggered}  Elite Rooms: ${this.getEliteRoomsVisited()}`,
      `Negative Events: ${this.eventStats.negative}  Combat Events: ${this.eventStats.combat}`,
      `Statuses: ${this.eventStats.poisoned ? 'Poisoned' : 'No poison'} / ${this.eventStats.cursed ? 'Cursed' : 'No curse'}`,
      `Hero: ${this.selectedHero.name}`,
      `使用武器：${this.selectedWeapon.name}`,
      `流派：${this.selectedWeapon.styleSummary}`,
      `Reward Choices: ${this.rewardChoiceCount}  Relics: ${this.relicState.relics.length}`,
      `Route: ${routeSummary}`,
      `Epic Relic: ${hasEpic}`,
      `Relic List: ${relicNames}`,
      `Final HP: ${Math.max(0, Math.ceil(this.player.stats.hp))}/${this.player.stats.maxHp}  ATK: ${this.player.stats.atk}  DEF: ${this.player.stats.def}`,
      `Build: ${this.getBuildSummary()}`,
      `Reason: ${run.deathReason}`,
      `Grade: ${grade}`
    ], { fontFamily: 'monospace', fontSize: '14px', color: '#dff7ff', lineSpacing: 4, wordWrap: { width: 620 } }));
    panel.add(this.createMenuButton(-105, 198, 170, '重新开始', () => {
      this.settlementPanel?.destroy();
      this.showWeaponSelection();
    }));
    panel.add(this.createMenuButton(105, 198, 170, '返回标题', () => {
      this.settlementPanel?.destroy();
      this.returnToTitle();
    }));
    this.onRunEnd(run.id);
  }
}
