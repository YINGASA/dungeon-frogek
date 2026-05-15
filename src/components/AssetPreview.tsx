import { AssetManifest } from '../types/game';

export const AssetPreview = ({ manifest }: { manifest: AssetManifest | null }) => {
  if (!manifest) return <div className="empty-state">还没有资源包，点击生成后会展示 tileset、角色、怪物、技能和图标。</div>;
  return (
    <div className="asset-preview">
      {Object.entries(manifest.sprites).map(([group, urls]) => (
        <section className="panel" key={group}>
          <h3>{group}</h3>
          <div className="asset-grid">
            {urls.map((url) => (
              <img key={url} src={url} alt={url} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
