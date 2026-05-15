import { useState } from 'react';
import { AssetPreview } from '../components/AssetPreview';
import { JsonEditor } from '../components/JsonEditor';
import { apiService } from '../services/apiService';
import { summarizeManifest } from '../services/assetService';
import { storageService } from '../services/storageService';
import { AssetManifest } from '../types/game';

export const AssetForgePage = () => {
  const [theme, setTheme] = useState('赛博修仙');
  const [artStyle, setArtStyle] = useState('pixel');
  const [manifest, setManifest] = useState<AssetManifest | null>(storageService.getAssetManifest());
  const [status, setStatus] = useState(summarizeManifest(manifest));

  const generate = async () => {
    setStatus('资源包生成中...');
    const next = await apiService.generateAssets({ theme, artStyle, assetTypes: ['tileset', 'heroes', 'enemies', 'skills', 'icons'] });
    setManifest(next);
    setStatus('已生成资源包。');
  };
  const apply = () => {
    if (!manifest) return;
    storageService.saveAssetManifest(manifest);
    setStatus('已应用资源包到游戏。游戏会优先尝试 generated 资源，失败时使用内置图形。');
  };
  const download = () => {
    if (!manifest) return;
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'asset-manifest.json';
    link.click();
  };

  return (
    <div className="assets-page">
      <section className="panel">
        <h2>Asset Forge</h2>
        <p>方式 A 使用后端 TypeScript 程序化生成 SVG 资源，方式 B 提供 Blender 低模脚本作为可选资产生产线。</p>
        <div className="form-grid compact">
          <label>主题<input value={theme} onChange={(event) => setTheme(event.target.value)} /></label>
          <label>美术风格<select value={artStyle} onChange={(event) => setArtStyle(event.target.value)}><option>pixel</option><option>low-poly</option><option>anime</option><option>dark fantasy</option><option>Chinese fantasy</option></select></label>
        </div>
        <div className="button-row">
          <button onClick={generate}>生成资源包</button>
          <button onClick={apply}>应用资源包到游戏</button>
          <button onClick={download}>下载 Manifest</button>
        </div>
        <p className="success">{status}</p>
      </section>
      <AssetPreview manifest={manifest} />
      {manifest && <section className="panel"><h3>Manifest JSON</h3><JsonEditor value={manifest} onChange={(value) => setManifest(value as AssetManifest)} /></section>}
    </div>
  );
};
