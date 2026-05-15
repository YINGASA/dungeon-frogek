import { ArrowRight, BrainCircuit, Gamepad2, ImagePlus, LineChart } from 'lucide-react';
import { TabId } from '../components/Layout';
import { StatCard } from '../components/StatCard';

export const HomePage = ({ onNavigate }: { onNavigate: (tab: TabId) => void }) => (
  <div className="home">
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">可试玩游戏 + AI 内容生产线</p>
        <h2>AI 驱动的 Roguelite 地牢游戏与内容生产工具</h2>
        <p>这不是单个小游戏，而是一条面向 AI 游戏岗位面试的完整链路：AI 生成关卡、程序化生成素材、JSON 驱动试玩、localStorage 记录数据、规则与 AI 共同给出调优报告。</p>
        <div className="button-row">
          <button onClick={() => onNavigate('assets')}><ImagePlus size={18} />生成资源</button>
          <button onClick={() => onNavigate('designer')}><BrainCircuit size={18} />生成关卡</button>
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
      <StatCard label="核心展示" value="5 个页面" hint="首页 / 游戏 / 策划台 / 资源工坊 / 数据分析" />
      <StatCard label="地牢结构" value="3 层" hint="普通、精英、首领" />
      <StatCard label="AI 兜底" value="Mock 可用" hint="无 API key 也可完整演示" />
      <StatCard label="数据闭环" value="localStorage" hint="对局、资源、关卡、结算" />
    </div>
    <section className="feature-grid">
      {[
        ['可玩 Roguelite', '三职业、技能、装备、遗物、事件、首领三阶段。'],
        ['AI 策划台', '生成 LevelConfig、怪物、装备、文案、平衡说明，支持 JSON 编辑和三方案对比。'],
        ['资源工坊', '程序化 SVG 资源包可直接生成和应用，另附 Blender 低模脚本。'],
        ['数据分析', '读取玩家对局数据，输出胜率、节奏、职业平衡和下一版迭代建议。']
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
      <p>资源工坊生成资源包 {'->'} AI 策划台生成三套方案并应用 {'->'} 游戏页选择职业试玩 {'->'} 数据分析页查看数据与调优报告。</p>
    </section>
  </div>
);
