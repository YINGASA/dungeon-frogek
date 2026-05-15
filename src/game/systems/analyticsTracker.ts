import { GameRun } from '../../types/game';

export const scoreRun = (run: Pick<GameRun, 'victory' | 'kills' | 'goldEarned' | 'relicsFound' | 'bossRemainingHpPercent'>) =>
  Math.max(0, Math.round((run.victory ? 500 : 120) + run.kills * 20 + run.goldEarned + run.relicsFound * 45 - run.bossRemainingHpPercent));
