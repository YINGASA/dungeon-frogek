import { useMemo, useState } from 'react';
import { RunTable } from '../components/RunTable';
import { StatCard } from '../components/StatCard';
import { apiService } from '../services/apiService';
import { getFailureReason, getRunRoleName, isFailedRun, isVictoryRun } from '../services/runDisplayService';
import { storageService } from '../services/storageService';
import { AnalysisReport, GameRun } from '../types/game';

const pct = (value: number) => `${(value * 100).toFixed(1)}%`;
const toFiniteNumber = (value: unknown, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const finiteValues = (runs: GameRun[], key: keyof GameRun) => runs.map((run) => toFiniteNumber(run[key], NaN)).filter(Number.isFinite);
const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const formatAverage = (runs: GameRun[], key: keyof GameRun, formatter = (value: number) => value.toFixed(1)) => {
  const values = finiteValues(runs, key);
  return values.length ? formatter(average(values)) : '暂无';
};
const formatAveragePercent = (runs: GameRun[], key: keyof GameRun) => {
  const values = finiteValues(runs, key).map((value) => clamp(value, 0, 100));
  return values.length ? `${average(values).toFixed(1)}%` : '暂无';
};
const reportSections: { key: keyof AnalysisReport; title: string }[] = [
  { key: 'summary', title: '综合摘要' },
  { key: 'balanceIssues', title: '平衡问题' },
  { key: 'pacingIssues', title: '节奏问题' },
  { key: 'classBalanceIssues', title: '角色平衡' },
  { key: 'artSuggestions', title: '美术建议' },
  { key: 'operationSuggestions', title: '运营建议' },
  { key: 'nextIterationPlan', title: '下一步计划' }
];

export const AnalyticsPage = () => {
  const [runs, setRuns] = useState<GameRun[]>(storageService.getRuns());
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [status, setStatus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const level = useMemo(() => storageService.getLevel(), []);
  const hasRuns = runs.length > 0;
  const wins = runs.filter(isVictoryRun);
  const winRate = runs.length ? wins.length / runs.length : 0;
  const bossRemainingValues = finiteValues(runs, 'bossRemainingHpPercent').map((value) => clamp(value, 0, 100));
  const bossRemainingAverage = bossRemainingValues.length ? average(bossRemainingValues) : 0;
  const durationValues = finiteValues(runs, 'durationSeconds');
  const eventValues = finiteValues(runs, 'eventsTriggered');
  const experienceScore = hasRuns ? clamp(Math.round(70 + winRate * 15 - Math.max(0, bossRemainingAverage - 35) / 3), 0, 100) : '暂无';
  const failureRuns = runs.filter(isFailedRun);
  const failureReasons = failureRuns.reduce<Record<string, number>>((map, run) => {
    const reason = getFailureReason(run);
    return { ...map, [reason]: (map[reason] ?? 0) + 1 };
  }, {});
  const commonFailureReason = Object.entries(failureReasons).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '暂无失败记录';
  const roleRates = Array.from(new Set(runs.map(getRunRoleName))).map((name) => {
    const list = runs.filter((run) => getRunRoleName(run) === name);
    return `${name}: ${pct(list.filter(isVictoryRun).length / list.length)}`;
  }).join(' / ');
  const rules = hasRuns ? [
    winRate < 0.3 && '通关率低于 30%，怪物过强或补给不足。',
    winRate > 0.8 && '通关率高于 80%，难度不足。',
    bossRemainingValues.length > 0 && bossRemainingAverage > 50 && '首领平均剩余血量高于 50%，首领过强。',
    durationValues.length > 0 && average(durationValues) < level.durationMinutes * 60 * 0.5 && '平均游戏时长低于目标时长 50%，关卡过短。',
    eventValues.length > 0 && average(eventValues) < 0.5 && '事件触发率低，地图路径设计不足。',
    `角色胜率 ${roleRates}`
  ].filter(Boolean) : ['暂无对局数据。完成一次试玩结算后，这里会显示规则诊断。'];
  const generate = async () => {
    if (!hasRuns) {
      setReport(null);
      setStatus('暂无对局数据，先完成一次试玩结算后再生成分析报告。');
      return;
    }
    setIsGenerating(true);
    setStatus('正在生成分析报告...');
    try {
      setReport(await apiService.analyzeRuns(level, runs));
      setStatus('分析报告已生成。');
    } catch (error) {
      setReport(null);
      setStatus(error instanceof Error ? `分析报告生成失败：${error.message}` : '分析报告生成失败。');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="analytics">
      <section className="stats-row">
        <StatCard label="总试玩次数" value={runs.length} />
        <StatCard label="通关次数" value={wins.length} />
        <StatCard label="通关率" value={pct(winRate)} />
        <StatCard label="平均时长" value={formatAverage(runs, 'durationSeconds', (value) => `${(value / 60).toFixed(1)}m`)} />
        <StatCard label="平均击杀" value={formatAverage(runs, 'kills')} />
        <StatCard label="平均金币" value={formatAverage(runs, 'goldEarned')} />
        <StatCard label="平均遗物" value={formatAverage(runs, 'relicsFound')} />
        <StatCard label="常见失败原因" value={commonFailureReason} />
        <StatCard label="首领剩余" value={formatAveragePercent(runs, 'bossRemainingHpPercent')} />
        <StatCard label="体验评分" value={experienceScore} />
      </section>
      <section className="panel">
        <div className="toolbar-row">
          <h2>数据分析</h2>
          <div className="button-row">
            <button onClick={generate} disabled={isGenerating}>{isGenerating ? '生成中...' : '生成 AI 分析报告'}</button>
            <button onClick={() => { storageService.clearRuns(); setRuns([]); setReport(null); setStatus('对局数据已清空。'); }}>清空数据</button>
          </div>
        </div>
        {status && <p className="success">{status}</p>}
        <div className="tag-cloud">{rules.map((rule) => <span key={String(rule)}>{rule}</span>)}</div>
      </section>
      <section className="panel"><h3>最近 10 局</h3><RunTable runs={runs} /></section>
      {report && <section className="preview-grid">
        {reportSections.map(({ key, title }) => {
          const value = report[key];
          const items = Array.isArray(value) ? value.filter(Boolean) : [value || '暂无摘要。'];
          return (
            <article className="panel" key={key}>
              <h3>{title}</h3>
              {items.length ? items.map((item) => <p key={item}>{item}</p>) : <p>暂无建议。</p>}
            </article>
          );
        })}
      </section>}
    </div>
  );
};
