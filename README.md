# 《挖个爽》文化考古游戏

## 简介
网页端文化考古模拟游戏。从新石器时代的陶片开始，发掘中华五千年文明的失落文物。核心玩法：刮土揭示文物 → 鉴定真伪 → 收益升级 → 提升声望解锁新机制 → 最终转生开启永久加成。

## 运行方式

浏览器打开 **https://kuguat.github.io/Dig-to-your-heart-s-content/**

## 技术栈
- **引擎**: Phaser 3.70 (CDN)
- **语言**: JavaScript ES6+
- **美术**: Canvas 2D 图形（UI 元素）+ 外部 PNG 文物图标（`assets/artifacts/`）
- **后端**: Express 静态文件服务器

## 声望六级阶梯

| Lv | 头衔 | 解锁朝代 | 新机制 |
|----|------|---------|--------|
| 0 | 见习考古学家 | 新石器 | 基础发掘、5条升级线、新手保护(无赝品) |
| 1 | 初级考古学家 | 商周 | 🎯 鉴定之眼（直显真伪） |
| 2 | 中级考古学家 | 秦汉 | 🏛️ 博物馆图鉴 + 集齐套装奖励 |
| 3 | 高级考古学家 | 盛唐 | 🤖 科技考古(一键挖掘) + ⚡高风险遗址 |
| 4 | 资深考古学家 | 宋元 | 🔧 文物修复工坊 |
| 5 | 首席考古学家 | 明清 | 🔄 学术休假(转生永久加成) |

> **升级消耗**：1JP = ¥50,000，玩家自行选择投入 JP 数量（最少 5 JP = ¥250,000），JP+金钱双重扣除后累积总 JP；总 JP 达阈值自动提升声望等级
>
> 玩家只能看到当前等级 + 往后2级的解锁内容

## 核心系统

| 系统 | 说明 |
|------|------|
| 刮土发掘 | 鼠标拖拽逐层清除土层，揭示文物 |
| 升级系统 | 5 条升级线（勘探运气/挖掘范围/速度/文物倍率/鉴定精度） |
| 朝代系统 | 6 个朝代，声望等级解锁 |
| 声望六阶 | 每升一级解锁新玩法机制 |
| 鉴定之眼 | Lv.1+ 文物出土直显真伪（Lv.0 新手保护无赝品） |
| 博物馆 | Lv.2 解锁，集齐朝代套装获得文物价值加成 |
| 科技考古 | Lv.3 解锁，一键自动挖掘 |
| 高风险遗址 | Lv.3 解锁，回报翻倍但赝品率也翻倍 |
| 文物修复工坊 | Lv.4 解锁，限时修复裂缝赚取 2~5 倍价值 |
| 学术休假(转生) | Lv.5 解锁，重置进度换取永久加成 |
| 新手教程 | 8步入门引导，聚光灯高亮 + 逐步操作指引 |
| 零活打工 | 清理探方、修复陶片两个迷你游戏 |
| 存档系统 | 自动存档 (localStorage)，断线可续 |

## 项目结构
```
assets/
└── artifacts/               # 文物 PNG 图标（256×256）
src/
├── game.js                  # Phaser 入口
├── config/
│   └── gameConfig.js        # 全局配置 (1200×800)
├── core/
│   ├── GameState.js         # 游戏状态 (资金、升级、JP)
│   ├── BigNumber.js         # 大数系统
│   ├── EconomyManager.js    # 收支管理
│   ├── PrestigeManager.js   # 声望六级阶 + 转生
│   ├── SaveManager.js       # 自动存档 (30s 间隔)
│   └── AudioManager.js      # 音效管理
├── security/
│   ├── AnomalyDetector.js   # 异常行为检测
│   ├── DataValidator.js     # 存档校验
│   └── HaSAnonymizer.js     # 数据匿名化
├── data/
│   ├── eraData.js           # 6 个朝代 + 层位数据
│   └── artifactData.js      # 文物数据（61件）
├── tutorial/
│   ├── TutorialManager.js  # 新手引导流程控制
│   └── TutorialUI.js       # 聚光灯 + 气泡 UI
└── scenes/
    ├── BootScene.js         # 启动加载
    ├── MainScene.js         # 主界面 (内嵌发掘)
    ├── ExcavationScene.js   # 发掘场景
    ├── MuseumScene.js       # 博物馆（图鉴+收藏奖励）
    └── RepairWorkshopScene.js # 文物修复工坊
```

## 开发者测试
F12 打开浏览器控制台，粘贴以下命令：

```js
// 切换朝代 (neolithic / shangzhou / qinhan / tang / songyuan / mingqing)
window.gameState.currentEra='tang'; game.scene.start('MainScene');

// 满声望 (Lv.5，全内容解锁)
window.gameState.prestigePoints=55000; window.gameState.prestigeLevel=5; game.scene.start('MainScene');

// 无限钱
window.gameState.funds=new BigNumber(1e15);

// 本局 JP 100
window.gameState.jackpotPointsThisRun = 100;

// 清除存档
localStorage.removeItem('qianzai_game_save');
localStorage.removeItem('qianzai_permanent_save');
location.reload();
```
