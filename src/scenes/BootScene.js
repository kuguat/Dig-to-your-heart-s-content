/**
 * 启动场景 - 加载资源
 */
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 显示加载进度
        const progressBar = document.getElementById('progress-fill');
        const loadingText = document.getElementById('loading-text');

        this.load.on('progress', (value) => {
            progressBar.style.width = (value * 100) + '%';
        });

        this.load.on('fileprogress', (file) => {
            loadingText.textContent = '加载: ' + file.key;
        });

        this.load.on('complete', () => {
            loadingText.textContent = '完成!';
        });

        loadingText.textContent = '正在初始化...';
    }

    create() {
        try {
            console.log('BootScene: 开始初始化...');
            
            // 初始化游戏状态
            window.gameState = new GameState();
            console.log('BootScene: GameState 初始化完成');
            
            window.economyManager = new EconomyManager(window.gameState);
            console.log('BootScene: EconomyManager 初始化完成');
            
            window.saveManager = new SaveManager(window.gameState);
            console.log('BootScene: SaveManager 初始化完成');
            
            window.prestigeManager = new PrestigeManager(window.gameState);
            console.log('BootScene: PrestigeManager 初始化完成');

            // 生成占位纹理
            console.log('BootScene: 开始生成纹理...');
            this.createAllTextures();
            console.log('BootScene: 纹理生成完成');

            // 尝试加载存档
            if (window.saveManager.hasSave()) {
                console.log('BootScene: 加载存档...');
                window.saveManager.load();
            }

            // 更新加载界面
            document.getElementById('loading-screen').classList.add('hidden');
            console.log('BootScene: 加载界面已隐藏');
            
            setTimeout(() => {
                console.log('BootScene: 启动 MainScene');
                this.scene.start('MainScene');
            }, 300);
        } catch (error) {
            console.error('BootScene error:', error);
            document.getElementById('loading-text').textContent = '加载失败: ' + error.message;
        }
    }

    createAllTextures() {
        const g = this.add.graphics();
        
        // 1. 按钮背景
        g.fillStyle(0x3d2817, 1);
        g.fillRect(0, 0, 150, 40);
        g.generateTexture('btn_bg', 150, 40);
        g.clear();

        // 2. 按钮高亮
        g.fillStyle(0x5a4030, 1);
        g.fillRect(0, 0, 150, 40);
        g.generateTexture('btn_hover', 150, 40);
        g.clear();

        // 3. 面板背景
        g.fillStyle(0x2c1810, 1);
        g.fillRect(0, 0, 200, 300);
        g.generateTexture('panel_bg', 200, 300);
        g.clear();

        // 4. 图标：钱
        g.fillStyle(0xf4d03f, 1);
        g.fillCircle(24, 24, 18);
        g.fillStyle(0xc9a227, 1);
        g.fillCircle(24, 24, 12);
        g.generateTexture('icon_money', 48, 48);
        g.clear();

        // 5. 图标：声望
        g.fillStyle(0xd4a574, 1);
        g.fillCircle(24, 24, 18);
        g.fillStyle(0xf4d03f, 1);
        g.fillCircle(24, 24, 10);
        g.generateTexture('icon_prestige', 48, 48);
        g.clear();

        // 6. 图标：转生
        g.fillStyle(0x9b59b6, 1);
        g.fillCircle(24, 24, 18);
        g.fillStyle(0xf5e6d3, 1);
        g.fillCircle(24, 24, 10);
        g.generateTexture('icon_prestige2', 48, 48);
        g.clear();

        // 7. 图标：发掘
        g.fillStyle(0x8b7355, 1);
        g.fillRect(20, 28, 8, 18);
        g.fillTriangle(14, 28, 34, 28, 24, 10);
        g.generateTexture('icon_excavate', 48, 48);
        g.clear();

        // 8. 图标：博物馆
        g.fillStyle(0xd4a574, 1);
        g.fillRect(10, 22, 28, 20);
        g.fillTriangle(6, 22, 42, 22, 24, 6);
        g.generateTexture('icon_museum', 48, 42);
        g.clear();

        // 9. 图标：刷子
        g.fillStyle(0xd4a574, 1);
        g.fillRect(10, 5, 10, 30);
        g.fillRect(8, 35, 14, 15);
        g.generateTexture('icon_brush', 32, 50);
        g.clear();

        // 10. 图标：升级
        g.fillStyle(0xf4d03f, 1);
        g.fillCircle(24, 24, 18);
        g.fillStyle(0xffffff, 1);
        g.fillTriangle(24, 12, 30, 28, 18, 28);
        g.generateTexture('icon_upgrade', 48, 48);
        g.clear();

        // 11. 图标：真品
        g.fillStyle(0x27ae60, 1);
        g.fillCircle(24, 24, 18);
        g.generateTexture('icon_authentic', 48, 48);
        g.clear();

        // 12. 图标：赝品
        g.fillStyle(0xc0392b, 1);
        g.fillCircle(24, 24, 18);
        g.generateTexture('icon_fake', 48, 48);
        g.clear();

        // 13. 图标：国宝
        g.fillStyle(0xf39c12, 1);
        g.fillCircle(24, 24, 18);
        g.generateTexture('icon_national', 48, 48);
        g.clear();

        // 14. 稀有度图标
        const rarityColors = {
            common: 0x888888,
            uncommon: 0x2ecc71,
            rare: 0x3498db,
            epic: 0x9b59b6,
            legendary: 0xf39c12,
            mythic: 0xe74c3c
        };

        for (const [rarity, color] of Object.entries(rarityColors)) {
            g.fillStyle(color, 1);
            g.fillCircle(16, 16, 14);
            g.generateTexture('rarity_' + rarity, 32, 32);
            g.clear();
        }

        // 15. 品相图标
        const conditionColors = [0x888888, 0xaaaaaa, 0xcccccc, 0xdddddd, 0xf4d03f, 0xf39c12, 0xe74c3c];
        for (let i = 0; i < conditionColors.length; i++) {
            g.fillStyle(conditionColors[i], 1);
            g.fillCircle(16, 16, 14);
            g.generateTexture('condition_' + i, 32, 32);
            g.clear();
        }

        // 16. 刷子光标
        g.fillStyle(0xffffff, 0.3);
        g.fillCircle(24, 24, 22);
        g.fillStyle(0xffffff, 0.6);
        g.fillCircle(24, 24, 14);
        g.generateTexture('brush_cursor', 48, 48);
        g.clear();

        // 17. 土层纹理
        g.fillStyle(0xc4784a, 1);
        g.fillRect(0, 0, 256, 256);
        g.generateTexture('soil_coarse', 256, 256);
        g.clear();

        g.fillStyle(0x8b7355, 1);
        g.fillRect(0, 0, 256, 256);
        g.generateTexture('soil_fine', 256, 256);
        g.clear();

        g.fillStyle(0x5a7a5a, 1);
        g.fillRect(0, 0, 256, 256);
        g.generateTexture('rust_patina', 256, 256);
        g.clear();

        g.fillStyle(0x2c1810, 1);
        g.fillRect(0, 0, 256, 256);
        g.generateTexture('bg_pattern', 256, 256);
        g.clear();

        // 18. 文物背景框
        g.lineStyle(3, 0xd4a574, 1);
        g.fillStyle(0x2c1810, 1);
        g.fillRect(0, 0, 200, 250);
        g.strokeRect(2, 2, 196, 246);
        g.generateTexture('artifact_frame', 200, 250);
        g.clear();

        // 19. 发掘探方边框
        g.lineStyle(4, 0x5a4030, 1);
        g.strokeRect(2, 2, 500, 400);
        g.generateTexture('excavation_border', 504, 404);

        // 销毁 graphics 对象
        g.destroy();
    }
}

window.BootScene = BootScene;
