# 灵墟地牢 v1.6.1 当前游戏信息与怪物房整理报告

## 一、当前 Git 状态

| 项目 | 结果 |
|---|---|
| 当前分支 | `playtest/v1.6.1` |
| 当前 HEAD | `bab2262559b227b925afd2d96ab0917501612ec1` |
| HEAD 是否等于 `v1.6.1-stable` | 是 |
| HEAD 是否有 `v1.6.1-stable` tag | 是 |
| 工作区是否干净 | 是，整理前 `git status` / `git status --short` 均干净 |
| typecheck 是否通过 | 通过，`npm.cmd run typecheck` 成功 |
| build 是否通过 | 通过，`npm.cmd run build` 成功 |
| 需要先处理的问题 | 无阻塞问题；build 仅有 Vite chunk 超 500kB 警告 |

## 二、v1.6.1 当前游戏总体信息

### 1. 玩家基础操作

- 移动：`WASD / 方向键`。
- `J` 普攻：按当前武器参数做近战判定。
- `K` 冲刺斩：向朝向位移并沿途命中敌人。
- `L` 护盾：默认 3 秒，减伤 50%，默认冷却 8 秒。
- 普攻击退：普通怪可被击退；精英单位击退距离和控制时间按 0.58 缩放。
- Boss 是否受击退：不受击退，普攻和 K 命中 Boss 只造成伤害 / hit stop。
- 护盾期间 `J / K` 是否可用：可用。代码没有在护盾期间禁用普攻或冲刺斩；只有冲刺中不能 J/K，但冲刺中仍可按 L。

### 2. 武器系统

| 武器 | 定位 |
|---|---|
| 短剑 | 均衡稳定，标准伤害、范围、击退和冷却 |
| 重刃 | 高伤害慢攻，强击退，移速略低，K 冷却略长 |
| 长枪 | 远距窄判定，适合拉扯，K 距离更远 |
| 双匕 | 快速双段，范围短、击退弱、移速高，贴身风险高 |

- 有开局武器选择，数字键 `1-4` 选择四把武器。
- 有武器相关奖励文案：`WEAPON_AWARE_RELIC_TEXT` 和 `V1_6_WEAPON_AWARE_RELIC_TEXT` 针对部分遗物替换显示名 / 描述。
- 当前没有正式武器 sprite 或武器挂载动画落地；`artManifest.ts` 只登记未来 PNG 路径，且 `fallback: true` 时不会加载正式资源。实际战斗表现仍以生成图形、SVG fallback、Phaser Graphics 为主。

### 3. 房间系统

- 出生房：安全，无敌人，直接可开传送门。
- 普通战斗房：`battle`，模板 5 个。
- 高级战斗房：内部仍是 `elite` kind，但显示逻辑中不含“精英”的 elite 房会显示为“高级战斗房”。
- 精英战斗房：`elite` kind 且房名含“精英”，奖励和强度更高。
- 事件房：`event`，进入后弹出随机事件包。
- 封尘宝库：`treasure`，打开宝箱后进入奖励三选一。
- Boss 房：`boss`，晶核守卫，击败后结算胜利。
- 分支传送门：路线节点可有两个 `nextOptions`，右侧显示两个传送门和目标房名。
- 路线记录：访问过的房间写入 `visitedRoomIds`，结算保存 `routeSummary`。
- 房间编号：进入房间时给 `enteredRoomNumbers` 赋连续访问编号；总数用当前房号加“当前已选或可达路径的最长剩余房间数”，Boss 房总数直接等于当前房号。

### 4. 奖励和成长

- 奖励三选一：战斗、宝库、高级/精英房都会弹三选一遗物。
- 遗物系统：当前 `REWARD_POOL` 约 24 个，覆盖攻击、生存、回复、技能。
- 金币系统：击杀普通怪 +8，Boss +60；清房额外金币；事件和遗物也会影响金币。
- 宝库奖励：宝箱触发三选一，宝库屏蔽 `attack-crystal`、`source-dagger`、`echo-core`。
- 清房奖励：普通战斗基础 7-14 金；高级/精英 16-22 或 24-34 金，并可受遗物加成。
- 结算构筑摘要：保存武器、路线、房间数、事件、奖励次数、遗物列表、金币、构筑倾向等。

### 5. 随机事件

