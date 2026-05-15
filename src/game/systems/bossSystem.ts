import { BossConfig } from '../../types/game';

export const bossPhase = (boss: BossConfig, hpPercent: number) => [...boss.phases].reverse().find((phase) => hpPercent <= phase.threshold) ?? boss.phases[0];
