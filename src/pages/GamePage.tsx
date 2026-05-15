import { useCallback, useMemo, useState } from 'react';
import { PhaserGame } from '../game/PhaserGame';
import { DEFAULT_LEVEL } from '../game/data/defaultLevel';
import { PlayerClassConfig } from '../types/game';

const relicHunter: PlayerClassConfig = {
  id: 'ranger',
  name: '遗迹猎人',
  hp: 120,
  attack: 14,
  defense: 4,
  speed: 175,
  critRate: 0.1,
  skills: [
    { id: 'attack', name: '普通攻击', key: 'J', cooldown: 350, damageMultiplier: 1, range: 48, description: '近距离攻击' },
    { id: 'dashSlash', name: '冲刺斩', key: 'K', cooldown: 5000, damageMultiplier: 1.8, range: 92, radius: 54, description: '向移动方向冲刺并斩击' },
    { id: 'shield', name: '护盾', key: 'L', cooldown: 8000, damageMultiplier: 0, range: 0, description: '获得 3 秒护盾' },
    { id: 'unused', name: '未解锁', key: 'I', cooldown: 999999, damageMultiplier: 0, range: 0, description: '后续版本扩展' }
  ]
};

export const GamePage = () => {
  const [gameKey, setGameKey] = useState(0);
  const [lastRunId, setLastRunId] = useState('');
  const level = useMemo(() => ({ ...DEFAULT_LEVEL, name: '灵墟地牢' }), []);
  const onRunEnd = useCallback((runId: string) => setLastRunId(runId), []);

  return (
    <div className="page-grid game-page">
      <aside className="panel sidebar">
        <h2>灵墟地牢</h2>
        <p>你是遗迹猎人，进入地下遗迹“灵墟”，寻找被污染的源晶。当前版本聚焦固定 6 房间地牢和完整战斗闭环。</p>
        <div className="control-card">
          <strong>角色</strong>
          <span>遗迹猎人</span>
          <span>生命 120 / 攻击 14 / 防御 4</span>
        </div>
        <div className="control-card">
          <strong>操作</strong>
          <span>WASD / 方向键移动</span>
          <span>J 普通攻击</span>
          <span>K 冲刺斩，冷却 5 秒</span>
          <span>L 护盾，持续 3 秒，冷却 8 秒</span>
          <span>E 互动，Esc 暂停，R 重新开始</span>
        </div>
        <button onClick={() => setGameKey((value) => value + 1)}>重置游戏实例</button>
        {lastRunId && <p className="success">最近结算已保存：{lastRunId}</p>}
      </aside>
      <section className="panel game-panel">
        <PhaserGame key={gameKey} level={level} playerClass={relicHunter} onRunEnd={onRunEnd} />
      </section>
    </div>
  );
};
