/**
 * 游戏入口 - 初始化 Phaser
 */

// Phaser 配置
const config = {
    type: Phaser.AUTO,
    width: GameConfig.width,
    height: GameConfig.height,
    parent: 'game-canvas',
    backgroundColor: GameConfig.backgroundColor,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MainScene, ExcavationScene, MuseumScene, PrestigeScene],
    input: {
        activePointers: 2 // 支持多点触控
    }
};

// 创建游戏实例
const game = new Phaser.Game(config);

// 暴露到全局
window.game = game;

// 游戏启动后显示
console.log('🎮 《挖个爽》游戏已启动');
console.log('📖 挖个爽，从这里开始...');
