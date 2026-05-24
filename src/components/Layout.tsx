import { BarChart3, Gamepad2, Home } from 'lucide-react';
import { ReactNode } from 'react';

export type TabId = 'home' | 'game' | 'designer' | 'assets' | 'analytics';

const tabs = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'game', label: '游戏试玩', icon: Gamepad2 },
  { id: 'analytics', label: '数据分析', icon: BarChart3 }
] as const;

export const Layout = ({ active, onTab, children }: { active: TabId; onTab: (tab: TabId) => void; children: ReactNode }) => (
  <div className="app-shell">
    <header className="topbar">
      <div>
        <p className="eyebrow">线上试玩版</p>
        <h1>灵墟地牢</h1>
      </div>
      <nav className="tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} className={active === tab.id ? 'active' : ''} onClick={() => onTab(tab.id)} title={tab.label}>
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
    <main>{children}</main>
  </div>
);