- 当前事件房使用 `EVENT_PACK` 随机权重机制。
- 事件会按房间编号、是否 oncePerRun、玩家血量、事件类别调整候选和权重。
- 大致类型：陷阱伤害、塌陷减速、中毒、锈蚀、ATK/DEF 增益、金币、治疗、药剂、净化、伏击、精英巡逻、封印祭坛、裂隙低语、不稳定源晶等。
- 存在正面事件、负面事件、混合事件、伏击战斗、中毒、诅咒/锈蚀。

### 6. 怪物和 Boss

- 当前敌人类型：晶化史莱姆、骷髅守卫、暗影蝙蝠、符文射手、晶核守卫 Boss。
- Boss 机制：近战重击、晶体弹、地刺、近身站桩惩罚式震荡；半血以下进入第二阶段，冷却更快、技能伤害更高。
- 普通怪攻击前摇：史莱姆 250ms，骷髅 300ms，蝙蝠 220ms，符文射手 400ms。
- 精英强化方式：显式 elite 怪 HP x2、ATK x1.5、速度 x1.1、冷却更短；elite 房内普通怪也有小幅 HP/ATK/cooldown 强化。
- 波次刷新系统：普通/高级/精英战斗房按 `buildCombatWaves` 生成多波，清空当前波后 950-1350ms 刷下一波。

### 7. 美术和反馈

- fallback 美术：`public/assets/generated` 下已有生成 SVG；房间、怪物、攻击、死亡、Boss 技能大量使用 Phaser Graphics / fallback texture。
- `artManifest.ts` 作用：登记未来正式 PNG/spritesheet key、路径、帧宽高和动画配置；当前 `fallback: true` 使其不主动加载正式 PNG。
- 房间视觉主题：`roomVisualThemes.ts` 区分 start/battle/advanced/elite/treasure/event/merchant/boss。
- 敌人视觉主题：`enemyVisualThemes.ts` 区分 slime/skeleton/bat/archer/boss/fallback 的颜色、警示色、死亡粒子、精英光环。
- 当前未接正式角色 sprite，也未接正式武器动画；`public/assets/game` 目前只有 README 占位说明，没有实际 PNG 文件。

## 三、v1.6.1 怪物房信息专项整理

| 房间类型 | 内部名称 / 模板 | 出现场景 | 波次数量 | 每波敌人组合 | 奖励类型 | 当前强度判断 | 备注 |
|---|---|---|---|---|---|---|---|
| 普通战斗房 | 蝠群突袭房 | `battle` 主线或分支前后 | 2 | 深度 <0.5：蝙蝠+史莱姆 / 蝙蝠；否则第二波蝙蝠+史莱姆 | 战斗三选一 + 清房金币 | 偏机动压力 | 固定模板特殊波次 |
| 普通战斗房 | 骷髅守卫压制房 | `battle` | 2 | 深度 <0.55：骷髅+史莱姆 / 骷髅；否则两波均为骷髅+史莱姆组合 | 战斗三选一 + 清房金币 | 偏近战压制 | 固定模板特殊波次 |
| 普通战斗房 | 普通战斗房 | `battle` | 1-2 | 第一波取模板前 2-3 只；深度较高时第二波随机混合 | 战斗三选一 + 清房金币 | 基础强度 | 随深度增加可能 2 波 |
| 普通战斗房 | 回廊战斗房 | `battle` | 1-2 | 第一波史莱姆/史莱姆/骷髅；后续随机混合 | 战斗三选一 + 清房金币 | 中等偏耐久 | 模板 3 怪 |
| 普通战斗房 | 裂隙战斗房 | `battle` | 1-2 | 第一波史莱姆+蝙蝠；后续随机混合 | 战斗三选一 + 清房金币 | 低到中等 | 机动压力较轻 |
| 高级战斗房 | 符文射手夹击房 | `elite` | 2 | 史莱姆+骷髅 / 符文射手+蝙蝠或史莱姆 | 高级奖励 + 清房金币 | 远程压力明确 | 显示为高级战斗房 |
| 高级战斗房 | 高级战斗房 | `elite` | 2，后期 30% 可 3 | 随机混合 2 只 / 随机 2 只 + 符文射手或蝙蝠 / 后期追加随机 2 只 + 射手或蝙蝠 | 高级奖励 + 清房金币 | 中高压，后期可能高压 | 没有显式 elite 单位 |
| 精英战斗房 | 精英护卫房 | `elite` | 2 | 史莱姆+骷髅 / 精英骷髅 + 史莱姆或蝙蝠 | 高级奖励，按精英奖励表倾斜 | 高压 | 显式 elite 怪 |
| 精英战斗房 | 精英战斗房 | `elite` | 2 | 随机 3 只 / 显式精英骷髅/蝙蝠/射手之一 + 随机 1 只 | 高级奖励，稀有/史诗概率更高 | 高压 | 房名含“精英”触发 trueElite |
| Boss 前高压战斗房 | 任意后段 `battle` / `elite` | 靠近 Boss 的主线节点 | battle 多为 2；elite 可 2-3 | 深度 >0.68 的随机池加入更多骷髅和符文射手；depth >0.75 普通第二波可 3 只 | 对应战斗/高级奖励 | 后段自然升压 | 不是独立模板，而是深度系数和波次数共同造成 |
| 事件伏击 | monster-ambush | 事件房 | 1 | 史莱姆+骷髅 | 事件战斗金币 +6，清完开门 | 小型战斗 | 不进入 `buildCombatWaves` |
| 事件伏击 | fallen-explorer-pack 触发伏击 | 事件房 | 1 | 蝙蝠+史莱姆 | 事件战斗金币 +6，清完开门 | 小型机动压力 | 32% 触发 |
| 事件巡逻 | elite-patrol | 事件房，房号 >=3，一局一次 | 1 | 骷髅+符文射手 | 金币 +12，18% rare 奖励 | 中等远程压力 | 文案叫精英巡逻，但代码没有显式 elite 标记 |
| 宝库相关战斗 | 无 | treasure | 0 | 无 | 宝箱三选一 | 无战斗 | v1.6.1 宝库不刷怪 |
| Boss 房 | 首领房 | 最终房 | 1 | 晶核守卫 | 击败即胜利结算，击杀金币 +60 | 最高压 | 无三选一奖励 |

