import { GameRun } from '../types/game';

export const RunTable = ({ runs }: { runs: GameRun[] }) => (
  <div className="table-wrap">
    <table>
      <thead>
        <tr>
          <th>结果</th>
          <th>职业</th>
          <th>时长</th>
          <th>击杀</th>
          <th>金币</th>
          <th>遗物</th>
          <th>首领血量</th>
          <th>评分</th>
        </tr>
      </thead>
      <tbody>
        {runs.slice(0, 10).map((run) => (
          <tr key={run.id}>
            <td>{run.victory ? '胜利' : '失败'}</td>
            <td>{run.className}</td>
            <td>{Math.round(run.durationSeconds / 60)}m {run.durationSeconds % 60}s</td>
            <td>{run.kills}</td>
            <td>{run.goldEarned}</td>
            <td>{run.relicsFound}</td>
            <td>{run.bossRemainingHpPercent.toFixed(0)}%</td>
            <td>{run.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
