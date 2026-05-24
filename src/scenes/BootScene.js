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

        // 图片加载失败时不阻塞
        this.load.on('loaderror', (file) => {
            console.warn('BootScene: 加载失败 - ' + file.key + ' (' + file.url + ')');
        });

        // 加载全部61件文物专属PNG图标
        this._artifactIds = [];
        for (const era of ['neolithic','shangzhou','qinhan','tang','songyuan','mingqing']) {
            if (window.ArtifactData && window.ArtifactData[era]) {
                for (const a of window.ArtifactData[era]) {
                    const key = 'artifact_' + a.id;
                    this._artifactIds.push(key);
                    this.load.image(key, 'assets/artifacts/' + a.id + '.png');
                }
            }
        }
        console.log('BootScene: 预加载 ' + this._artifactIds.length + ' 件文物PNG');
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

            // 初始化音效系统
            try {
                window.audioManager = new AudioManager();
                // 立即创建 AudioContext（此时是 suspended，需用户交互后才能 resume）
                window.audioManager.init();
                console.log('BootScene: AudioManager 初始化完成, state=' +
                    (window.audioManager.ctx ? window.audioManager.ctx.state : 'null'));
            } catch (e) {
                console.warn('BootScene: AudioManager 初始化失败，音效已禁用', e);
                window.audioManager = null;
            }

            // 生成 UI 占位纹理
            console.log('BootScene: 开始生成 UI 纹理...');
            this.createAllTextures();
            console.log('BootScene: UI 纹理生成完成');
            console.log('BootScene: 文物纹理已通过 PNG 预加载完成 (' + this._artifactIds.length + ' 件)');

            // 尝试加载存档
            if (window.saveManager.hasSave()) {
                console.log('BootScene: 加载存档...');
                window.saveManager.load();
            }

            // 加载音效（首次用户交互时激活 AudioContext）
            let audioUnlocked = false;
            const resumeAudio = () => {
                if (audioUnlocked) return;
                audioUnlocked = true;
                if (window.audioManager && window.audioManager.enabled) {
                    console.log('BootScene: 用户首次交互，激活音频...');
                    window.audioManager.resume();
                }
            };
            ['pointerdown', 'mousedown', 'keydown', 'touchstart'].forEach(type => {
                document.addEventListener(type, resumeAudio, { once: true, passive: true });
            });

            // 更新加载界面
            document.getElementById('loading-screen').classList.add('hidden');
            console.log('BootScene: 加载界面已隐藏');
            
            setTimeout(() => {
                try {
                    console.log('BootScene: 启动 MainScene');
                    this.scene.start('MainScene');
                } catch (e) {
                    console.error('BootScene: 启动 MainScene 失败', e);
                    document.getElementById('loading-screen').classList.remove('hidden');
                    document.getElementById('loading-text').textContent =
                        '启动失败: ' + (e.message || e);
                }
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

        // ═══════════════════════════════════════════════════
        //  图标纹理 — 48x48，四对冲突图标轮廓彻底不同：
        //    声望=盾形 vs 运气=十字花形
        //    金钱=圆铜钱 vs 倍率=菱牌
        //    真品/赝品=圆角条牌 vs 精度=方靶
        //    速度=闪电形 vs 发掘=铲形
        // ═══════════════════════════════════════════════════

        // ── 4. icon_money — 金钱：圆形铜钱 ──
        g.fillStyle(0xf4d03f, 1);
        g.fillCircle(24, 24, 22);
        g.fillStyle(0xe2bc29, 1);
        g.fillCircle(24, 24, 17);
        g.fillStyle(0x2c1810, 1);
        g.fillRect(17, 17, 14, 14);
        g.lineStyle(1, 0xfef3c7, 0.5);
        g.strokeCircle(24, 24, 21);
        g.generateTexture('icon_money', 48, 48);
        g.clear();

        // ── 5. icon_prestige — 声望：棕色盾形+金色五角星 ──
        g.fillStyle(0x5a4030, 1);
        g.fillTriangle(8, 4, 40, 4, 40, 18);
        g.fillTriangle(8, 4, 8, 18, 40, 18);
        g.fillTriangle(8, 18, 40, 18, 24, 44);
        g.fillStyle(0xffd700, 1);
        g.fillTriangle(24, 7, 28, 18, 20, 18);
        g.fillTriangle(18, 14, 30, 28, 24, 30);
        g.fillTriangle(30, 14, 18, 28, 24, 30);
        g.fillTriangle(24, 28, 28, 14, 20, 14);
        g.fillTriangle(14, 18, 26, 14, 26, 22);
        g.fillTriangle(34, 18, 22, 14, 22, 22);
        g.generateTexture('icon_prestige', 48, 48);
        g.clear();

        // ── 6. icon_prestige2 — JP：紫色圆+白色菱形 ──
        g.fillStyle(0x9b59b6, 1);
        g.fillCircle(24, 24, 22);
        g.fillStyle(0xf5e6d3, 1);
        g.fillTriangle(24, 5, 38, 24, 24, 43);
        g.fillTriangle(10, 24, 24, 5, 24, 43);
        g.fillStyle(0x9b59b6, 1);
        g.fillTriangle(24, 10, 32, 24, 24, 38);
        g.fillTriangle(16, 24, 24, 10, 24, 38);
        g.generateTexture('icon_prestige2', 48, 48);
        g.clear();

        // ── 7. icon_excavate — 发掘次数：铲形（L形） ──
        g.fillStyle(0x5a4030, 1);
        g.fillRect(19, 4, 10, 22);
        g.fillStyle(0x8b7355, 1);
        g.fillRect(10, 24, 28, 6);
        g.fillTriangle(10, 30, 38, 30, 24, 44);
        g.fillStyle(0xb8956a, 1);
        g.fillRect(12, 25, 24, 3);
        g.generateTexture('icon_excavate', 48, 48);
        g.clear();

        // ── 8. icon_museum — 博物馆：三角顶+方房体 ──
        g.fillStyle(0x8b7355, 1);
        g.fillRect(6, 30, 36, 16);
        g.fillStyle(0xd4a574, 1);
        g.fillRect(10, 16, 28, 16);
        g.fillStyle(0xc4a46a, 1);
        g.fillRect(6, 12, 36, 8);
        g.fillTriangle(4, 12, 44, 12, 24, 3);
        g.fillStyle(0x2c1810, 1);
        g.fillRect(19, 23, 10, 14);
        g.generateTexture('icon_museum', 48, 48);
        g.clear();

        // ── 9. icon_brush — 毛刷：刷形工具 ──
        g.fillStyle(0x5a4030, 1);
        g.fillRect(19, 2, 10, 20);
        g.fillStyle(0x9b8b6f, 1);
        g.fillRect(17, 18, 14, 5);
        g.fillStyle(0xd4a574, 1);
        g.fillRect(10, 23, 28, 22);
        g.lineStyle(1, 0xb8956a, 0.5);
        for (let ry = 27; ry < 44; ry += 4) {
            g.lineBetween(11, ry, 37, ry);
        }
        g.fillStyle(0xc4b89a, 1);
        g.fillRect(17, 19, 14, 2);
        g.generateTexture('icon_brush', 48, 48);
        g.clear();

        // ── 10. icon_upgrade — 升级：绿圆+向上箭头 ──
        g.fillStyle(0x27ae60, 1);
        g.fillCircle(24, 24, 22);
        g.fillStyle(0xf5e6d3, 1);
        g.fillTriangle(24, 8, 34, 30, 14, 30);
        g.fillRect(21, 26, 6, 14);
        g.generateTexture('icon_upgrade', 48, 48);
        g.clear();

        // ── 11. icon_authentic — 真品：绿色圆角条牌+白色粗勾✓ ──
        g.fillStyle(0x27ae60, 1);
        g.fillRoundedRect(3, 10, 42, 28, 8);
        g.lineStyle(5, 0xffffff, 1);
        g.lineBetween(14, 26, 22, 34);
        g.lineBetween(22, 34, 36, 16);
        g.generateTexture('icon_authentic', 48, 48);
        g.clear();

        // ── 12. icon_fake — 赝品：红色圆角条牌+白色粗叉✗ ──
        g.fillStyle(0xc0392b, 1);
        g.fillRoundedRect(3, 10, 42, 28, 8);
        g.lineStyle(5, 0xffffff, 1);
        g.lineBetween(14, 16, 34, 32);
        g.lineBetween(34, 16, 14, 32);
        g.generateTexture('icon_fake', 48, 48);
        g.clear();

        // ── 13. icon_national — 国宝：金圆底+皇冠 ──
        g.fillStyle(0xf39c12, 1);
        g.fillCircle(24, 24, 22);
        g.fillStyle(0xf5e6d3, 1);
        g.fillRect(8, 30, 32, 8);
        g.fillRect(10, 14, 8, 18);
        g.fillRect(20, 10, 8, 22);
        g.fillRect(30, 14, 8, 18);
        g.fillStyle(0xe74c3c, 1);
        g.fillCircle(24, 8, 3);
        g.fillCircle(14, 12, 3);
        g.fillCircle(34, 12, 3);
        g.generateTexture('icon_national', 48, 48);
        g.clear();

        // ── 14. icon_luck — 运气：绿色十字花形（竖+横圆角条，无圆底） ──
        g.fillStyle(0x27ae60, 1);
        g.fillRoundedRect(16, 3, 16, 42, 6);
        g.fillRoundedRect(3, 16, 42, 16, 6);
        g.fillStyle(0xf5e6d3, 1);
        g.fillCircle(24, 24, 5);
        g.generateTexture('icon_luck', 48, 48);
        g.clear();

        // ── 15. icon_speed — 挖掘速度：蓝色闪电形（锯齿折线） ──
        g.fillStyle(0x3498db, 1);
        g.fillTriangle(28, 3, 36, 22, 22, 22);
        g.fillRect(22, 18, 6, 8);
        g.fillTriangle(20, 24, 28, 45, 14, 24);
        g.fillRect(20, 22, 4, 4);
        g.fillStyle(0xffd700, 1);
        g.fillTriangle(30, 6, 35, 19, 25, 19);
        g.fillTriangle(22, 27, 27, 42, 17, 27);
        g.generateTexture('icon_speed', 48, 48);
        g.clear();

        // ── 16. icon_multiplier — 文物倍率：橙色菱形牌+白色粗叉× ──
        g.fillStyle(0xe67e22, 1);
        g.fillTriangle(24, 3, 45, 24, 24, 45);
        g.fillTriangle(3, 24, 24, 3, 24, 45);
        g.lineStyle(5, 0xffffff, 1);
        g.lineBetween(15, 15, 33, 33);
        g.lineBetween(33, 15, 15, 33);
        g.generateTexture('icon_multiplier', 48, 48);
        g.clear();

        // ── 17. icon_accuracy — 鉴定精度：紫色方靶+红心 ──
        g.fillStyle(0x8e44ad, 1);
        g.fillRoundedRect(2, 2, 44, 44, 4);
        g.fillStyle(0x2c1810, 1);
        g.fillRoundedRect(7, 7, 34, 34, 3);
        g.lineStyle(3, 0xffffff, 1);
        g.strokeCircle(24, 24, 14);
        g.strokeCircle(24, 24, 8);
        g.fillStyle(0xe74c3c, 1);
        g.fillCircle(24, 24, 4);
        g.fillStyle(0xffffff, 1);
        g.fillRect(23, 4, 2, 8);
        g.fillRect(23, 36, 2, 8);
        g.fillRect(4, 23, 8, 2);
        g.fillRect(36, 23, 8, 2);
        g.generateTexture('icon_accuracy', 48, 48);
        g.clear();

        // ── 18. icon_collection — 图鉴：翻开书本形 ──
        g.fillStyle(0x8b7355, 1);
        g.fillRoundedRect(5, 12, 17, 30, 4);
        g.fillStyle(0xd4a574, 1);
        g.fillRoundedRect(26, 12, 17, 30, 4);
        g.fillStyle(0x5a4030, 1);
        g.fillRect(22, 12, 4, 30);
        g.fillStyle(0xc4a46a, 1);
        for (let ly = 18; ly < 38; ly += 6) {
            g.fillRect(8, ly, 11, 2);
        }
        g.fillStyle(0xf5e6d3, 1);
        for (let ly = 18; ly < 38; ly += 6) {
            g.fillRect(29, ly, 11, 2);
        }
        g.fillStyle(0xe74c3c, 1);
        g.fillTriangle(24, 40, 28, 47, 20, 47);
        g.generateTexture('icon_collection', 48, 48);
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
