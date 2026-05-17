# 第一关素材选型与导入计划

本文档定义第一关美术资源的来源策略、导入顺序、许可要求和后续版本路线。V1.5.1 不下载资源、不新增图片、不接入新的角色或武器 sprite sheet。

## 素材来源策略

推荐优先级：

A. CC0 / 免费开源素材

- 优先用于地图 tileset、地牢装饰、基础 UI 图标和低风险环境物。
- 每个实际采用的资源必须记录来源、作者、链接和 license。
- 即使资源看起来免费，使用前也必须再次确认 license。

B. 自制或 AI 生成素材

- 适合角色、武器、怪物和需要统一世界观的特殊资源。
- 必须遵守统一尺寸、风格、色彩和帧数规范。
- AI 生成资源进入项目之前要经过裁切、清理、尺寸统一和实际画面检查。

C. FrameRonin 处理后的素材

- FrameRonin 可用于拆帧、裁切、抠图、整理透明背景和合成 sprite sheet。
- FrameRonin 只作为外部素材处理工具，不进入游戏运行时依赖。
- 不安装 FrameRonin，不复制 FrameRonin 源码进本项目。
- 导出的 PNG / JSON 后续放入 `public/assets/game` 对应目录，再通过 `src/game/assets/artManifest.ts` 注册。

## 不推荐方式

- 不要直接复制不明版权素材。
- 不要把其他 GitHub 项目源码直接合并进本项目。
- 不要直接用风格不统一的临时图片替换当前游戏画面。
- 不要让占位图进入 stable 版本，除非明确标记为 placeholder 且实际效果可接受。
- 不要为了单个素材引入新的运行时依赖或大型工具链。
- 不要让 sprite 动画改变攻击判定、伤害、击退、冷却或移动手感。

## 推荐资源方向

以下方向可以作为后续筛选参考，但 V1.5.1 不下载、不导入：

- Kenney 地牢 / UI / 图标类素材。
- 0x72 DungeonTileset II 类 CC0 地牢 tileset。
- DungeonTileset II Extended 类扩展素材。
- Pixelorama 作为像素编辑工具。
- FrameRonin 作为拆帧 / 合成 sprite sheet 工具。
- 其他 CC0 / permissive license roguelike tileset。

实际使用前必须再次确认 license。确认内容至少包括：是否允许商业使用、是否需要署名、是否允许修改、是否允许再分发、是否和项目发布方式兼容。

## 第一关资源导入顺序

第一阶段：地图 tileset

- 地面
- 墙体
- 门
- 宝箱
- 装饰物
- 源晶裂隙

第二阶段：怪物 sprite

- 晶化史莱姆
- 骷髅守卫
- 暗影蝙蝠
- 符文射手

第三阶段：角色 sprite

- 遗迹猎人 idle
- walk
- hurt
- death

第四阶段：武器攻击动画

- 短剑
- 重刃
- 长枪
- 双匕

第五阶段：Boss 和高级特效

- Boss idle / attack / hurt
- Boss 技能范围提示
- 胜利 / 失败表现

先做地图和怪物，比先做角色武器动画更稳。地图资源主要影响氛围和可读性，怪物 sprite 可以验证敌人轮廓和受击反馈；角色和武器动画最容易被玩家感知为“手感变化”，因此应放在后面，并且必须坚持“动画只做表现，判定由现有逻辑控制”。

## 导入检查清单

每批资源进入项目之前，需要确认：

- 来源和 license 已记录。
- 尺寸符合 `docs/art-style-guide.md`。
- 命名符合 `docs/art-resource-pipeline.md`。
- 文件放入 `public/assets/game` 对应目录。
- `src/game/assets/artManifest.ts` 中的 key、路径、帧宽、帧高、帧率和 repeat 已核对。
- 缺失资源时 Graphics fallback 仍然可用。
- 动画没有驱动伤害、击退、冷却、碰撞或房间流程。
- `npm.cmd run typecheck` 和 `npm.cmd run build` 通过。

## 后续版本路线

V1.5.2：第一关地图 tileset / 房间氛围第一版

- 接入地图 tileset。
- 优化出生房、战斗房、宝库、事件房、Boss 房氛围。
- 保留 fallback。
- 不改战斗逻辑。

V1.5.2 当前实现说明：

- 先使用 `src/game/assets/roomVisualThemes.ts` 和 Phaser Graphics 生成第一版房间氛围。
- 当前不新增真实 tileset PNG，不下载资源，不安装依赖。
- 这些生成式装饰只作为表现层，不参与碰撞，不改变门、传送门、波次、奖励、事件、Boss 或结算逻辑。
- 后续正式 tileset 导入时，应保留当前 generated fallback，等正式素材确认风格和 license 后再逐步替换。

V1.5.3：普通怪 sprite 第一版

- 接入晶化史莱姆 / 骷髅守卫 / 蝙蝠 / 射手 sprite。
- 攻击前摇和当前 AI 同步。
- 不改数值。

V1.5.4：角色与武器动画第一版

- 接入遗迹猎人 idle / walk。
- 接入四把武器 attack 动画。
- 动画只做表现。
- 不改变判定和手感。

V1.5.5：Boss 与战斗反馈升级

- Boss 特效。
- 技能范围提示。
- 受击、击杀、屏幕震动、低血量提示优化。

V1.5.6：第一关体验打磨

- 难度曲线。
- 奖励节奏。
- 金币用途。
- 事件概率。
- 新手提示。
- 结算表现。
