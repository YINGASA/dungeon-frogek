export const calculateDamage = (attack: number, defense: number, crit = false) => Math.max(1, Math.round((attack - defense) * (crit ? 1.5 : 1)));
