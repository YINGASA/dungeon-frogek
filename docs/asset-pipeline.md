# Asset Pipeline

## 程序化 2D 资源生成流程

Asset Forge 调用 `/api/generate-assets`，后端生成 SVG 文件到 `public/assets/generated`，同时返回 `AssetManifest`。资源类型包括 tileset、英雄、怪物、技能特效和道具图标。

## Blender 低模资源生成流程

`scripts/blender/generate_low_poly_assets.py` 使用 Blender Python API 创建低模地板、墙、宝箱、传送门、职业角色、怪物和 Boss，设置正交相机与灯光，并渲染 PNG。

运行：

```bash
blender --background --python scripts/blender/generate_low_poly_assets.py
```

## Manifest 结构

`AssetManifest` 包含 id、theme、artStyle、generatedAt、sprites、prompts、notes。`sprites` 下按 tileset、heroes、enemies、skills、icons 分组。

## Phaser 如何加载资源

游戏优先尝试读取 `public/assets/generated` 下的资源。若资源不存在或未加载成功，`DungeonScene` 会使用 Phaser Graphics 动态生成内置图形，保证游戏仍然可玩。

## Fallback 方案

没有 Blender 时使用方式 A 的 SVG 程序化资源；没有 API key 时仍然生成 mock prompts 和 manifest。
