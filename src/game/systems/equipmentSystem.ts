import { EquipmentConfig } from '../../types/game';

export const equipmentScore = (item: EquipmentConfig) => item.attackBonus * 3 + item.defenseBonus * 2 + item.hpBonus + item.critRateBonus * 100 + item.speedBonus;
