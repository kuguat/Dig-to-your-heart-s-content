# CLAUDE.md — 《挖个爽》考古游戏

## 项目概览
Phaser 3 网页端文化考古模拟游戏。1200×800 画布，单 HTML + 18 个 JS 文件，Express 静态服务。

## 文物图标系统
- 存储: `assets/artifacts/<id>.png` (256×256 PNG-24, 透明背景)
- 加载: BootScene `preload()` 中 `this.load.image('artifact_<id>', 'assets/artifacts/<id>.png')`
- 纹理 key 约定: `artifact_<artifactData中的id>`
- 显示: MuseumScene 卡片/详情弹窗、ExcavationScene 挖掘揭示/结果弹窗、MainScene 内嵌发掘/鉴定弹窗
- 规范文档: `文物图标制作规范.md` (20 种类型，81 个 PNG：61 件文物个体图标 + 20 类型通用图标)

## 场景流转
BootScene → MainScene ⇄ ExcavationScene / MuseumScene / PrestigeScene / RepairWorkshopScene

## 新手教程系统
- `src/tutorial/TutorialManager.js` — 分步引导流程（8步入门），含跨场景衔接（Step5→6 用 `window._tutorialPendingStep` 标记）
- `src/tutorial/TutorialUI.js` — 教程 UI 层：高亮聚光灯 + 文字气泡 + 下一步按钮
- 教程完成标记 `basic_complete` 存入 localStorage
- 修改步骤顺序/高亮坐标时须同步验证 ExcavationScene→MainScene 场景切换的引用传递

## 声望系统（六级阶梯制）
声望等级基于累积 `prestigePoints` 阈值计算（PrestigeManager.TIERS）：

| Lv | 名称 | 阈值(JP) | 解锁朝代 | 新增机制 |
|----|------|----------|----------|----------|
| 0 | 见习考古学家 | 0 | 新石器 | 基础发掘、5条升级线、**新手保护(无赝品)** |
| 1 | 初级考古学家 | 100 | 商周 | 🎯 鉴定之眼（直显真伪）|
| 2 | 中级考古学家 | 500 | 秦汉 | 🏛️ 博物馆图鉴+集齐套装奖励 |
| 3 | 高级考古学家 | 2,000 | 盛唐 | 🤖 科技考古(一键挖掘)+ ⚡高风险遗址 |
| 4 | 资深考古学家 | 10,000 | 宋元 | 🔧 文物修复工坊 |
| 5 | 首席考古学家 | 50,000 | 明清 | 🔄 学术休假(转生永久加成) |

- **Lv.0~4**: "提升声望"弹窗自行选择投入 JP 数量（下限5），系统按 1JP=¥500 计算消耗，JP+金钱双重扣除后累积永久声望；重置局内进度但保留图鉴
- **Lv.5**: 解锁"学术休假"（转生），重置全部进度换取永久加成
- 门槛校验: `canPrestige()` 要求 JP≥5 且资金≥¥2,500（5×500）
- 诱惑预览：声望技能树只显示当前等级+后2级，再往后显示"???"

## 核心对象（window 全局）
- `gameState` (GameState) — 资金 (BigNumber)、升级、JP、朝代
- `economyManager` (EconomyManager) — 收支
- `prestigeManager` (PrestigeManager) — 转生、声望等级、六级阶梯制
- `saveManager` (SaveManager) — 自动存档 30s 间隔
- `game` (Phaser.Game) — Phaser 实例

## 升级系统 (5 条线)
| ID | 名称 | 每级效果 | 最大 Lv | 基础价格 |
|----|------|----------|---------|----------|
| luck | 勘探运气 | +3% 真品率 | 50 | ¥1,000 |
| brushSize | 挖掘范围 | +4% 铲宽 | 50 | ¥2,000 |
| excavationSpeed | 挖掘速度 | +6% 力道 (baseDigPower=0.25) | 50 | ¥1,500 |
| artifactValue | 文物倍率 | +12% 价值 | 50 | ¥3,000 |
| appraisalAccuracy | 鉴定精度 | +5% 精度 | 50 | ¥2,500 |

费用公式: `baseCost × 1.5^level` (BigNumber 运算)
资金显示: `formatMoney()` 简写 (K/M/B/T，如 ¥12.5K)

## 新功能详情
### 鉴定之眼 (Lv.1)
- Lv.0 挖出全为真品；Lv.1+ 可能出现赝品
- 出土后直接显示真伪与估值，无鉴定小游戏

### 博物馆收藏奖励 (Lv.2)
- 右侧面板解锁"查看图鉴"按钮
- 集齐某朝代全部文物 → 该朝代文物价值永久 +5%
- 博物馆左侧面板显示各朝代收集进度

### 科技考古 (Lv.3)
- 中央发掘区上方出现"🤖 科技考古"按钮
- 开启后，点击发掘坑无需手动刮土，文物自动出土

### 高风险遗址 (Lv.3)
- "⚡ 高风险遗址"按钮，开启后所有遗址费用翻倍、风险翻倍
- 回报率翻倍（文物价值场加倍），但赝品率也翻倍

### 文物修复工坊 (Lv.4)
- 右侧面板"🔧 文物修复工坊"按钮 → RepairWorkshopScene
- 随机抽取已收集文物，限时修复裂缝（点击🔴）
- 修复度越高价值倍率越大（2x~5x）

### 学术休假/转生 (Lv.5)
- 右侧面板"开始转生"按钮
- 重置进度换取永久加成：+2%全属性/次 + 特定奖励
- Lv.0~4 只能"提升声望"，不能转生

## MainScene 布局 (1200×800)
- 顶部 (Y=35): 声望 Lv (x=60) / JP (x=195) / 资金 (x=330) / 朝代按钮 6 个 (x=540+index×120)
- 左侧面板 (x=20, y=155, 510px高): 发掘统计（5项, 行距38） + 分隔线 + 局内升级 (5按钮, 行距36)
- 中央发掘区 (x=350, y=185, 500×400): 土层预览 + 层位选择按钮 + 科技考古/高风险按钮
- 右侧面板 (x=900, y=180): 博物馆/零活打工/修复工坊/声望提升/转生
- 底部 (Y=750-800): 提示文字

## 红线规则
- **升级面板文字**: 使用 `setOrigin(0, 0.5)` / `setOrigin(0.5, 0.5)` 居中对齐，背景高 28px
- **朝代按钮事件**: 用 `btn.off('pointerdown')` 换事件，<strong>禁止 removeInteractive()</strong>（会丢失 hitArea）
- **全局输入**: `this.input.on('pointerdown')` 在 cleanupMinigame / cleanupExcavation 中必须 `off` 掉
- **BigNumber**: `new BigNumber(numberOrString)` 接收数字或字符串

## 运行
```bash
npm install && npm run dev
# http://localhost:3000
```

## 调试 (F12 Console)
```js
gameState.currentEra='shangzhou'; game.scene.start('MainScene');
gameState.prestigePoints=60000; gameState.prestigeLevel=5; game.scene.start('MainScene');
gameState.funds=new BigNumber(99999999);
```
