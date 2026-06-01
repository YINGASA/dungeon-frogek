# 灵墟地牢

《灵墟地牢》是一个 Vite + React + Phaser 的俯视角动作 Roguelite 网页游戏。当前稳定试玩版聚焦第一关：遗迹猎人选择四种武器之一，探索 6-8 房间随机路线，通过战斗、事件、奖励和遗物成长，最终挑战源晶核心。

## 项目亮点

- 线上试玩闭环：首页、游戏试玩、数据分析页直接面向当前第一关版本。
- 可玩 Roguelite：遗迹猎人、四种武器、6-8 房间随机路线、战斗房、事件房、遗物成长和 Boss 战结算。
- AI 可选接入：有 `OPENAI_API_KEY` 时走 OpenAI；没有 key 时自动使用本地 mock，保证面试现场稳定演示。
- 内部工具保留：AI Designer 和 Asset Forge 代码仍在项目内，但当前线上试玩导航隐藏入口。
- 数据闭环：localStorage 保存对局、关卡、资源、结算，Analytics 输出规则诊断与 AI 报告。

## 技术栈

React + TypeScript + Vite、Phaser、Node.js + Express + TypeScript、OpenAI SDK、localStorage。

## 运行

```bash
npm install
npm run dev
```

前端默认打开 `http://localhost:5173`，后端 API 运行在 `http://localhost:8787`。

## OpenAI API 配置

复制 `.env.example` 为 `.env`，填入：

```bash
OPENAI_API_KEY=your_key
PORT=8787
```

没有 API key 时无需额外操作，`/api/generate-level`、`/api/analyze-runs`、`/api/generate-assets` 会自动使用 mock / 规则生成。

## 生成资源

在页面中打开 Asset Forge，输入主题和美术风格，点击“生成资源包”。资源会写入 `public/assets/generated`，Manifest 会保存到 localStorage。

也可以运行：

```bash
npm run generate:assets
```

## 如何生成地牢资源

V0.4 的《灵墟地牢》会优先读取 `public/assets/generated/dungeon/` 下的地牢视觉资源，包括地板、墙体、门、晶体、宝箱、药水和奖励道具。

```bash
npm run generate:assets
```

该命令会生成基础 Asset Forge 资源，并额外生成 `public/assets/generated/dungeon/*.svg`。当前试玩版会预加载这些 generated SVG；如果资源缺失或生成失败，仍会自动使用内置 Phaser Graphics fallback，不会影响试玩和通关。未来正式 PNG 资源应通过资源清单接入，避免请求不存在的文件。

## 如何生成主角资源

V0.5 的《灵墟地牢》支持四方向遗迹猎人角色图，资源路径为 `public/assets/generated/characters/hunter/`。

```bash
npm run generate:hunter
```

该命令会生成四方向 idle 图和两帧走路图，例如 `hunter_down.svg`、`hunter_down_1.svg`、`hunter_down_2.svg`。当前试玩版会预加载这些 generated SVG；如果角色资源不存在，会继续使用内置圆形箭头 fallback。未来正式角色 PNG / sprite sheet 接入前，应先确认资源清单和授权。

## 如何生成晶化史莱姆资源

V0.6 的《灵墟地牢》支持晶化史莱姆 2 帧待机和 2 帧移动资源，资源路径为 `public/assets/generated/monsters/crystal_slime/`。

```bash
npm run generate:slime
```

该命令会生成 `slime_idle_1.svg`、`slime_idle_2.svg`、`slime_move_1.svg`、`slime_move_2.svg`。游戏会优先加载这些资源；如果不存在，会继续使用内置 Phaser fallback 怪物图形。

## 如何生成骷髅守卫资源

V0.7 的《灵墟地牢》支持骷髅守卫 2 帧待机、2 帧行走和 1 张攻击资源，资源路径为 `public/assets/generated/monsters/skeleton_guard/`。

```bash
npm run generate:skeleton
```

该命令会生成 `skeleton_idle_1.svg`、`skeleton_idle_2.svg`、`skeleton_walk_1.svg`、`skeleton_walk_2.svg`、`skeleton_attack.svg`。游戏会优先加载这些资源；如果不存在，会继续使用内置 Phaser fallback 怪物图形。

## 如何生成暗影蝙蝠资源

V0.8 的《灵墟地牢》支持暗影蝙蝠 2 帧待机、2 帧飞行和 1 张攻击资源，资源路径为 `public/assets/generated/monsters/shadow_bat/`。

```bash
npm run generate:bat
```

该命令会生成 `bat_idle_1.svg`、`bat_idle_2.svg`、`bat_fly_1.svg`、`bat_fly_2.svg`、`bat_attack.svg`。游戏会优先加载这些资源；如果不存在，会继续使用内置 Phaser fallback 怪物图形。

## 如何生成符文射手资源

V0.9 的《灵墟地牢》支持符文射手 2 帧待机、2 帧施法、1 张攻击图和符文弹道资源，资源路径为 `public/assets/generated/monsters/rune_archer/`。

```bash
npm run generate:rune
```

该命令会生成 `rune_archer_idle_1.svg`、`rune_archer_idle_2.svg`、`rune_archer_cast_1.svg`、`rune_archer_cast_2.svg`、`rune_archer_attack.svg`、`rune_projectile.svg`。游戏会优先加载这些资源；如果不存在，会继续使用内置 Phaser fallback 怪物图形和弹道图形。

## 如何生成 Boss 晶核守卫资源

V1.0 的《灵墟地牢》支持 Boss 晶核守卫待机、移动、近战、射击、二阶段、晶体弹和地刺资源，资源路径为 `public/assets/generated/boss/crystal_guardian/`。

```bash
npm run generate:boss
```

该命令会生成 `guardian_idle_1.svg`、`guardian_idle_2.svg`、`guardian_walk_1.svg`、`guardian_walk_2.svg`、`guardian_melee.svg`、`guardian_shoot.svg`、`guardian_phase2_idle_1.svg`、`guardian_phase2_idle_2.svg`、`guardian_phase2_melee.svg`、`guardian_phase2_shoot.svg`、`crystal_projectile.svg`、`crystal_spike.svg`。游戏会优先加载这些资源；如果不存在，会继续使用内置 Phaser fallback 图形。

## Blender 低模脚本

如果本地安装了 Blender，可运行：

```bash
blender --background --python scripts/blender/generate_low_poly_assets.py
```

没有 Blender 不影响项目运行，Asset Forge 的 TypeScript 程序化 SVG 资源始终可用。

## 演示流程

1. 打开首页，确认当前版本、试玩范围和推荐演示顺序。
2. 进入游戏试玩，选择短剑、重刃、长枪或双匕。
3. 清理战斗房，选择奖励和遗物，处理事件分支。
4. 挑战源晶核心，胜利或失败后结算数据自动保存。
5. 打开数据分析页，查看通关率、平均时长、角色胜率、Boss 剩余血量和最近对局记录。

