import { LevelConfig, RoomConfig, TileConfig } from '../../types/game';
import { DEFAULT_EQUIPMENT } from './defaultEquipment';
import { DEFAULT_RELICS } from './defaultRelics';

const baseTiles = (boss = false): TileConfig[] => {
  const tiles: TileConfig[] = [];
  for (let y = 0; y < 10; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      const edge = x === 0 || y === 0 || x === 15 || y === 9;
      tiles.push({ x, y, type: edge ? 'wall' : boss ? 'bossFloor' : 'floor' });
    }
  }
  [
    [7, 0, 'door'],
    [8, 0, 'door'],
    [7, 9, 'door'],
    [8, 9, 'door'],
    [0, 4, 'door'],
    [15, 4, 'door']
  ].forEach(([x, y, type]) => tiles.push({ x: x as number, y: y as number, type: type as TileConfig['type'] }));
  tiles.push({ x: 4, y: 4, type: 'trap' }, { x: 11, y: 6, type: 'trap' });
  return tiles;
};

const room = (floor: number, id: string, name: string, type: RoomConfig['type'], x: number, y: number, connections: string[], enemyIds: string[] = [], eventId?: string): RoomConfig => ({
  id,
  floor,
  name,
  type,
  x,
  y,
  width: 16,
  height: 10,
  connections,
  enemyIds,
  elite: enemyIds.some((enemyId) => enemyId.includes('elite')),
  tiles: [
    ...baseTiles(type === 'boss'),
    ...(type === 'treasure' ? [{ x: 8, y: 5, type: 'chest' as const }] : []),
    ...(type === 'shop' ? [{ x: 8, y: 5, type: 'shop' as const }] : []),
    ...(type === 'boss' ? [{ x: 8, y: 2, type: 'portal' as const }] : [])
  ],
  eventId,
  rewardHint: type === 'treasure' ? '装备或遗物' : undefined
});

