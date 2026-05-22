# 《挖个爽》文化考古游戏

## 简介
网页端文化考古模拟游戏。从新石器时代的陶片开始，发掘中华五千年文明的失落文物。核心玩法：刮土揭示文物 → 鉴定真伪 → 收益升级 → 攒 JP 转生，解锁更高朝代。

## 运行方式
```bash
npm install          # 仅首次
npm run dev          # 启动 Express 服务器
```
浏览器打开 **http://localhost:3000**

## 技术栈
- **引擎**: Phaser 3.70 (CDN)
- **语言**: JavaScript ES6+
- **美术**: Canvas 2D 图形（无外部素材依赖）
- **后端**: Express 静态文件服务器

## 核心系统 (已实现)

| 系统 | 说明 |
|------|------|
| 刮土发掘 | 鼠标拖拽逐层清除土层，揭示文物 |
| 升级系统 | 5 条升级线，每线最高 Lv.50 |
| 朝代系统 | 6 个朝代，声望等级解锁 |
| 声望/转生 | 攒 JP 转生获取永久加成 |
| 零活打工 | 清理探方、修复陶片两个迷你游戏 |
| 文物图鉴 | 博物馆收藏已发现文物 |
| 存档系统 | 自动存档 (localStorage)，断线可续 |

## 项目结构
```
src/
├── game.js                # Phaser 入口
├── config/
│   └── gameConfig.js      # 全局配置 (1200×800)
├── core/
│   ├── GameState.js       # 游戏状态 (资金、升级、JP)
│   ├── BigNumber.js       # 大数系统
│   ├── EconomyManager.js  # 收支管理
│   ├── PrestigeManager.js # 声望/转生
│   └── SaveManager.js     # 自动存档 (30s 间隔)
├── data/
│   ├── eraData.js         # 6 个朝代 + 层位数据
│   └── artifactData.js    # 文物数据
└── scenes/
    ├── BootScene.js       # 启动加载
    ├── MainScene.js       # 主界面 (内嵌发掘)
    ├── ExcavationScene.js # 发掘场景
    ├── MuseumScene.js     # 博物馆
    └── PrestigeScene.js   # 转生界面
```

## 开发者测试
F12 打开浏览器控制台，粘贴以下命令：

```js
// 切换朝代 (neolithic / shangzhou / qinhan / tang / songyuan / mingqing)
gameState.currentEra='tang'; game.scene.start('MainScene');

// 满声望 (Lv.10，全朝代解锁)
gameState.prestigePoints=1000; gameState.prestigeLevel=10; game.scene.start('MainScene');

// 无限钱
gameState.funds=new BigNumber(99999999);
```
