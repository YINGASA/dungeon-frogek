import { GameRun } from '../types/game';
import { getRunRoleName, isVictoryRun } from '../services/runDisplayService';

const toFiniteNumber = (value: unknown, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};
const clampPercent = (value: unknown) => Math.min(100, Math.max(0, toFiniteNumber(value)));
const formatScore = (value: unknown) => {
  const score = Number(value);
  return Number.isFinite(score) ? score : '暂无';
};
const formatDuration = (seconds: unknown) => {
  const duration = Math.max(0, Math.round(toFiniteNumber(seconds)));
  return `${Math.floor(duration / 60)}m ${duration % 60}s`;
};

export const RunTable = ({ runs }: { runs: GameRun[] }) => (
  <div className="table-wrap">
    <table>
      <thead>
        <tr>
          <th>结果</th>
          <th>角色</th>
          <th>时长</th>
          <th>击杀</th>
          <th>金币</th>
          <th>遗物</th>
          <th>首领血量</th>
          <th>评分</th>
        </tr>
      </thead>
      <tbody>
        {!runs.length && (
          <tr>
            <td colSpan={8}>暂无对局记录。完成一次试玩结算后会显示最近 10 局。</td>
          </tr>
        )}
        {runs.slice(0, 10).map((run) => (
          <tr key={run.id}>
            <td>{isVictoryRun(run) ? '胜利' : '失败'}</td>
            <td>{getRunRoleName(run)}</td>
            <td>{formatDuration(run.durationSeconds)}</td>
            <td>{toFiniteNumber(run.kills)}</td>
            <td>{toFiniteNumber(run.goldEarned)}</td>
            <td>{toFiniteNumber(run.relicsFound)}</td>
            <td>{clampPercent(run.bossRemainingHpPercent).toFixed(0)}%</td>
            <td>{formatScore(run.score)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
