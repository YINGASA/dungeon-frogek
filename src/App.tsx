import { useState } from 'react';
import { Layout, TabId } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import { DesignerPage } from './pages/DesignerPage';
import { AssetForgePage } from './pages/AssetForgePage';
import { AnalyticsPage } from './pages/AnalyticsPage';

export default function App() {
  const [tab, setTab] = useState<TabId>('home');
  return (
    <Layout active={tab} onTab={setTab}>
      {tab === 'home' && <HomePage onNavigate={setTab} />}
      {tab === 'game' && <GamePage onAnalyze={() => setTab('analytics')} />}
      {tab === 'designer' && <DesignerPage onPlay={() => setTab('game')} />}
      {tab === 'assets' && <AssetForgePage />}
      {tab === 'analytics' && <AnalyticsPage />}
    </Layout>
  );
}
