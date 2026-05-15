import { SkillConfig } from '../../types/game';

export const skillReady = (skill: SkillConfig, now: number, cooldownUntil: number) => now >= cooldownUntil && skill.cooldown >= 0;
