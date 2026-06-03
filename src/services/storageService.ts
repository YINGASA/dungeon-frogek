import { AssetManifest, GameRun, LevelConfig } from '../types/game';
import { DEFAULT_LEVEL } from '../game/data/defaultLevel';

const keys = {
  runs: 'adf:gameRuns',
  level: 'adf:levelConfig',
  assets: 'adf:assetManifest',
  lastRun: 'adf:lastRun'
};
const maxStoredRuns = 100;

const read = <T>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isStoredRun = (value: unknown): value is GameRun => isRecord(value) && typeof value.id === 'string' && value.id.trim().length > 0;

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
    const level = read<unknown>(keys.level, DEFAULT_LEVEL);
    if (
      !isRecord(level)
      || typeof level.id !== 'string'
      || typeof level.name !== 'string'
      || !Number.isFinite(Number(level.durationMinutes))
    ) {
      return DEFAULT_LEVEL;
    }
    if (level.id === DEFAULT_LEVEL.id || level.name.includes('AI Dungeon Forge') || level.name.includes('Data Demon')) {
      return DEFAULT_LEVEL;
    }
    return level as unknown as LevelConfig;
  },
  saveLevel(level: LevelConfig) {
    write(keys.level, level);
  },
  getRuns(): GameRun[] {
    const runs = read<unknown>(keys.runs, []);
    return Array.isArray(runs) ? runs.filter(isStoredRun).slice(0, maxStoredRuns) : [];
  },
  saveRun(run: GameRun) {
    const runs = [run, ...this.getRuns().filter((storedRun) => storedRun.id !== run.id)].slice(0, maxStoredRuns);
    write(keys.runs, runs);
    write(keys.lastRun, run);
  },
  getLastRun(): GameRun | null {
    const run = read<unknown>(keys.lastRun, null);
    return isStoredRun(run) ? run : null;
  },
  getAssetManifest(): AssetManifest | null {
    const manifest = read<unknown>(keys.assets, null);
    return isRecord(manifest) && isRecord(manifest.sprites) ? (manifest as unknown as AssetManifest) : null;
  },
  saveAssetManifest(manifest: AssetManifest) {
    write(keys.assets, manifest);
  },
  clearRuns() {
    remove(keys.runs);
    remove(keys.lastRun);
  }
};