export const DEFAULT_LEVEL: LevelConfig = {
  id: 'default-data-demon',
  name: 'AI 地牢熔炉：数据魔君协议',
  theme: '赛博地牢',
  difficulty: 'normal',
  targetAudience: 'midcore',
  durationMinutes: 8,
  artStyle: 'pixel',
  gameplayFocus: 'combat',
  worldIntro: '玩家进入一座被训练数据污染的地牢，房间、怪物和事件都由失控的内容生成核心重组。',
  floors: [
    {
      floorIndex: 1,
      name: '普通地牢',
      theme: '断线的训练集',
      rooms: [
        room(1, '1-1', '入口缓存区', 'battle', 0, 0, ['1-2', '1-3'], ['goblin', 'slime']),
        room(1, '1-2', '补给宝箱', 'treasure', 1, 0, ['1-1', '1-4']),
        room(1, '1-3', '数据裂缝', 'event', 0, 1, ['1-1', '1-4'], [], 'data-rift'),
        room(1, '1-4', '训练样本厅', 'battle', 1, 1, ['1-2', '1-3', '2-1'], ['goblin', 'skeleton-archer', 'slime'])
      ]
    },
    {
      floorIndex: 2,
      name: '精英地牢',
      theme: '过拟合圣堂',
      rooms: [
        room(2, '2-1', '精英门厅', 'battle', 0, 0, ['1-4', '2-2', '2-3'], ['elite-guardian', 'cultist']),
        room(2, '2-2', '神秘商店', 'shop', 1, 0, ['2-1', '2-4']),
        room(2, '2-3', '古老祭坛', 'event', 0, 1, ['2-1'], [], 'ancient-altar'),
        room(2, '2-4', '精英回廊', 'battle', 1, 1, ['2-2', '3-1'], ['elite-warden', 'summoner-cultist', 'skeleton-archer'])
      ]
    },
    {
      floorIndex: 3,
      name: '首领房',
      theme: '推理核心',
      rooms: [
        room(3, '3-1', '最后休息点', 'rest', 0, 0, ['2-4', '3-2']),
        room(3, '3-2', '数据魔君王座', 'boss', 1, 0, ['3-1'], ['data-demon'])
      ]
    }
  ],
  enemies: [
    { id: 'goblin', name: '地精', role: 'melee', hp: 34, attack: 10, defense: 2, moveSpeed: 76, attackRange: 32, attackCooldown: 1100, goldReward: 8, expReward: 10 },
    { id: 'slime', name: '史莱姆', role: 'melee', hp: 42, attack: 8, defense: 3, moveSpeed: 54, attackRange: 30, attackCooldown: 1350, goldReward: 7, expReward: 9, statusEffect: 'poison' },
    { id: 'skeleton-archer', name: '骷髅射手', role: 'ranged', hp: 30, attack: 12, defense: 1, moveSpeed: 64, attackRange: 210, attackCooldown: 1500, goldReward: 10, expReward: 14 },
    { id: 'cultist', name: '数据信徒', role: 'ranged', hp: 38, attack: 13, defense: 2, moveSpeed: 68, attackRange: 180, attackCooldown: 1350, goldReward: 12, expReward: 15, statusEffect: 'burn' },
    { id: 'summoner-cultist', name: '召唤信徒', role: 'summoner', hp: 62, attack: 10, defense: 4, moveSpeed: 52, attackRange: 170, attackCooldown: 1800, goldReward: 18, expReward: 28 },
    { id: 'crawler', name: '爬行样本', role: 'melee', hp: 28, attack: 11, defense: 1, moveSpeed: 92, attackRange: 26, attackCooldown: 850, goldReward: 7, expReward: 11 },
    { id: 'byte-wisp', name: '字节幽火', role: 'ranged', hp: 24, attack: 14, defense: 0, moveSpeed: 80, attackRange: 190, attackCooldown: 1250, goldReward: 9, expReward: 12, statusEffect: 'freeze' },
    { id: 'shield-bug', name: '护盾虫', role: 'melee', hp: 55, attack: 9, defense: 7, moveSpeed: 46, attackRange: 30, attackCooldown: 1200, goldReward: 11, expReward: 16 },
    { id: 'elite-guardian', name: '精英守卫', role: 'elite', hp: 98, attack: 18, defense: 6, moveSpeed: 68, attackRange: 44, attackCooldown: 900, goldReward: 28, expReward: 38, statusEffect: 'shield' },
    { id: 'elite-warden', name: '精英典狱官', role: 'elite', hp: 120, attack: 20, defense: 7, moveSpeed: 62, attackRange: 52, attackCooldown: 950, goldReward: 36, expReward: 46, statusEffect: 'burn' }
  ],
  boss: {
    id: 'data-demon',
    name: '数据魔君',
    chineseName: '数据魔君',
    role: 'elite',
    hp: 360,
    attack: 22,
    defense: 8,
    moveSpeed: 58,
    attackRange: 190,
    attackCooldown: 1050,
    goldReward: 120,
    expReward: 120,
    phases: [
      { threshold: 1, name: '阶段一：召唤', mechanics: ['普通攻击', '召唤小怪'] },
      { threshold: 0.6, name: '阶段二：弹幕', mechanics: ['范围技能', '环形弹幕'] },
      { threshold: 0.25, name: '阶段三：狂暴', mechanics: ['攻击速度提升', '连续追击'] }
    ]
  },
  items: [
    { id: 'small-potion', name: '小型药水', description: '回复 30 点生命。', effect: 'heal' },
    { id: 'logic-key', name: '逻辑钥匙', description: '打开隐藏缓存。', effect: 'unlock' }
  ],
  equipment: DEFAULT_EQUIPMENT,
  relics: DEFAULT_RELICS,
  events: [
    {
      id: 'mysterious-merchant',
      type: 'mysteriousMerchant',
      title: '神秘商人',
      description: '一名披着调试日志的商人递出三份交易。',
      choices: [
        { id: 'buy-relic', text: '花 25 金购买遗物', result: '获得随机遗物。', effects: { gold: -25, relicId: 'lucky-dice' } },
        { id: 'steal', text: '偷走补给', result: '获得装备，但生成敌人。', effects: { equipmentId: 'arc-blade', spawnEnemyId: 'crawler' } }
      ]
    },
    {
      id: 'ancient-altar',
      type: 'ancientAltar',
      title: '古老祭坛',
      description: '祭坛要求你用生命交换数值祝福。',
      choices: [
        { id: 'blood-atk', text: '献祭 18 点生命，提升攻击', result: '攻击永久 +4。', effects: { hp: -18, attack: 4 } },
        { id: 'pray', text: '安静祈祷', result: '获得护盾遗物。', effects: { relicId: 'ancient-shield' } }
      ]
    },
    {
      id: 'injured-npc',
      type: 'injuredNpc',
      title: '受伤 NPC',
      description: '内容编辑被困在房间角落，请求治疗。',
      choices: [
        { id: 'help', text: '给予帮助', result: '失去少量生命，获得金币。', effects: { hp: -8, gold: 35 } },
        { id: 'ignore', text: '保持警惕离开', result: '无事发生。', effects: {} }
      ]
    },
    {
      id: 'corrupted-chest',
      type: 'corruptedChest',
      title: '被污染的宝箱',
      description: '宝箱发出不稳定的蓝光。',
      choices: [
        { id: 'open', text: '强行打开', result: '获得装备但中毒。', effects: { equipmentId: 'mirror-vest', hp: -12 } },
        { id: 'purify', text: '净化后打开', result: '获得少量金币。', effects: { gold: 18 } }
      ]
    },
    {
      id: 'data-rift',
      type: 'dataRift',
      title: '数据裂缝',
      description: '裂缝投影出一个尚未发布的版本。',
      choices: [
        { id: 'enter', text: '进入裂缝', result: '获得高额奖励并遭遇敌人。', effects: { gold: 40, spawnEnemyId: 'byte-wisp' } },
        { id: 'stabilize', text: '稳定裂缝', result: '防御永久 +3。', effects: { defense: 3 } },
        { id: 'close', text: '关闭裂缝', result: '回复生命。', effects: { hp: 25 } }
      ]
    }
  ],
  npcDialogues: [
    { id: 'npc-mentor', speaker: '迷失策划', triggerRoomType: 'event', lines: ['别相信所有生成内容。先验证连通性，再谈创意。', '数据会告诉你玩家卡在哪里。'] }
  ],
  operationCopy: {
    headline: '数据魔君限时讨伐开启',
    pushNotification: '新的地牢配置已生成，回来测试你的构筑吧。',
    eventBanner: 'AI 地牢熔炉：三层挑战、随机事件、首领机制全开放',
    socialPost: '我用 AI 生成了一座会反馈数据的 Roguelite 地牢。'
  },
  balanceNotes: ['普通怪血量低，突出节奏。', '第二层精英怪提供压力峰值。', '首领三阶段用于展示机制设计。'],
  designNotes: ['房间制地图便于 AI JSON 驱动。', '资源生成和关卡生成可以在面试中串成生产管线。']
};
