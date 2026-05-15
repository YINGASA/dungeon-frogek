import { ChangeEvent, useState } from 'react';
import { ConfigPreview } from '../components/ConfigPreview';
import { JsonEditor } from '../components/JsonEditor';
import { apiService } from '../services/apiService';
import { storageService } from '../services/storageService';
import { validateLevelConfigClient } from '../services/validationService';
import { LevelConfig } from '../types/game';

const defaults = { theme: '赛博修仙', difficulty: 'normal', targetAudience: 'midcore', durationMinutes: 8, artStyle: 'pixel', gameplayFocus: 'combat', monetizationStyle: 'event shop' };

export const DesignerPage = ({ onPlay }: { onPlay: () => void }) => {
  const [form, setForm] = useState(defaults);
  const [level, setLevel] = useState<LevelConfig>(storageService.getLevel());
  const [variants, setVariants] = useState<LevelConfig[]>([]);
  const [status, setStatus] = useState('准备生成。');

  const update = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [event.target.name]: event.target.value });
  const generate = async () => {
    setStatus('生成中...');
    const next = await apiService.generateLevel({ ...form, durationMinutes: Number(form.durationMinutes) });
    setLevel(next);
    setStatus('已生成 LevelConfig。');
  };
  const compare = async () => {
    setStatus('正在生成 3 个方案...');
    const list = await Promise.all([0, 1, 2].map((index) => apiService.generateLevel({ ...form, theme: `${form.theme} 方案${index + 1}`, durationMinutes: Number(form.durationMinutes) })));
    setVariants(list);
    setLevel(list[0]);
    setStatus('三方案已生成，可点击切换。');
  };
  const apply = () => {
    const errors = validateLevelConfigClient(level);
    if (errors.length) setStatus(errors.join('；'));
    else {
      storageService.saveLevel(level);
      setStatus('已应用到游戏试玩。');
      onPlay();
    }
  };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(level, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${level.id}.json`;
    link.click();
  };
  const importJson = (file?: File) => {
    if (!file) return;
    file.text().then((text) => setLevel(JSON.parse(text) as LevelConfig)).catch((error) => setStatus(String(error)));
  };

  return (
    <div className="designer">
      <section className="panel">
        <h2>AI Designer</h2>
        <div className="form-grid">
          <label>Theme<input name="theme" value={form.theme} onChange={update} /></label>
          <label>Difficulty<select name="difficulty" value={form.difficulty} onChange={update}><option>easy</option><option>normal</option><option>hard</option></select></label>
          <label>Audience<select name="targetAudience" value={form.targetAudience} onChange={update}><option>casual</option><option>midcore</option><option>hardcore</option></select></label>
          <label>Duration<select name="durationMinutes" value={form.durationMinutes} onChange={update}><option>5</option><option>8</option><option>12</option></select></label>
          <label>Art Style<select name="artStyle" value={form.artStyle} onChange={update}><option>pixel</option><option>low-poly</option><option>anime</option><option>dark fantasy</option><option>Chinese fantasy</option></select></label>
          <label>Focus<select name="gameplayFocus" value={form.gameplayFocus} onChange={update}><option>combat</option><option>exploration</option><option>story</option><option>collection</option></select></label>
          <label>Monetization<select name="monetizationStyle" value={form.monetizationStyle} onChange={update}><option>none</option><option>battle pass</option><option>event shop</option><option>gacha-like mock</option></select></label>
        </div>
        <div className="button-row">
          <button onClick={generate}>生成 AI 关卡</button>
          <button onClick={compare}>生成 3 个方案并对比</button>
          <button onClick={apply}>应用到游戏</button>
          <button onClick={exportJson}>导出 JSON</button>
          <label className="file-button">导入 JSON<input type="file" accept="application/json" onChange={(event) => importJson(event.target.files?.[0])} /></label>
        </div>
        <p className="success">{status}</p>
      </section>
      {variants.length > 0 && <section className="variant-row">{variants.map((item) => <button key={item.id} onClick={() => setLevel(item)}>{item.name}</button>)}</section>}
      <ConfigPreview level={level} />
      <section className="panel">
        <h3>JSON 配置</h3>
        <JsonEditor value={level} onChange={(value) => setLevel(value as LevelConfig)} />
      </section>
    </div>
  );
};