## 四、v1.6.1 敌人信息专项整理

| 敌人 ID | 中文名 | 类型定位 | 关键数值 | 行为特点 | 是否可被击退 | 是否用于精英房 | 备注 |
|---|---|---|---|---|---|---|---|
| `slime` | 晶化史莱姆 | 慢速近战/入门怪 | HP25 ATK7 DEF0 SPD55 RNG30 CD1100 | 靠近后 250ms 前摇撞击 | 是 | 是 | elite 房普通版会被小幅强化 |
| `skeleton` | 骷髅守卫 | 稳定近战压制 | HP45 ATK10 DEF2 SPD82 RNG34 CD1050 | 进入近战范围后 300ms 挥砍 | 是 | 是 | 可作为显式精英怪 |
| `bat` | 暗影蝙蝠 | 高速俯冲怪 | HP20 ATK9 DEF0 SPD140 RNG28 CD820 | 220ms 前摇，后撤再俯冲 | 是 | 是 | 速度最快 |
| `archer` | 符文射手 | 远程压力 | HP35 ATK10 DEF1 SPD70 RNG230 CD1450 | 保持距离，400ms 施法后发射弹道 | 是 | 是 | 后段随机池出现 |
| 显式 elite | 精英骷髅/蝙蝠/射手 | 强化精英 | HP x2、ATK x1.5、SPD x1.1、CD /1.25 | 有精英光环，血条更醒目 | 是，但控制 x0.58 | 是 | 由 `{ kind, elite: true }` 生成 |
| elite 房强化普通怪 | 原名不变 | 房间强化怪 | HP x1.18、ATK x1.12、CD /1.08，再叠深度加成 | 行为同原怪 | 是 | 是 | 不改名为精英 |
| `boss` | 晶核守卫 | 第一关 Boss | HP220 ATK12 DEF3 SPD62 RNG62 CD1100 | 近战、弹道、地刺、近身震荡，半血二阶段 | 否 | Boss 房 | 半血后技能更快更痛 |

## 五、v1.6.1 波次 / 刷怪逻辑整理

