import { AnalysisReport, AssetManifest, GameRun, LevelConfig } from '../types/game';

const post = async <T>(url: string, body: unknown): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`${url} failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const apiService = {
  generateLevel(input: Record<string, unknown>) {
    return post<LevelConfig>('/api/generate-level', input);
  },
  analyzeRuns(levelConfig: LevelConfig, runs: GameRun[]) {
    return post<AnalysisReport>('/api/analyze-runs', { levelConfig, runs });
  },
  generateAssets(input: { theme: string; artStyle: string; assetTypes: string[] }) {
    return post<AssetManifest>('/api/generate-assets', input);
  }
};
