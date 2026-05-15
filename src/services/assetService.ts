import { AssetManifest } from '../types/game';

export const summarizeManifest = (manifest: AssetManifest | null) => {
  if (!manifest) return '尚未应用资源包';
  const total = Object.values(manifest.sprites).reduce((sum, list) => sum + list.length, 0);
  return `${manifest.theme} / ${manifest.artStyle} / ${total} 个资源`;
};
