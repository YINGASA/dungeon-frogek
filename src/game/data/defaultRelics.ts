import { RelicConfig } from '../../types/game';

export const DEFAULT_RELICS: RelicConfig[] = [
  { id: 'blood-ring', name: '血环', description: '击杀敌人回复 5 点生命。', rarity: 'rare', effectType: 'killHeal', value: 5 },
  { id: 'fire-core', name: '火焰核心', description: '火焰伤害提高 35%。', rarity: 'rare', effectType: 'fireBoost', value: 0.35 },
  { id: 'lucky-dice', name: '幸运骰子', description: '事件正向奖励提高 25%。', rarity: 'epic', effectType: 'eventBonus', value: 0.25 },
  { id: 'greedy-pouch', name: '贪婪钱袋', description: '金币收益提高 40%，受到伤害提高 15%。', rarity: 'epic', effectType: 'goldBoostDamageTaken', value: 0.4 },
  { id: 'broken-charm', name: '破碎护符', description: '低血量时攻击提高 30%。', rarity: 'rare', effectType: 'lowHpAttack', value: 0.3 },
  { id: 'ice-crystal', name: '寒冰晶体', description: '攻击有概率冰冻敌人。', rarity: 'rare', effectType: 'freezeChance', value: 0.18 },
  { id: 'ancient-shield', name: '古代护盾', description: '进入房间获得 18 点护盾。', rarity: 'epic', effectType: 'roomShield', value: 18 },
  { id: 'hunter-mark', name: '猎手印记', description: '对首领伤害提高 25%。', rarity: 'legendary', effectType: 'bossDamage', value: 0.25 }
];
