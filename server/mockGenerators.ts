import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AnalysisReport, AssetManifest, GameRun, LevelConfig } from '../src/types/game';
import { DEFAULT_LEVEL } from '../src/game/data/defaultLevel';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

export const mockLevel = (input: Partial<LevelConfig> & Record<string, unknown>): LevelConfig => {
  const theme = String(input.theme || DEFAULT_LEVEL.theme);
  const style = String(input.artStyle || DEFAULT_LEVEL.artStyle);
  return {
    ...DEFAULT_LEVEL,
    id: `mock-${Date.now()}`,
    name: `${theme}：数据魔君锻造地牢`,
    theme,
    difficulty: (input.difficulty as LevelConfig['difficulty']) || 'normal',
    targetAudience: (input.targetAudience as LevelConfig['targetAudience']) || 'midcore',
    durationMinutes: Number(input.durationMinutes || 8),
    artStyle: style,
    gameplayFocus: String(input.gameplayFocus || 'combat'),
    worldIntro: `在“${theme}”主题下，AI 将地牢结构、敌人、事件、装备和运营文案组装成一套可试玩配置。`,
    operationCopy: {
      headline: `${theme}限时测试：击败数据魔君`,
      pushNotification: `你的 ${theme} 地牢已经生成，进入三层挑战验证数值。`,
      eventBanner: `${style} 风格 Roguelite 内容生产演示`,
      socialPost: `我刚用 AI Designer 生成了一个 ${theme} 地牢，Boss 叫数据魔君。`
    },
    balanceNotes: [
      `难度目标：${input.difficulty || 'normal'}，预计 ${input.durationMinutes || 8} 分钟。`,
      '普通房提供低压战斗，第二层精英房制造压力峰值，Boss 房检验构筑强度。',
      '若通关率低于 30%，优先降低第二层精英怪攻击或增加休息房补给。'
    ],
    designNotes: [
      `主题词 ${theme} 会影响房间命名、事件包装和运营文案。`,
      '配置保持 JSON 驱动，可直接应用到 Game 页面。'
    ]
  };
};

export const mockAnalysis = (_level: LevelConfig, runs: GameRun[]): AnalysisReport => {
  if (!runs.length) {
    return {
      summary: '暂无真实对局数据。建议先完成 3 到 5 局试玩，再判断数值趋势。',
      balanceIssues: ['样本不足，无法确认怪物强度。'],
      pacingIssues: ['样本不足，暂不判断关卡节奏。'],
      classBalanceIssues: ['建议每个职业至少试玩 2 局。'],
      artSuggestions: ['先在 Asset Forge 生成一套统一主题资源，提升演示一致性。'],
      operationSuggestions: ['可以用“首通挑战”和“Boss 讨伐”包装校招展示亮点。'],
      nextIterationPlan: ['收集试玩数据', '观察死亡原因', '调整第二层精英房和 Boss 阶段']
    };
  }
  const winRate = runs.filter((run) => run.victory).length / runs.length;
  const avgBoss = runs.reduce((sum, run) => sum + run.bossRemainingHpPercent, 0) / runs.length;
  const avgDuration = runs.reduce((sum, run) => sum + run.durationSeconds, 0) / runs.length;
  return {
    summary: `共分析 ${runs.length} 局，通关率 ${(winRate * 100).toFixed(1)}%，平均时长 ${(avgDuration / 60).toFixed(1)} 分钟。`,
    balanceIssues: [
      ...(winRate < 0.3 ? ['通关率偏低，怪物强度或补给压力可能过高。'] : []),
      ...(winRate > 0.8 ? ['通关率偏高，构筑成长或 Boss 压力不足。'] : []),
      ...(avgBoss > 50 ? ['Boss 失败局剩余血量偏高，建议降低 Boss 防御或缩短二阶段弹幕持续时间。'] : [])
    ],
    pacingIssues: avgDuration < 240 ? ['平均时长偏短，建议增加分支房间奖励或事件房价值。'] : ['整体节奏接近演示目标。'],
    classBalanceIssues: ['继续观察各职业胜率，若 Ranger 明显高于其他职业，可降低暴击成长或翻滚频率。'],
    artSuggestions: ['技能特效可增加颜色区分：火焰偏橙、冰冻偏青、Boss 偏洋红。'],
    operationSuggestions: ['用“AI 生成三方案对比”作为运营活动包装，展示内容生产效率。'],
    nextIterationPlan: ['补充 10 局以上样本', '调整低胜率职业初始防御', '缩短事件选择后的回到战斗路径', '对 Boss 三阶段增加更清晰的视觉提示']
  };
};

const svg = (label: string, color: string, accent: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="10" fill="#08111f"/>
  <rect x="10" y="10" width="76" height="76" rx="6" fill="${color}" stroke="${accent}" stroke-width="4"/>
  <path d="M24 62 C36 28 60 28 72 62" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>
  <circle cx="35" cy="39" r="5" fill="#ffffff"/>
  <circle cx="61" cy="39" r="5" fill="#ffffff"/>
  <text x="48" y="86" font-family="monospace" font-size="9" text-anchor="middle" fill="#dff7ff">${label}</text>
</svg>`;

const palette = ['#27384c', '#3ee7c9', '#ffb84d', '#ff4f8b', '#8aa7ff', '#7df06d', '#d66bff'];

export const mockAssets = async (input: { theme: string; artStyle: string; assetTypes: string[] }): Promise<AssetManifest> => {
  const generatedDir = path.join(root, 'public', 'assets', 'generated');
  await fs.mkdir(generatedDir, { recursive: true });
  const groups = {
    tileset: ['floor', 'wall', 'door', 'trap', 'chest', 'shop', 'portal', 'boss-floor'],
    heroes: ['knight', 'mage', 'ranger'],
    enemies: ['goblin', 'skeleton-archer', 'slime', 'cultist', 'data-demon-boss'],
    skills: ['slash', 'fireball', 'frost-nova', 'arrow', 'explosion'],
    icons: ['sword', 'armor', 'potion', 'gold', 'relic']
  };
  const sprites: AssetManifest['sprites'] = { tileset: [], heroes: [], enemies: [], skills: [], icons: [] };
  let index = 0;
  for (const [group, names] of Object.entries(groups) as [keyof AssetManifest['sprites'], string[]][]) {
    for (const name of names) {
      const file = `${group}-${name}.svg`;
      await fs.writeFile(path.join(generatedDir, file), svg(name, palette[index % palette.length], palette[(index + 2) % palette.length]), 'utf8');
      sprites[group].push(`/assets/generated/${file}`);
      index += 1;
    }
  }
  const manifest: AssetManifest = {
    id: `asset-pack-${Date.now()}`,
    theme: input.theme,
    artStyle: input.artStyle,
    generatedAt: new Date().toISOString(),
    sprites,
    prompts: [
      `${input.artStyle} ${input.theme} dungeon tileset, readable 2D roguelite style`,
      `${input.artStyle} hero and enemy sprites with neon dungeon silhouettes`
    ],
    notes: ['方式 A 已生成可用 SVG 资源。', '如需低模渲染，可运行 Blender 脚本生成 PNG。']
  };
  await fs.writeFile(path.join(generatedDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  return manifest;
};
