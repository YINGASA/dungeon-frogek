# Interview Script

## 30 秒介绍

这是一个 AI 驱动的 Roguelite 地牢游戏与内容生产工具。它既能试玩，也能生成关卡、生成资源、记录数据并给出调优报告，展示我对 AI 游戏生产链路的理解。

## 1 分钟介绍

项目包含五个页面：Home、Game、AI Designer、Asset Forge、Analytics。策划输入主题和难度后，AI 或 mock 生成 LevelConfig；Asset Forge 生成可用 SVG 资源；Phaser 游戏读取配置并试玩；结算后 GameRun 存入 localStorage；Analytics 根据数据输出关卡节奏、职业平衡和 Boss 强度建议。

## 3 分钟介绍

我把项目设计成“内容生产 -> 玩法验证 -> 数据反馈”的闭环。AI Designer 负责生成结构化 JSON，不只是文本创意；Game 用 Phaser 执行这份 JSON，包含三职业、技能、装备、遗物、随机事件和 Boss 三阶段；Asset Forge 解决面试 demo 常见的素材短板，用程序化 SVG 和 Blender 脚本展示资源管线；Analytics 读取真实试玩数据，给出调优建议。即使没有 OpenAI key，所有流程也能用 mock 稳定跑通。

## 常见问题

Q：AI 生成内容如何保证可用？
A：后端 `validateLevelConfig` 校验层数、房间数、敌人、装备、遗物、事件、连通性和非负数值，解析失败或校验失败会 fallback 到 mock。

Q：这个项目和普通小游戏区别是什么？
A：普通小游戏只展示玩法，这个项目展示 AI 游戏生产流程，包括策划、资源、验证和数据调优。

Q：如何扩展真实 AI 图片生成？
A：保留现有 `AssetManifest`，把 prompts 交给图像生成服务，生成后的 URL 写回 manifest，Phaser 仍按同一资源入口加载。

Q：如何突出岗位匹配度？
A：强调结构化内容生成、玩法数值验证、工具链意识和数据驱动迭代。
