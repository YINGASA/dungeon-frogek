import express from 'express';
import { generateJsonWithOpenAI } from './openaiClient';
import { analysisPrompt, levelPrompt } from './promptTemplates';
import { mockAnalysis, mockAssets, mockLevel } from './mockGenerators';
import { validateLevelConfig } from './validators';
import { AnalysisReport, AssetManifest, LevelConfig } from '../src/types/game';

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(express.json({ limit: '5mb' }));

app.post('/api/generate-level', async (req, res) => {
  const aiLevel = await generateJsonWithOpenAI<LevelConfig>(levelPrompt(req.body));
  const candidate = aiLevel && validateLevelConfig(aiLevel).length === 0 ? aiLevel : mockLevel(req.body);
  const errors = validateLevelConfig(candidate);
  if (errors.length) {
    res.status(500).json({ errors });
    return;
  }
  res.json(candidate);
});

app.post('/api/analyze-runs', async (req, res) => {
  const aiReport = await generateJsonWithOpenAI<AnalysisReport>(analysisPrompt(JSON.stringify(req.body.runs ?? []).slice(0, 12000)));
  res.json(aiReport ?? mockAnalysis(req.body.levelConfig, req.body.runs ?? []));
});

app.post('/api/generate-assets', async (req, res) => {
  const manifest = await mockAssets(req.body);
  const aiDescription = await generateJsonWithOpenAI<Pick<AssetManifest, 'prompts' | 'notes'>>(
    `Return JSON with prompts and notes arrays for an asset pack: ${JSON.stringify(req.body)}`
  );
  res.json(aiDescription ? { ...manifest, prompts: [...manifest.prompts, ...aiDescription.prompts], notes: [...manifest.notes, ...aiDescription.notes] } : manifest);
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(port, () => {
  console.log(`AI Dungeon Forge API listening on http://localhost:${port}`);
});
