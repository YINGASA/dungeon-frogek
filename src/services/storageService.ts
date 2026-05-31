import { AssetManifest, GameRun, LevelConfig } from '../types/game';
import { DEFAULT_LEVEL } from '../game/data/defaultLevel';

const keys = {
  runs: 'adf:gameRuns',
  level: 'adf:levelConfig',
  assets: 'adf:assetManifest',
  lastRun: 'adf:lastRun'
};

const read = <T>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private browsing or full quota states.
  }
};

const remove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Match write fallback: storage failures should not break the UI.
  }
};

export const storageService = {
  getLevel(): LevelConfig {
    const level = read(keys.level, DEFAULT_LEVEL);
    if (level.id === DEFAULT_LEVEL.id || level.name.includes('AI Dungeon Forge') || level.name.includes('Data Demon')) {
      return DEFAULT_LEVEL;
    }
    return level;
  },
  saveLevel(level: LevelConfig) {
    write(keys.level, level);
  },
  getRuns(): GameRun[] {
    return read(keys.runs, []);
  },
  saveRun(run: GameRun) {
    const runs = [run, ...this.getRuns()].slice(0, 100);
    write(keys.runs, runs);
    write(keys.lastRun, run);
  },
  getLastRun(): GameRun | null {
    return read<GameRun | null>(keys.lastRun, null);
  },
  getAssetManifest(): AssetManifest | null {
    return read<AssetManifest | null>(keys.assets, null);
  },
  saveAssetManifest(manifest: AssetManifest) {
    write(keys.assets, manifest);
  },
  clearRuns() {
    remove(keys.runs);
    remove(keys.lastRun);
  }
};
