import { GameRun } from '../types/game';
import { getRunResultLabel, getRunRoleName } from '../services/runDisplayService';

const toFiniteNumber = (value: unknown, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};
const isFiniteNumber = (value: unknown) => Number.isFinite(Number(value));
const formatNumber = (value: unknown) => (isFiniteNumber(value) ? Number(value) : '暂无');
const formatPercent = (value: unknown) => {
  if (!isFiniteNumber(value)) return '暂无';
  return `${Math.min(100, Math.max(0, Number(value))).toFixed(0)}%`;
};
const formatDuration = (seconds: unknown) => {
  if (!isFiniteNumber(seconds)) return '暂无';
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
            <td>{getRunResultLabel(run)}</td>
            <td>{getRunRoleName(run)}</td>
            <td>{formatDuration(run.durationSeconds)}</td>
            <td>{formatNumber(run.kills)}</td>
            <td>{formatNumber(run.goldEarned)}</td>
            <td>{formatNumber(run.relicsFound)}</td>
            <td>{formatPercent(run.bossRemainingHpPercent)}</td>
            <td>{formatNumber(run.score)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
