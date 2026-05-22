# CLAUDE.md — 《挖个爽》考古游戏

## 项目概览
Phaser 3 网页端文化考古模拟游戏。1200×800 画布，单 HTML + 14 个 JS 文件，Express 静态服务。

## 场景流转
BootScene → MainScene ⇄ ExcavationScene / MuseumScene / PrestigeScene

## 核心对象（window 全局）
- `gameState` (GameState) — 资金 (BigNumber)、升级、JP、朝代
- `economyManager` (EconomyManager) — 收支
- `prestigeManager` (PrestigeManager) — 转生、声望等级
- `saveManager` (SaveManager) — 自动存档 30s 间隔
- `game` (Phaser.Game) — Phaser 实例

## 朝代解锁
| 声望 Lv | 解锁 |
|---------|------|
| 0 | 新石器 |
| 1 | 夏商周 + 修复陶片零活 |
| 2 | 秦汉 |
| 3 | 唐 |
| 4 | 宋元 |
| 5 | 明清 |

EraData (eraData.js) 定义每个朝代的 sites 数组 (cost / risk / baseReward)。

## 升级系统 (5 条线)
| ID | 名称 | 每级效果 | 最大 Lv | 基础价格 |
|----|------|----------|---------|----------|
| luck | 勘探运气 | +2% 真品率 | 50 | ¥1,000 |
| brushSize | 刷除范围 | +4% 铲宽 | 50 | ¥2,000 |
| excavationSpeed | 清理速度 | +6% 力道 | 50 | ¥1,500 |
| artifactValue | 文物倍率 | +20% 价值 | 50 | ¥3,000 |
| appraisalAccuracy | 鉴定精度 | +3% 精度 | 50 | ¥2,500 |

费用公式: `baseCost × 1.8^level` (BigNumber 运算)

## MainScene 布局 (1200×800)
- 顶部 (0-70): 声望 Lv / JP / 资金 / 朝代按钮 (6个，x=550+index×80)
- 左侧面板 (0-280): 5 个升级按钮，单行排列 `[图标] 名称 效果 Lv ¥cost`
- 中央发掘区 (350,200): 500×400 土层预览 + 层位选择按钮
- 右侧面板 (920-1200): 零活打工 / 博物馆 / 转生
- 底部: 统计面板 + 提示

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
gameState.prestigePoints=1000; gameState.prestigeLevel=10; game.scene.start('MainScene');
gameState.funds=new BigNumber(99999999);
```