1. 当前波次生成：进入 `battle` 或 `elite` 房时调用 `buildCombatWaves()`，设置 `currentWaveIndex = 0`，再 `spawnCurrentWave()`。
2. `buildCombatWaves`：先看房间 kind 和房名。部分模板有固定波次；其他普通战斗按深度决定 1-2 波；elite 房通常 2 波，后段高级房有概率 3 波。
3. `spawnCurrentWave`：取当前 wave，调用 `spawnEnemies(wave)`，显示“第 x / n 波”提示并写日志。
4. `scheduleNextWave`：当前波清空后设置 `waveTransitionPending`，等待 950-1350ms，递增 `currentWaveIndex` 并刷下一波。
5. 清场判断：update 中检测 `!roomCleared && currentRoom.enemies.length > 0 && countLivingEnemies() === 0`，然后 `handleRoomEnemiesCleared()`。
6. 清场奖励：普通/高级/精英战斗进入 `openRewardChoice`，先发清房金币/回血，再展示三选一；事件战斗给事件金币/概率 rare 后直接开门。
7. 传送门出现：奖励选择完成后 `openPortal()`；事件非战斗完成直接开门；事件战斗清完开门；Boss 击杀直接胜利结算。
8. 潜在风险：当前主流程较稳，没有明显“无法清场/重复奖励/传送门不出现”的直接问题。需要注意的是事件 `elite-patrol` 文案像精英战，但实际没有显式 elite 标记；另外战斗房清场依赖 `currentRoom.enemies.length > 0`，目前模板和事件战斗都满足，后续若加入“空 enemies 但靠 waves 驱动”的房间要同步改判断。

## 六、v1.6.1 路线与怪物房出现逻辑

1. 路线长度随机 6-8。
2. 必有 `start`、至少 2 个 `battle`、至少 1 个 `elite`、最终 `boss`。
3. 普通战斗房：主线 backbone 第一个中段必定是 battle，其余非精英槽按概率 battle。
4. 高级/精英战斗房：`eliteSlot` 必定插入一个 elite；其他中后段有 16% 或末段 22% 概率变 elite。
5. 事件房：作为 optional 分支候选，50% 加入候选。
6. 封尘宝库：作为 optional 分支候选，68% 加入候选；如果 optional 为空则强制加入 treasure。
7. Boss 房：backbone 末尾固定追加。
8. 必经房：start、backbone 中段 battle/elite、boss。
9. 分支可选房：event / treasure 插在 battle/elite 边上，玩家可选主线目标或 optional 目标；optional 完成后回到下一 backbone。
10. 房间编号：按实际访问顺序编号，避免分支路线造成显示跳号。
11. 跳号修复逻辑：`enteredRoomNumbers` 固定已进入房号，`getDisplayTotalRooms()` 根据已选分支/可达最长剩余路径估算当前总房数。
12. 路线与强度关系：强度主要来自 `currentRoomIndex / route.length` 的 depth ratio，影响敌人 HP/ATK、随机池是否加入射手、普通房是否多波、elite 房是否可能 3 波。

## 七、当前代码集中度和维护风险

1. 怪物房相关逻辑主要集中在：
   - `ROOM_TEMPLATES`
   - `generateDungeonRoute`
   - `buildCombatWaves`
   - `spawnCurrentWave`
   - `scheduleNextWave`
   - `spawnEnemies`
   - `handleRoomEnemiesCleared`
   - `openRewardChoice`
   - `EVENT_PACK`
   - `REWARD_POOL`
2. 是的，当前过度集中在 `DungeonScene.ts`，房间、路线、敌人、奖励、事件、Boss、UI 和结算都在同一大文件里。
3. 后续慢慢改怪物房，最容易影响：路线编号、奖励触发、传送门开启、事件战斗、清场判断、结算统计、房间视觉主题。
4. 适合小步修改：单个房间模板、单个波次规则、敌人数值、事件战斗奖励、清房金币范围、深度权重。
5. 暂时不要碰：大规模拆分 `DungeonScene.ts`、传送门/访问编号核心流程、Boss 胜利结算、动画驱动判定、稳定 tag。

## 八、当前阶段明确不要做的内容

- 不做第二关。
- 不做正式角色 sprite 接入。
- 不做正式武器动画接入。
- 不做武器挂载动画。
- 不让动画驱动战斗判定。
- 不安装新依赖。
- 不下载版权不明素材。
- 不大规模重构 `DungeonScene.ts`。
- 不新增复杂装备背包。
- 不新增无关页面或导航。
- 不改 stable tag。
- 不 force push。

## 九、结论

1. 当前 v1.6.1 适合作为后续继续打磨怪物房的基线：Git 干净、HEAD 精确等于 `v1.6.1-stable`、typecheck/build 均通过。
2. 当前怪物房信息已经能支持后续慢慢调整：模板、路线、波次、敌人数值、奖励和事件战斗入口都能定位清楚。
3. 建议把本报告整理成 docs 文档，本文件即为该整理文档。
4. 文档名：`docs/lingxu-v1.6.1-current-game-and-combat-rooms.md`。
