import { ArrowRight, Gamepad2, LineChart } from 'lucide-react';
import { TabId } from '../components/Layout';
import { StatCard } from '../components/StatCard';

export const HomePage = ({ onNavigate }: { onNavigate: (tab: TabId) => void }) => (
  <div className="home">
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">第一关试玩版</p>
        <h2>灵墟地牢：俯视角动作 Roguelite 地牢探索</h2>
        <p>当前版本聚焦第一关试玩体验：选择武器，探索随机路线，在普通、高级、精英战斗房中成长，通过事件与遗物构筑角色，最终挑战源晶核心。</p>
        <div className="button-row">
          <button onClick={() => onNavigate('game')}><Gamepad2 size={18} />开始试玩</button>
        </div>
      </div>
      <div className="hero-board">
        <div className="dungeon-grid">
          {Array.from({ length: 80 }).map((_, index) => <span key={index} className={index % 13 === 0 ? 'danger' : index % 9 === 0 ? 'gold' : index % 7 === 0 ? 'cyan' : ''} />)}
        </div>
      </div>
    </section>
    <div className="stats-row">
      <StatCard label="当前版本" value="v1.6.10" hint="线上试玩分支 playable" />
      <StatCard label="地牢路线" value="6-8 房" hint="普通、高级、精英、事件、Boss" />
      <StatCard label="武器选择" value="4 种" hint="短剑、重刃、长枪、双匕" />
      <StatCard label="成长记录" value="localStorage" hint="对局、金币、遗物、结算" />
    </div>
    <section className="feature-grid">
      {[
        ['当前试玩', '第一关完整流程：出生房、战斗房、事件房、Boss 房和结算。'],
        ['四种武器', '短剑、重刃、长枪、双匕，各自拥有不同攻击节奏和手感。'],
        ['随机路线', '每局 6-8 个房间，包含普通、高级、精英、事件和 Boss 节点。'],
        ['战斗成长', '奖励三选一、遗物、金币、清房收益和构筑摘要。'],
        ['容量护盾', 'L 护盾提供 30 点容量吸收，增加容错但不能无脑站桩。'],
        ['当前版本', 'v1.6.10：已完成首页导航清理，并修正数据分析页常见失败原因统计。']
      ].map(([title, body]) => (
        <article className="panel" key={title}>
          <h3>{title}</h3>
          <p>{body}</p>
          <ArrowRight size={18} />
        </article>
      ))}
    </section>
    <section className="panel">
      <h3><LineChart size={18} /> 推荐演示顺序</h3>
      <p>选择武器 {'->'} 进入地牢 {'->'} 清理战斗房 {'->'} 选择奖励和遗物 {'->'} 处理事件分支 {'->'} 挑战源晶核心。</p>
    </section>
  </div>
);
