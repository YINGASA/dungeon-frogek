import { LevelConfig } from '../types/game';

export const ConfigPreview = ({ level }: { level: LevelConfig }) => (
  <div className="preview-grid">
    <section className="panel">
      <h3>{level.name}</h3>
      <p>{level.worldIntro}</p>
      <div className="mini-grid">
        {level.floors.map((floor) => (
          <div key={floor.floorIndex} className="mini-card">
            <strong>{floor.name}</strong>
            <span>{floor.rooms.length} rooms</span>
          </div>
        ))}
      </div>
    </section>
    <section className="panel">
      <h3>首领机制</h3>
      <p>{level.boss.name} / {level.boss.chineseName}</p>
      {level.boss.phases.map((phase) => (
        <div key={phase.name} className="line-item">
          <strong>{phase.name}</strong>
          <span>{phase.mechanics.join(' / ')}</span>
        </div>
      ))}
    </section>
    <section className="panel wide">
      <h3>内容包</h3>
      <div className="tag-cloud">
        {level.enemies.slice(0, 12).map((enemy) => <span key={enemy.id}>{enemy.name}</span>)}
        {level.equipment.slice(0, 10).map((item) => <span key={item.id}>{item.name}</span>)}
        {level.relics.map((relic) => <span key={relic.id}>{relic.name}</span>)}
      </div>
    </section>
  </div>
);
