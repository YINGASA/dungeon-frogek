# Demo Checklist

## 演示前检查

- `npm install` 已完成。
- `npm run dev` 能启动前端和后端。
- 浏览器打开 `http://localhost:5173`。
- 首页只展示当前线上试玩入口：首页、游戏试玩、数据分析。
- Game 可以选择武器并进入地牢。
- Analytics 能读取结算数据。

## 演示流程

1. Home 简述当前第一关试玩定位、版本和推荐演示顺序。
2. 进入 Game，选择短剑、重刃、长枪或双匕。
3. 展示移动、J 普通攻击、K 冲刺斩、L 30 点容量护盾。
4. 清理战斗房，选择奖励和遗物，处理事件分支。
5. 挑战源晶核心，胜利或失败后生成结算。
6. 打开 Analytics，查看通关率、角色胜率、Boss 剩余血量、最近对局和分析报告。

## API key 不可用

说明项目有 mock fallback。当前线上试玩路径不依赖 API key；生成分析报告时仍可使用 mock / 规则结果。

## Blender 不可用

说明 Blender 是可选低模生产线，当前试玩使用已有 generated SVG 和内置 Phaser fallback 图形。

## 游戏出现 bug

使用 Home -> Analytics 展示当前试玩范围和数据页；如结算缺样本，可先在 Game 快速死亡生成 GameRun，再展示 Analytics 规则报告。
