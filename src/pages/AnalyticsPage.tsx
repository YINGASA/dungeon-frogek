import { useMemo, useState } from 'react';
import { RunTable } from '../components/RunTable';
import { StatCard } from '../components/StatCard';
import { apiService } from '../services/apiService';
import { storageService } from '../services/storageService';
import { AnalysisReport, GameRun } from '../types/game';

const pct = (value: number) => `${(value * 100).toFixed(1)}%`;
const avg = (runs: GameRun[], key: keyof GameRun) => runs.length ? runs.reduce((sum, run) => sum + Number(run[key]), 0) / runs.length : 0;
const victoryReasonPattern = /源晶净化完成|胜利|通关|Boss 击败|boss 击败/i;

const isFailedRun = (run: GameRun) => {
  const legacyRun = run as GameRun & { result?: string; win?: boolean; cleared?: boolean };
  if (typeof legacyRun.victory === 'boolean') return !legacyRun.victory;
  if (typeof legacyRun.win === 'boolean') return !legacyRun.win;
  if (typeof legacyRun.cleared === 'boolean') return !legacyRun.cleared;
  const result = legacyRun.result?.toLowerCase();
  if (!result) return false;
  if (['胜利', 'victory', 'win', 'won', 'cleared', 'clear', '通关'].some((text) => result.includes(text.toLowerCase()))) return false;
  return ['失败', 'defeat', 'death', 'dead', 'lose', 'lost', 'failed'].some((text) => result.includes(text.toLowerCase()));
};

const getFailureReason = (run: GameRun) => {
  const legacyRun = run as GameRun & { deathCause?: string; reason?: string };
  const reason = legacyRun.deathReason || legacyRun.deathCause || legacyRun.reason || '';
  return reason && !victoryReasonPattern.test(reason) ? reason : '未知失败原因';
};

export const AnalyticsPage = () => {
  const [runs, setRuns] = useState<GameRun[]>(storageService.getRuns());
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const level = useMemo(() => storageService.getLevel(), []);
  const wins = runs.filter((run) => run.victory);
  const winRate = runs.length ? wins.length / runs.length : 0;
  const failureRuns = runs.filter(isFailedRun);
  const failureReasons = failureRuns.reduce<Record<string, number>>((map, run) => {
    const reason = getFailureReason(run);
    return { ...map, [reason]: (map[reason] ?? 0) + 1 };
  }, {});
  const commonFailureReason = Object.entries(failureReasons).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '暂无失败记录';
  const classRates = ['剑士', '法师', '游侠'].map((name) => {
    const list = runs.filter((run) => run.className === name);
    return `${name}: ${list.length ? pct(list.filter((run) => run.victory).length / list.length) : 'N/A'}`;
  }).join(' / ');
  const rules = [
    winRate < 0.3 && '通关率低于 30%，怪物过强或补给不足。',
    winRate > 0.8 && '通关率高于 80%，难度不足。',
    avg(runs, 'bossRemainingHpPercent') > 50 && '首领平均剩余血量高于 50%，首领过强。',
    avg(runs, 'durationSeconds') < level.durationMinutes * 60 * 0.5 && '平均游戏时长低于目标时长 50%，关卡过短。',
    avg(runs, 'eventsTriggered') < 0.5 && '事件触发率低，地图路径设计不足。',
    classRates
  ].filter(Boolean);
  const generate = async () => setReport(await apiService.analyzeRuns(level, runs));

  return (
    <div className="analytics">
      <section className="stats-row">
        <StatCard label="总试玩次数" value={runs.length} />
        <StatCard label="通关次数" value={wins.length} />
        <StatCard label="通关率" value={pct(winRate)} />
        <StatCard label="平均时长" value={`${(avg(runs, 'durationSeconds') / 60).toFixed(1)}m`} />
        <StatCard label="平均击杀" value={avg(runs, 'kills').toFixed(1)} />
        <StatCard label="平均金币" value={avg(runs, 'goldEarned').toFixed(1)} />
        <StatCard label="平均遗物" value={avg(runs, 'relicsFound').toFixed(1)} />
        <StatCard label="常见失败原因" value={commonFailureReason} />
        <StatCard label="首领剩余" value={`${avg(runs, 'bossRemainingHpPercent').toFixed(1)}%`} />
        <StatCard label="体验评分" value={Math.round(70 + winRate * 15 - Math.max(0, avg(runs, 'bossRemainingHpPercent') - 35) / 3)} />
      </section>
      <section className="panel">
        <div className="toolbar-row">
          <h2>Analytics</h2>
          <div className="button-row"><button onClick={generate}>生成 AI 分析报告</button><button onClick={() => { storageService.clearRuns(); setRuns([]); }}>清空数据</button></div>
        </div>
        <div className="tag-cloud">{rules.map((rule) => <span key={String(rule)}>{rule}</span>)}</div>
      </section>
      <section className="panel"><h3>最近 10 局</h3><RunTable runs={runs} /></section>
      {report && <section className="preview-grid">
        {Object.entries(report).map(([key, value]) => (
          <article className="panel" key={key}>
            <h3>{key}</h3>
            {Array.isArray(value) ? value.map((item) => <p key={item}>{item}</p>) : <p>{value}</p>}
          </article>
        ))}
      </section>}
    </div>
  );
};
