import { PlayerClassConfig } from '../../types/game';

export const PLAYER_CLASSES: PlayerClassConfig[] = [
  {
    id: 'knight',
    name: '剑士',
    hp: 150,
    attack: 18,
    defense: 8,
    speed: 165,
    critRate: 0.12,
    skills: [
      { id: 'slash', name: '斩击', description: '近战斩击', key: 'J', cooldown: 360, damageMultiplier: 1, range: 56, radius: 34 },
      { id: 'dashStrike', name: '冲刺斩', description: '冲刺斩', key: 'K', cooldown: 2400, damageMultiplier: 1.5, range: 110, radius: 42 },
      { id: 'guard', name: '守护', description: '短时间减伤并获得护盾', key: 'L', cooldown: 7000, damageMultiplier: 0, range: 0, statusEffect: 'shield' },
      { id: 'whirlwind', name: '旋风斩', description: '范围旋风斩', key: 'I', cooldown: 12000, damageMultiplier: 2.2, range: 82, radius: 82, ultimate: true }
    ]
  },
  {
    id: 'mage',
    name: '法师',
    hp: 105,
    attack: 24,
    defense: 4,
    speed: 155,
    critRate: 0.16,
    skills: [
      { id: 'magicBolt', name: '魔法弹', description: '魔法弹', key: 'J', cooldown: 420, damageMultiplier: 1, range: 230 },
      { id: 'fireball', name: '火球术', description: '范围火球附带燃烧', key: 'K', cooldown: 3000, damageMultiplier: 1.45, range: 240, radius: 64, statusEffect: 'burn' },
      { id: 'frostNova', name: '冰霜新星', description: '环形冰冻', key: 'L', cooldown: 6500, damageMultiplier: 0.8, range: 100, radius: 110, statusEffect: 'freeze' },
      { id: 'meteor', name: '陨石术', description: '大范围陨石', key: 'I', cooldown: 13000, damageMultiplier: 2.8, range: 260, radius: 105, statusEffect: 'burn', ultimate: true }
    ]
  },
  {
    id: 'ranger',
    name: '游侠',
    hp: 120,
    attack: 20,
    defense: 5,
    speed: 190,
    critRate: 0.22,
    skills: [
      { id: 'arrowShot', name: '箭矢射击', description: '远程箭矢', key: 'J', cooldown: 330, damageMultiplier: 1, range: 260 },
      { id: 'multiShot', name: '多重射击', description: '三向箭', key: 'K', cooldown: 2800, damageMultiplier: 0.9, range: 240 },
      { id: 'roll', name: '翻滚', description: '翻滚闪避', key: 'L', cooldown: 5200, damageMultiplier: 0, range: 120 },
      { id: 'arrowRain', name: '箭雨', description: '范围箭雨', key: 'I', cooldown: 11500, damageMultiplier: 2.1, range: 230, radius: 95, ultimate: true }
    ]
  }
];
