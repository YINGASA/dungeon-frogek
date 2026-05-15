import { EquipmentConfig } from '../../types/game';

export const DEFAULT_EQUIPMENT: EquipmentConfig[] = [
  { id: 'rust-sword', name: '锈蚀长剑', slot: 'weapon', rarity: 'common', attackBonus: 4, defenseBonus: 0, hpBonus: 0, critRateBonus: 0, speedBonus: 0 },
  { id: 'arc-blade', name: '电弧利刃', slot: 'weapon', rarity: 'rare', attackBonus: 8, defenseBonus: 0, hpBonus: 0, critRateBonus: 0.04, speedBonus: 0 },
  { id: 'meteor-staff', name: '陨星法杖', slot: 'weapon', rarity: 'epic', attackBonus: 12, defenseBonus: 0, hpBonus: 0, critRateBonus: 0.06, speedBonus: 0 },
  { id: 'dragon-code-bow', name: '龙码长弓', slot: 'weapon', rarity: 'legendary', attackBonus: 16, defenseBonus: 0, hpBonus: 0, critRateBonus: 0.1, speedBonus: 8 },
  { id: 'patched-mail', name: '修补锁甲', slot: 'armor', rarity: 'common', attackBonus: 0, defenseBonus: 4, hpBonus: 15, critRateBonus: 0, speedBonus: -4 },
  { id: 'mirror-vest', name: '镜面护甲', slot: 'armor', rarity: 'rare', attackBonus: 0, defenseBonus: 6, hpBonus: 25, critRateBonus: 0, speedBonus: 0 },
  { id: 'boss-scale-armor', name: '魔君鳞甲', slot: 'armor', rarity: 'epic', attackBonus: 0, defenseBonus: 9, hpBonus: 40, critRateBonus: 0, speedBonus: -5 },
  { id: 'swift-boots', name: '疾行短靴', slot: 'accessory', rarity: 'common', attackBonus: 0, defenseBonus: 0, hpBonus: 0, critRateBonus: 0.02, speedBonus: 18 },
  { id: 'neon-amulet', name: '霓虹护符', slot: 'accessory', rarity: 'rare', attackBonus: 2, defenseBonus: 2, hpBonus: 10, critRateBonus: 0.03, speedBonus: 8 },
  { id: 'singularity-ring', name: '奇点戒指', slot: 'accessory', rarity: 'legendary', attackBonus: 8, defenseBonus: 3, hpBonus: 20, critRateBonus: 0.08, speedBonus: 10 }
];
