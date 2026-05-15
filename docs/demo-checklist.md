# Demo Checklist

## 演示前检查

- `npm install` 已完成。
- `npm run dev` 能启动前端和后端。
- 浏览器打开 `http://localhost:5173`。
- Asset Forge 可以生成资源包。
- AI Designer 可以生成并应用关卡。
- Game 可以选择职业并进入地牢。
- Analytics 能读取结算数据。

## 演示流程

1. Home 简述项目定位。
2. Asset Forge 生成资源包并应用。
3. AI Designer 生成 3 个方案，展示 JSON 和校验。
4. 应用一个方案到 Game。
5. Game 选择职业试玩，展示战斗、技能、事件、装备、遗物、Boss。
6. 结束后打开 Analytics，生成分析报告。

## API key 不可用

说明项目有 mock fallback。直接生成关卡、资源和分析报告，不影响完整演示。

## Blender 不可用

说明 Blender 是可选低模生产线，当前演示使用 TypeScript 程序化 SVG 资源。

## 游戏出现 bug

使用 Home -> Designer -> Analytics 展示工具链；如结算缺样本，可先在 Game 快速死亡生成 GameRun，再展示 Analytics 规则报告。
