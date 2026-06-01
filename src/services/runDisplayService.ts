import { GameRun } from '../types/game';

const victoryReasonPattern = /源晶净化完成|胜利|通关|Boss 击败|boss 击败|victory|win|won|cleared|clear/i;
const defeatReasonPattern = /失败|defeat|death|dead|lose|lost|failed/i;
const cleanLabel = (value: string | undefined, fallback: string) => {
  const label = value?.trim();
  return label || fallback;
};

type LegacyRunFields = GameRun & {
  result?: string;
  win?: boolean;
  cleared?: boolean;
  deathCause?: string;
  reason?: string;
};

export const isVictoryRun = (run: GameRun) => {
  const legacyRun = run as LegacyRunFields;
  if (typeof legacyRun.victory === 'boolean') return legacyRun.victory;
  if (typeof legacyRun.win === 'boolean') return legacyRun.win;
  if (typeof legacyRun.cleared === 'boolean') return legacyRun.cleared;
  const result = legacyRun.result ?? '';
  if (!result) return false;
  return victoryReasonPattern.test(result) && !defeatReasonPattern.test(result);
};

export const isFailedRun = (run: GameRun) => {
  const legacyRun = run as LegacyRunFields;
  if (
    typeof legacyRun.victory === 'boolean'
    || typeof legacyRun.win === 'boolean'
    || typeof legacyRun.cleared === 'boolean'
  ) {
    return !isVictoryRun(run);
  }
  const result = legacyRun.result ?? '';
  return defeatReasonPattern.test(result) && !victoryReasonPattern.test(result);
};

export const getFailureReason = (run: GameRun) => {
  const legacyRun = run as LegacyRunFields;
  const reason = cleanLabel(legacyRun.deathReason || legacyRun.deathCause || legacyRun.reason, '');
  return reason && !victoryReasonPattern.test(reason) ? reason : '未知失败原因';
};

export const getRunRoleName = (run: GameRun) => cleanLabel(run.heroName || run.className, '未知角色');
