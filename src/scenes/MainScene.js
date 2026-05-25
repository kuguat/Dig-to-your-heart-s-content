/**
 * 主场景 - 游戏主界面（含内嵌挖掘）
 */
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    create() {
        try {
            this.config = GameConfig;
            this.state = window.gameState;
            this.economy = window.economyManager;
            this.saveManager = window.saveManager;
            this.prestigeManager = window.prestigeManager;
            this.audio = window.audioManager;

            // 安全校验：确保状态对象完整
            if (!this.state || !this.economy || !this.saveManager || !this.prestigeManager) {
                console.error('MainScene: 核心管理器未初始化，重置状态');
                window.gameState = new GameState();
                window.economyManager = new EconomyManager(window.gameState);
                window.saveManager = new SaveManager(window.gameState);
                window.prestigeManager = new PrestigeManager(window.gameState);
                this.state = window.gameState;
                this.economy = window.economyManager;
                this.saveManager = window.saveManager;
                this.prestigeManager = window.prestigeManager;
            }

            // 确保 prestigeLevel 有效
            if (typeof this.state.prestigeLevel !== 'number' || this.state.prestigeLevel < 0 || this.state.prestigeLevel > 5) {
                console.warn('MainScene: prestigeLevel 无效 (' + this.state.prestigeLevel + ')，重置为 0');
                this.state.prestigeLevel = 0;
            }

            // 启动自动存档
            this.saveManager.startAutoSave();

            // 入场淡入过渡
            this.cameras.main.fadeIn(400, 26, 15, 10);

            // 创建界面
            this.createBackground();
            this.createHeader();
            this.createExcavationArea();
            this.createLeftPanel();
            this.createRightPanel();
            this.createBottomBar();

            // 同步统计面板与实际数据
            this.updateUI();

            // 显示欢迎提示
            this.showWelcomeMessage();

            // 挖掘相关状态
            this.isDigging = false;
            this.isLaboring = false;
            this.laborType = null;
            this.laborCleanCooldown = 0;
            this.laborPotteryCooldown = 0;
            this.techArchaeologyEnabled = false;
        } catch (e) {
            console.error('MainScene.create 错误:', e);
            try {
                const errorText = this.add.text(
                    this.config ? this.config.width / 2 : 600,
                    this.config ? this.config.height / 2 : 400,
                    '游戏加载失败\n请刷新页面重试\n\n' + (e.message || e),
                    {
                        fontSize: '22px',
                        fontFamily: 'Arial, sans-serif',
                        color: '#ff4444',
                        align: 'center',
                        backgroundColor: '#1a0000',
                        padding: { x: 30, y: 20 }
                    }
                ).setOrigin(0.5).setDepth(1000);
            } catch (e2) {
                console.error('无法显示错误信息:', e2);
            }
        }
    }

    createBackground() {
        const bg = this.add.graphics();
        bg.fillStyle(0x1a0f0a, 1);
        bg.fillRect(0, 0, this.config.width, this.config.height);

        bg.lineStyle(1, 0x3d2817, 0.3);
        for (let y = 0; y < this.config.height; y += 40) {
            bg.lineBetween(0, y, this.config.width, y);
        }

        bg.fillStyle(0x2c1810, 1);
        bg.fillRect(0, 0, this.config.width, 70);
        bg.lineStyle(2, 0xd4a574, 0.5);
        bg.lineBetween(0, 70, this.config.width, 70);
    }

    createHeader() {
        const headerY = 35;

        // 声望图标 + 文字 — 点击跳转声望系统
        const prestigeIcon = this.add.image(60, headerY, 'icon_prestige').setScale(0.8)
            .setInteractive({ useHandCursor: true });
        this.prestigeText = this.add.text(85, headerY - 8, `声望 Lv.${this.state.prestigeLevel}`, {
            fontSize: '18px', fontFamily: GameConfig.typography.fontFamily, color: '#d4a574'
        }).setInteractive({ useHandCursor: true });

        const gotoPrestige = () => {
            if (this.audio) this.audio.click();
            this.cameras.main.fadeOut(300, 26, 15, 10);
            this.time.delayedCall(300, () => this.scene.start('PrestigeScene'));
        };
        prestigeIcon.on('pointerdown', gotoPrestige);
        this.prestigeText.on('pointerdown', gotoPrestige);
        this.prestigeText.on('pointerover', () => this.prestigeText.setColor('#f4d03f'));
        this.prestigeText.on('pointerout', () => this.prestigeText.setColor('#d4a574'));

        // JP 图标 + 文字 — 也可点击跳转
        const jpIcon = this.add.image(195, headerY, 'icon_prestige2').setScale(0.8)
            .setInteractive({ useHandCursor: true });
        this.jpText = this.add.text(220, headerY - 8, `${this.state.prestigePoints} JP`, {
            fontSize: '18px', fontFamily: GameConfig.typography.fontFamily, color: '#9b59b6'
        }).setInteractive({ useHandCursor: true });

        jpIcon.on('pointerdown', gotoPrestige);
        this.jpText.on('pointerdown', gotoPrestige);
        this.jpText.on('pointerover', () => this.jpText.setColor('#d4a574'));
        this.jpText.on('pointerout', () => this.jpText.setColor('#9b59b6'));

        this.add.image(330, headerY, 'icon_money').setScale(0.8);
        this.fundsText = this.add.text(355, headerY - 8, `¥${this.formatMoney(this.state.funds.toNumber())}`, {
            fontSize: '22px', fontFamily: GameConfig.typography.fontFamily, color: '#f4d03f', fontStyle: 'bold'
        });

        this.eraButtons = [];
        const eras = [
            { id: 'neolithic', name: '新石器' },
            { id: 'shangzhou', name: '夏商周' },
            { id: 'qinhan', name: '秦汉' },
            { id: 'tang', name: '唐' },
            { id: 'songyuan', name: '宋元' },
            { id: 'mingqing', name: '明清' }
        ];

        eras.forEach((era, index) => {
            const x = 540 + index * 120;
            const btn = this.add.text(x, headerY, era.name, {
                fontSize: '16px', fontFamily: GameConfig.typography.fontFamily,
                color: index === 0 ? '#d4a574' : '#8b7355',
                backgroundColor: index === 0 ? '0x3d2817' : '0x2c1810',
                padding: { x: 15, y: 5 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true })
              .on('pointerdown', () => this.selectEra(era.id));
            this.addButtonEffects(btn, 1.08);
            this.eraButtons.push({ btn, era });
        });

        this.updateEraButtons();
    }

    createExcavationArea() {
        const ex = this.config.excavation;

        // 发掘区域背景
        this.excavationBg = this.add.graphics();
        this.excavationBg.fillStyle(0x2c1810, 1);
        this.excavationBg.fillRoundedRect(ex.x - 10, ex.y - 10, ex.width + 20, ex.height + 20, 15);
        this.excavationBg.lineStyle(3, 0xd4a574, 0.6);
        this.excavationBg.strokeRoundedRect(ex.x - 10, ex.y - 10, ex.width + 20, ex.height + 20, 15);

        // 地层预览（静态，非挖掘时显示）
        this.soilPreview = this.add.graphics();
        this.drawSoilPreview();

        // 挖掘时的地层图层容器（初始隐藏）
        this.strataGraphics = [];
        this.scrapeLayer = null;
        this.artifactOutline = null;
        this.artifactLabel = null;
        this.questionMark = null;

        // 文物显示占位
        this.artifactDisplay = this.add.image(ex.x + ex.width/2, ex.y + ex.height/2, 'rarity_common')
            .setDisplaySize(100, 100).setAlpha(0);

        // 提示文字
        this.promptText = this.add.text(ex.x + ex.width/2, ex.y + ex.height/2,
            '选择发掘层位开始考古', {
                fontSize: '20px', fontFamily: GameConfig.typography.fontFamily,
                color: '#8b7355', align: 'center'
            }).setOrigin(0.5);

        // 层位选择区域 —— 加分隔线与发掘区拉开距离
        this.siteSeparator = this.add.graphics();
        this.siteSeparator.lineStyle(1, 0xd4a574, 0.25);
        this.siteSeparator.lineBetween(ex.x, ex.y + ex.height + 48, ex.x + ex.width, ex.y + ex.height + 48);

        // ── 科技考古按钮（Lv.3+ 解锁）──
        this.techArchaeologyBtn = null;
        this.techArchaeologyLabel = null;
        if (this.state.prestigeLevel >= 3) {
            this.createTechArchaeologyToggle(ex);
        }

        this.siteButtons = [];
        const siteY = ex.y + ex.height + 76;
        this.createSiteButtons(siteY);
    }

    createSiteButtons(y) {
        this.siteButtons = [];
        const era = EraData[this.state.currentEra];
        if (!era || !era.sites) return;

        const startX = this.config.excavation.x + 20;
        const btnWidth = 135;
        const gap = 8;
        const maxPerRow = Math.floor((this.config.excavation.width - 40) / (btnWidth + gap));

        era.sites.forEach((site, index) => {
            const row = Math.floor(index / maxPerRow);
            const col = index % maxPerRow;
            const x = startX + col * (btnWidth + gap);
            const by = y + row * 58;
            const btn = this.createSiteButton(x + btnWidth/2, by, site);
            this.siteButtons.push({ btn, site });
        });
    }

    createSiteButton(x, y, site) {
        const container = this.add.container(x, y);
        const bg = this.add.graphics();
        bg.fillStyle(0x3d2817, 1);
        bg.fillRoundedRect(-70, -25, 140, 50, 8);
        container.add(bg);

        const nameText = this.add.text(0, -10, site.name, {
            fontSize: '14px', fontFamily: GameConfig.typography.fontFamily, color: '#d4a574'
        }).setOrigin(0.5);
        container.add(nameText);

        const costLabel = site.cost === 0 ? '免费' : `¥${new BigNumber(site.cost).toString()}`;
        const costText = this.add.text(0, 10, costLabel, {
            fontSize: '12px', fontFamily: GameConfig.typography.fontFamily,
            color: site.cost === 0 ? '#27ae60' : '#f4d03f'
        }).setOrigin(0.5);
        container.add(costText);

        const riskLabel = site.risk > 0.2 ? '高回报' :
            site.risk > 0.05 ? '中风险' : '低风险';
        const riskColor = site.risk > 0.2 ? '#e74c3c' : (site.risk > 0.05 ? '#f39c12' : '#27ae60');
        const riskText = this.add.text(50, -10, riskLabel, {
            fontSize: '10px', fontFamily: GameConfig.typography.fontFamily, color: riskColor
        }).setOrigin(0.5);
        container.add(riskText);

        container.setSize(140, 50);
        container.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.startExcavation(site))
            .on('pointerover', () => {
                bg.clear(); bg.fillStyle(0x5a4030, 1); bg.fillRoundedRect(-70, -25, 140, 50, 8);
                this.showMessage(`📍 ${site.name}：${site.description}`, 'info');
            })
            .on('pointerout', () => {
                bg.clear(); bg.fillStyle(0x3d2817, 1); bg.fillRoundedRect(-70, -25, 140, 50, 8);
            });

        return container;
    }

    // ── 科技考古：Lv.3 解锁，切换开关 ──
    createTechArchaeologyToggle(ex) {
        const y = ex.y - 32;
        const labelX = ex.x + ex.width - 10;

        this.techArchaeologyLabel = this.add.text(labelX, y, '🤖 科技考古', {
            fontSize: '12px', fontFamily: GameConfig.typography.fontFamily, color: '#8b7355',
            backgroundColor: '#2c1810', padding: { x: 8, y: 3 }
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(15);

        this.techArchaeologyLabel.on('pointerdown', () => {
            this.techArchaeologyEnabled = !this.techArchaeologyEnabled;
            if (this.techArchaeologyEnabled) {
                this.techArchaeologyLabel.setText('🤖 科技考古 ✓');
                this.techArchaeologyLabel.setColor('#27ae60');
                this.techArchaeologyLabel.setStyle({
                    fontSize: '12px', fontFamily: GameConfig.typography.fontFamily, color: '#27ae60',
                    backgroundColor: '#1a3d1a', padding: { x: 8, y: 3 }
                });
                this.showMessage('🤖 科技考古已开启：点击层位即可自动出土文物');
            } else {
                this.techArchaeologyLabel.setText('🤖 科技考古');
                this.techArchaeologyLabel.setColor('#8b7355');
                this.techArchaeologyLabel.setStyle({
                    fontSize: '12px', fontFamily: GameConfig.typography.fontFamily, color: '#8b7355',
                    backgroundColor: '#2c1810', padding: { x: 8, y: 3 }
                });
                this.showMessage('切回手动刮土模式');
            }
        });
    }

    // ── 文物修复工坊按钮（Lv.4 解锁，升级动态创建）──
    createRepairWorkshopBtn() {
        const panelX = this.config.width - 300;
        const panelY = 180;
        this.workshopBtn = this.add.text(panelX + 140, panelY + 140, '🔧 文物修复工坊', {
            fontSize: '14px', fontFamily: GameConfig.typography.fontFamily, color: '#7fb3d5',
            backgroundColor: '#1a2d3d', padding: { x: 14, y: 6 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.workshopBtn.on('pointerdown', () => {
            if (this.audio) this.audio.click();
            this.cameras.main.fadeOut(300, 26, 15, 10);
            this.time.delayedCall(300, () => this.scene.start('RepairWorkshopScene'));
        });
        this.addButtonEffects(this.workshopBtn);
    }

    createLeftPanel() {
        const panelX = 20;
        const panelY = 155;
        const panelH = 510;

        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x2c1810, 0.95);
        panelBg.fillRoundedRect(panelX, panelY, 280, panelH, 12);
        panelBg.lineStyle(2, 0xd4a574, 0.3);
        panelBg.strokeRoundedRect(panelX, panelY, 280, panelH, 12);

        this.add.text(panelX + 140, panelY + 20, '📦 发掘统计', {
            fontSize: '16px', fontFamily: GameConfig.typography.fontFamily, color: '#d4a574', fontStyle: 'bold'
        }).setOrigin(0.5);

        const stats = [
            { label: '发掘次数', key: 'totalExcavations', icon: 'icon_excavate' },
            { label: '发现文物', key: 'totalArtifactsFound', icon: 'icon_museum' },
            { label: '真品/赝品', key: 'authFakeRatio', icon: 'icon_authentic', custom: true },
            { label: '国宝数量', key: 'totalNationalTreasures', icon: 'icon_national' },
            { label: '图鉴收集', key: 'collectionProgress', icon: 'icon_collection', custom: true }
        ];

        this.statTexts = {};
        stats.forEach((stat, index) => {
            const y = panelY + 55 + index * 38;
            this.add.image(panelX + 25, y, stat.icon).setScale(0.6);
            this.add.text(panelX + 50, y - 5, stat.label + ':', {
                fontSize: '14px', fontFamily: GameConfig.typography.fontFamily, color: '#8b7355'
            });
            this.statTexts[stat.key] = this.add.text(panelX + 240, y - 5, '0', {
                fontSize: '14px', fontFamily: GameConfig.typography.fontFamily, color: '#f5e6d3', fontStyle: 'bold'
            }).setOrigin(1, 0);
        });

        const dividerY = panelY + 55 + 5 * 38 + 10;
        const div = this.add.graphics();
        div.lineStyle(1, 0xd4a574, 0.25);
        div.lineBetween(panelX + 15, dividerY, panelX + 265, dividerY);

        const upgradeTitleY = dividerY + 20;
        this.add.text(panelX + 140, upgradeTitleY, '⬆️ 局内升级', {
            fontSize: '14px', fontFamily: GameConfig.typography.fontFamily, color: '#d4a574'
        }).setOrigin(0.5);

        const upgrades = [
            { id: 'luck', name: '勘探运气', icon: 'icon_luck' },
            { id: 'brushSize', name: '挖掘范围', icon: 'icon_brush' },
            { id: 'excavationSpeed', name: '挖掘速度', icon: 'icon_speed' },
            { id: 'artifactValue', name: '文物倍率', icon: 'icon_multiplier' },
            { id: 'appraisalAccuracy', name: '鉴定精度', icon: 'icon_accuracy' }
        ];

        this.upgradeButtons = [];
        upgrades.forEach((upgrade, index) => {
            const y = upgradeTitleY + 25 + index * 36;
            const btn = this.createUpgradeButton(panelX + 15, y, upgrade);
            this.upgradeButtons.push({ btn, upgrade });
        });
    }

    createUpgradeButton(x, y, upgrade) {
        const container = this.add.container(x, y);
        const level = this.state.upgrades[upgrade.id];
        const cost = this.state.getUpgradeCost(upgrade.id);
        const maxLevel = this.state.getMaxUpgradeLevel(upgrade.id);
        const canAfford = this.economy.canAfford(cost);

        const effectDescs = {
            luck: '+3% 真品率',
            brushSize: '+4% 铲宽',
            excavationSpeed: '+6% 力道',
            artifactValue: '+12% 价值',
            appraisalAccuracy: '+5% 精度'
        };

        const rowH = 28;
        const mainColor = canAfford ? '#f5e6d3' : '#888888';
        const subColor = canAfford ? '#a08060' : '#666666';

        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(canAfford ? 0x3d2817 : 0x2a1a0f, 1);
        bg.fillRoundedRect(0, -rowH / 2, 260, rowH, 6);

        // 单行排列：图标(12) 名称(26) 效果(86) Lv(173中心) ¥(230中心)
        container.add(this.add.image(12, 0, upgrade.icon).setScale(0.5));
        container.add(this.add.text(26, 0, upgrade.name, {
            fontSize: '13px', fontFamily: GameConfig.typography.fontFamily, color: mainColor
        }).setOrigin(0, 0.5));
        container.add(this.add.text(86, 0, effectDescs[upgrade.id] || '', {
            fontSize: '11px', fontFamily: GameConfig.typography.fontFamily, color: subColor
        }).setOrigin(0, 0.5));
        container.add(this.add.text(173, 0, `Lv.${level}/${maxLevel}`, {
            fontSize: '11px', fontFamily: GameConfig.typography.fontFamily, color: '#8b7355'
        }).setOrigin(0.5, 0.5));
        container.add(this.add.text(230, 0, `¥${cost}`, {
            fontSize: '13px', fontFamily: GameConfig.typography.fontFamily, fontStyle: 'bold',
            color: canAfford ? '#f4d03f' : '#666666'
        }).setOrigin(0.5, 0.5));

        container.setSize(260, rowH);
        container.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.purchaseUpgrade(upgrade.id))
            .on('pointerover', () => {
                bg.clear();
                bg.fillStyle(canAfford ? 0x5a4030 : 0x342010, 1);
                bg.fillRoundedRect(0, -rowH / 2, 260, rowH, 6);
                if (canAfford) this.showUpgradeTooltip(upgrade, level, cost);
            })
            .on('pointerout', () => {
                bg.clear();
                bg.fillStyle(canAfford ? 0x3d2817 : 0x2a1a0f, 1);
                bg.fillRoundedRect(0, -rowH / 2, 260, rowH, 6);
                this.hideUpgradeTooltip();
            });

        return container;
    }

    createRightPanel() {
        const panelX = this.config.width - 300;
        const panelY = 180;

        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x2c1810, 0.95);
        panelBg.fillRoundedRect(panelX, panelY, 280, 500, 12);
        panelBg.lineStyle(2, 0xd4a574, 0.3);
        panelBg.strokeRoundedRect(panelX, panelY, 280, 500, 12);

        this.add.text(panelX + 140, panelY + 20, '🏛️ 博物馆', {
            fontSize: '16px', fontFamily: GameConfig.typography.fontFamily, color: '#d4a574', fontStyle: 'bold'
        }).setOrigin(0.5);

        const museumBtn = this.add.text(panelX + 140, panelY + 60, '📜 查看图鉴', {
            fontSize: '16px', fontFamily: GameConfig.typography.fontFamily, color: '#f5e6d3',
            backgroundColor: '#3d2817', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        museumBtn.on('pointerdown', () => {
            if (this.audio) this.audio.click();
            this.cameras.main.fadeOut(300, 26, 15, 10);
            this.time.delayedCall(300, () => this.scene.start('MuseumScene'));
        });
        this.addButtonEffects(museumBtn);
        // 博物馆出土数显示

        this.add.text(panelX + 20, panelY + 110, '本局收获:', {
            fontSize: '14px', fontFamily: GameConfig.typography.fontFamily, color: '#8b7355'
        });
        this.gainText = this.add.text(panelX + 140, panelY + 110, '+¥0', {
            fontSize: '18px', fontFamily: GameConfig.typography.fontFamily, color: '#27ae60', fontStyle: 'bold'
        }).setOrigin(0.5);

        // ── 文物修复工坊（Lv.4 解锁）──
        if (this.state.prestigeLevel >= 4) {
            this.createRepairWorkshopBtn();
        }

        // 分隔线
        const div2 = this.add.graphics();
        div2.lineStyle(1, 0xd4a574, 0.2);
        div2.lineBetween(panelX + 20, panelY + 175, panelX + 260, panelY + 175);

        // ── 零活打工区 ──
        this.add.text(panelX + 140, panelY + 195, '🔨 考古零活', {
            fontSize: '14px', fontFamily: GameConfig.typography.fontFamily, color: '#d4a574'
        }).setOrigin(0.5);

        // 清理探方
        this.laborCleanBtn = this.add.text(panelX + 140, panelY + 230, '🧹 清理探方', {
            fontSize: '14px', fontFamily: GameConfig.typography.fontFamily, color: '#8b7355',
            backgroundColor: '#3d2817', padding: { x: 14, y: 8 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.laborCleanBtn.on('pointerdown', () => { if (this.audio) this.audio.click(); this.doCleanJob(); });
        this.addButtonEffects(this.laborCleanBtn);

        this.laborCleanLabel = this.add.text(panelX + 140, panelY + 258, '¥300~500  |  就绪', {
            fontSize: '11px', fontFamily: GameConfig.typography.fontFamily, color: '#5a7a5a'
        }).setOrigin(0.5);

        // 修复陶片
        this.laborPotteryBtn = this.add.text(panelX + 140, panelY + 290, '🏺 修复陶片', {
            fontSize: '14px', fontFamily: GameConfig.typography.fontFamily, color: '#8b7355',
            backgroundColor: '#3d2817', padding: { x: 14, y: 8 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.laborPotteryBtn.on('pointerdown', () => { this.audio.click(); this.doPotteryJob(); });
        this.addButtonEffects(this.laborPotteryBtn);

        this.laborPotteryLabel = this.add.text(panelX + 140, panelY + 318, '¥800~1200  |  需要声望 Lv.1', {
            fontSize: '11px', fontFamily: GameConfig.typography.fontFamily, color: '#8b7355'
        }).setOrigin(0.5);

        // 转生区域
        this.add.text(panelX + 140, panelY + 360, '🔮 学术休假', {
            fontSize: '14px', fontFamily: GameConfig.typography.fontFamily, color: '#d4a574'
        }).setOrigin(0.5);

        this.jpGainText = this.add.text(panelX + 140, panelY + 390,
            `可获得: ${this.state.jackpotPointsThisRun} JP`, {
                fontSize: '12px', fontFamily: GameConfig.typography.fontFamily, color: '#9b59b6'
            }).setOrigin(0.5);

        const prestigeBtn = this.add.text(panelX + 140, panelY + 425, '开始转生', {
            fontSize: '16px', fontFamily: GameConfig.typography.fontFamily, color: '#f5e6d3',
            backgroundColor: '#5a3d7a', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        prestigeBtn.on('pointerdown', () => { if (this.audio) this.audio.click(); this.doPrestige(); });
        this.addButtonEffects(prestigeBtn, 1.06);
        prestigeBtn.on('pointerover', () => {
            if (this.state.jackpotPointsThisRun >= 5) this.showPrestigeTooltip();
        });
        prestigeBtn.on('pointerout', () => this.hidePrestigeTooltip());
        this.prestigeBtn = prestigeBtn;

        const skillBtn = this.add.text(panelX + 140, panelY + 470, '⭐ 声望技能树', {
            fontSize: '14px', fontFamily: GameConfig.typography.fontFamily, color: '#8b7355'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                if (this.audio) this.audio.click();
                this.cameras.main.fadeOut(300, 26, 15, 10);
                this.time.delayedCall(300, () => this.scene.start('PrestigeScene'));
            });
        this.addButtonEffects(skillBtn);
    }

    createBottomBar() {
        const barY = this.config.height - 50;
        const barBg = this.add.graphics();
        barBg.fillStyle(0x2c1810, 1);
        barBg.fillRect(0, barY, this.config.width, 50);
        barBg.lineStyle(2, 0xd4a574, 0.3);
        barBg.lineBetween(0, barY, this.config.width, barY);

        this.bottomText = this.add.text(this.config.width / 2, barY + 25,
            '💡 选择一个发掘层位开始考古之旅', {
                fontSize: '14px', fontFamily: GameConfig.typography.fontFamily, color: '#8b7355'
            }).setOrigin(0.5);
    }

    // ══════════════════════════════════════════
    //  零活打工 — 实操迷你游戏
    // ══════════════════════════════════════════

    doCleanJob() {
        if (this.isDigging || this.isLaboring) {
            this.showMessage('正在忙碌中，无法接零活', 'error');
            return;
        }
        if (this.laborCleanCooldown > 0) {
            this.showMessage(`清理探方冷却中... (${Math.ceil(this.laborCleanCooldown)}秒)`, 'error');
            return;
        }
        this.startCleanMinigame();
    }

    doPotteryJob() {
        if (this.isDigging || this.isLaboring) {
            this.showMessage('正在忙碌中，无法接零活', 'error');
            return;
        }
        if (this.laborPotteryCooldown > 0) {
            this.showMessage(`修复陶片冷却中... (${Math.ceil(this.laborPotteryCooldown)}秒)`, 'error');
            return;
        }
        if (this.state.prestigeLevel < 1) {
            this.showMessage('修复陶片需要声望 Lv.1 以上', 'error');
            return;
        }
        this.startPotteryMinigame();
    }

    // ── 清理探方迷你游戏 ──

    startCleanMinigame() {
        this.isLaboring = true;
        this.laborType = 'clean';

        this.hideSiteUI();

        const ex = this.config.excavation;
        // 3 层脏土
        this.cleanLayers = [
            { name: '浮土', volume: 80, color: 0xC4B090, darkColor: 0xA09070 },
            { name: '砂土', volume: 80, color: 0xB8A878, darkColor: 0x988868 },
            { name: '硬土', volume: 80, color: 0xA89870, darkColor: 0x887860 }
        ];
        this.totalCleanVol = 240;
        this.cleanRemoved = 0;
        this.cleanLayers.forEach(l => { l.remaining = l.volume; });
        this.cleanCurLayer = 0;

        this.cleanStrataGfx = [];
        for (let i = 0; i < 3; i++) {
            const g = this.add.graphics().setDepth(5 + 3 - i);
            this.cleanStrataGfx.push(g);
        }
        this.cleanScrapeGfx = this.add.graphics().setDepth(10);
        this.drawCleanStrata();

        this.cleanHintText = this.add.text(ex.x + ex.width / 2, ex.y + ex.height / 2,
            '🧹 拖动鼠标擦除泥土', {
                fontSize: '16px', fontFamily: GameConfig.typography.fontFamily,
                color: '#d4a574', fontStyle: 'bold'
            }).setOrigin(0.5).setAlpha(0.7).setDepth(30);

        this.setupLaborInput();
        this.showMessage('🧹 开始清理探方！拖动鼠标擦除泥土');

        this.cameras.main.flash(150, 30, 25, 10);
    }

    drawCleanStrata() {
        const ex = this.config.excavation;
        let yOff = ex.y;
        const lh = ex.height / 3;

        this.cleanLayers.forEach((layer, i) => {
            const g = this.cleanStrataGfx[i];
            if (!g) return;
            g.clear();

            const remH = (layer.remaining / layer.volume) * lh;
            const y = yOff + (lh - remH);

            if (remH > 0) {
                const t = layer.remaining / layer.volume;
                g.fillStyle(layer.color, 0.6 + t * 0.4);
                g.fillRect(ex.x, y, ex.width, remH);

                // 纹理斑点
                const dotCount = Math.floor(ex.width * remH / 60);
                for (let j = 0; j < dotCount; j++) {
                    const dx = ex.x + Math.random() * ex.width;
                    const dy = y + Math.random() * remH;
                    g.fillStyle(layer.darkColor, Math.random() * 0.3 + 0.1);
                    g.fillCircle(dx, dy, Math.random() * 3.5 + 1.5);
                }
            }
            yOff += lh;
        });
    }

    setupLaborInput() {
        this.input.off('pointerdown');
        this.input.off('pointermove');
        this.input.off('pointerup');

        this._laborPointer = false;

        this.input.on('pointerdown', (ptr) => {
            if (!this.isLaboring) return;
            this._laborPointer = true;
            this.laborAction(ptr.x, ptr.y);
        });

        this.input.on('pointermove', (ptr) => {
            if (!this.isLaboring || !this._laborPointer) return;
            this.laborAction(ptr.x, ptr.y);
        });

        this.input.on('pointerup', () => { this._laborPointer = false; });
    }

    laborAction(px, py) {
        if (this.laborType === 'clean') {
            this.cleanScrub(px, py);
        } else if (this.laborType === 'pottery') {
            // 陶片用点击，不进这个分支
        }
    }

    cleanScrub(px, py) {
        const ex = this.config.excavation;
        if (px < ex.x || px > ex.x + ex.width || py < ex.y || py > ex.y + ex.height) return;

        const layer = this.cleanLayers[this.cleanCurLayer];
        if (!layer || layer.remaining <= 0) return;

        const power = 2.5;
        const r = Math.min(power, layer.remaining);
        layer.remaining -= r;
        this.cleanRemoved += r;

        // 擦除笔迹
        const g = this.cleanScrapeGfx;
        g.fillStyle(0x1a0f0a, 0.35);
        g.fillCircle(px, py, 16);
        g.fillStyle(0x2c1810, 0.2);
        g.fillCircle(px, py, 10);

        if (layer.remaining <= 0) {
            this.cleanCurLayer++;
            if (this.cleanCurLayer >= 3) {
                this.finishCleanJob();
                return;
            }
            this.showMessage(`🧹 ${layer.name} 已清理干净！`);
        }

        this.drawCleanStrata();
        if (this.cleanHintText && this.cleanCurLayer < 3) {
            this.cleanHintText.setText(`🧹 ${this.cleanLayers[this.cleanCurLayer].name}还有残留...`);
        }
    }

    finishCleanJob() {
        const earn = Phaser.Math.Between(300, 500);
        this.economy.addFunds(earn);
        if (this.audio) this.audio.jobComplete();

        if (this.cleanHintText) this.cleanHintText.setText(`✅ 完成！+¥${earn}`);

        this.laborCleanCooldown = 8;
        this.laborCleanLabel.setColor('#666666');
        this.laborCleanLabel.setText(`¥300~500  |  ${this.laborCleanCooldown}s`);
        this.laborCleanBtn.setStyle({ color: '#666666' });

        this.showToast(`🧹 探方清理完成！+¥${earn}`);

        this.time.delayedCall(800, () => this.cleanupMinigame());
        this.startLaborTimer('clean');
        this.updateUI();
        this.state.save();
    }

    // ── 修复陶片迷你游戏 ──

    startPotteryMinigame() {
        this.isLaboring = true;
        this.laborType = 'pottery';

        this.hideSiteUI();

        const ex = this.config.excavation;
        this.potteryTotalCracks = 6;
        this.potteryFixed = 0;
        this.potteryCrackData = [];
        this.potteryIndicators = [];
        this.potteryParticles = [];

        // 陶器轮廓
        const cx = ex.x + ex.width / 2;
        const cy = ex.y + ex.height / 2 - 10;

        this.potteryBase = this.add.graphics().setDepth(5);
        this.potteryBase.fillStyle(0x8B6914, 0.25);
        this.potteryBase.fillRoundedRect(cx - 110, cy - 85, 220, 210, 25);
        this.potteryBase.fillStyle(0x9B7928, 0.2);
        this.potteryBase.fillRoundedRect(cx - 90, cy - 65, 180, 170, 18);
        this.potteryBase.lineStyle(3, 0x6B4F2A, 0.5);
        this.potteryBase.strokeRoundedRect(cx - 110, cy - 85, 220, 210, 25);
        // 颈部
        this.potteryBase.fillStyle(0x8B6914, 0.3);
        this.potteryBase.fillRoundedRect(cx - 35, cy - 105, 70, 30, 8);
        this.potteryBase.lineStyle(2, 0x6B4F2A, 0.5);
        this.potteryBase.strokeRoundedRect(cx - 35, cy - 105, 70, 30, 8);

        // 提示文字
        this.potteryBaseText = this.add.text(cx, cy + 120, '🏺 点击裂缝进行修复', {
            fontSize: '15px', fontFamily: GameConfig.typography.fontFamily, color: '#d4a574'
        }).setOrigin(0.5).setDepth(30);

        this.potteryPctText = this.add.text(cx, cy - 120, '已修复: 0/6', {
            fontSize: '20px', fontFamily: GameConfig.typography.fontFamily, color: '#8b7355', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(30);

        // 生成裂缝
        this.potteryCrackGfx = [];
        const baseAngles = [30, 90, 150, 210, 270, 330];
        baseAngles.forEach((a, i) => {
            const angle = (a + (Math.random() - 0.5) * 40) * Math.PI / 180;
            const dist = 55 + Math.random() * 55;
            const crackX = cx + Math.cos(angle) * dist;
            const crackY = cy + Math.sin(angle) * dist;
            // 确保裂缝在陶器内
            const inVase = Math.sqrt(Math.pow(crackX - cx, 2) / Math.pow(100, 2) + Math.pow(crackY - cy, 2) / Math.pow(95, 2)) < 1;
            const fx = inVase ? crackX : cx + Math.cos(angle) * 35;
            const fy = inVase ? crackY : cy + Math.sin(angle) * 35;

            const crack = { x: fx, y: fy, repaired: false, id: i };
            this.potteryCrackData.push(crack);

            // 裂缝线
            const g = this.add.graphics().setDepth(10);
            g.lineStyle(3, 0x4A3020, 0.8);
            const len = 25 + Math.random() * 20;
            const perp = angle + Math.PI / 2;
            const jitter = (Math.random() - 0.5) * 20;
            g.beginPath();
            g.moveTo(fx + Math.cos(perp) * jitter * 0.5, fy + Math.sin(perp) * jitter * 0.5);
            g.lineTo(fx + Math.cos(angle) * len * 0.5, fy + Math.sin(angle) * len * 0.5);
            g.lineTo(fx + Math.cos(angle) * len, fy + Math.sin(angle) * len);
            g.strokePath();
            this.potteryCrackGfx.push(g);

            // 裂缝点击标记
            const mk = this.add.text(fx, fy, '🔴', {
                fontSize: '20px'
            }).setOrigin(0.5).setDepth(15).setInteractive({ useHandCursor: true });

            mk.on('pointerdown', () => this.fixCrack(crack, g, mk));
            mk.on('pointerover', () => mk.setScale(1.3));
            mk.on('pointerout', () => mk.setScale(1.0));

            this.potteryIndicators.push(mk);
        });

        this.setupLaborInput();
        this.showMessage('🏺 修复陶片！点击 🔴 裂缝进行粘合');

        this.cameras.main.flash(150, 40, 30, 10);
    }

    fixCrack(crack, gfx, marker) {
        if (crack.repaired) return;
        crack.repaired = true;
        this.potteryFixed++;
        if (this.audio) this.audio.click();

        // 视觉效果
        gfx.clear();
        gfx.fillStyle(0x27ae60, 0.6);
        gfx.fillCircle(crack.x, crack.y, 14);
        gfx.fillStyle(0x2ecc71, 0.4);
        gfx.fillCircle(crack.x, crack.y, 20);

        marker.setText('✅').setStyle({ fontSize: '18px' });
        marker.removeInteractive();

        // 粒子
        for (let i = 0; i < 6; i++) {
            const p = this.add.text(
                crack.x + (Math.random() - 0.5) * 30,
                crack.y + (Math.random() - 0.5) * 20,
                '✦', { fontSize: '12px', color: '#27ae60' }
            ).setOrigin(0.5).setDepth(20);
            this.potteryParticles.push(p);
            this.tweens.add({
                targets: p, alpha: 0, y: p.y - 30,
                duration: 600, ease: 'Power2',
                onComplete: () => { p.destroy(); }
            });
        }

        if (this.potteryPctText) this.potteryPctText.setText(`已修复: ${this.potteryFixed}/6`);

        if (this.potteryFixed >= this.potteryTotalCracks) {
            this.time.delayedCall(500, () => this.finishPotteryJob());
        }
    }

    finishPotteryJob() {
        const earn = Phaser.Math.Between(800, 1200);
        this.economy.addFunds(earn);
        if (this.audio) this.audio.jobComplete();

        if (this.potteryBaseText) this.potteryBaseText.setText(`✅ 修复完成！+¥${earn}`);
        if (this.potteryPctText) this.potteryPctText.setText('已修复: 6/6 ✅');

        this.laborPotteryCooldown = 8;
        this.laborPotteryLabel.setColor('#666666');
        this.laborPotteryLabel.setText(`¥800~1200  |  ${this.laborPotteryCooldown}s`);
        this.laborPotteryBtn.setStyle({ color: '#666666' });

        this.showToast(`🏺 陶片修复完成！+¥${earn}`);
        this.cameras.main.flash(300, 46, 204, 113);

        this.time.delayedCall(1000, () => this.cleanupMinigame());
        this.startLaborTimer('pottery');
        this.updateUI();
        this.state.save();
    }

    // ── 零活共用的辅助方法 ──

    hideSiteUI() {
        this.soilPreview.clear();
        if (this.promptText) this.promptText.setAlpha(0);
        this.siteButtons.forEach(({ btn }) => btn.setVisible(false));
        if (this.depthLabels) this.depthLabels.forEach(l => { if (l && l.setVisible) l.setVisible(false); });
    }

    cleanupMinigame() {
        this.isLaboring = false;
        this.laborType = null;

        this.input.off('pointerdown');
        this.input.off('pointermove');
        this.input.off('pointerup');

        // 清理探方相关
        if (this.cleanStrataGfx) { this.cleanStrataGfx.forEach(g => g.destroy()); this.cleanStrataGfx = null; }
        if (this.cleanScrapeGfx) { this.cleanScrapeGfx.destroy(); this.cleanScrapeGfx = null; }
        if (this.cleanHintText) { this.cleanHintText.destroy(); this.cleanHintText = null; }

        // 修复陶片相关
        if (this.potteryBase) { this.potteryBase.destroy(); this.potteryBase = null; }
        if (this.potteryCrackGfx) { this.potteryCrackGfx.forEach(g => g.destroy()); this.potteryCrackGfx = null; }
        if (this.potteryIndicators) { this.potteryIndicators.forEach(m => m.destroy()); this.potteryIndicators = null; }
        if (this.potteryParticles) { this.potteryParticles.forEach(p => { if (p && p.destroy) p.destroy(); }); this.potteryParticles = null; }
        if (this.potteryBaseText) { this.potteryBaseText.destroy(); this.potteryBaseText = null; }
        if (this.potteryPctText) { this.potteryPctText.destroy(); this.potteryPctText = null; }

        // 恢复界面
        this.drawSoilPreview();
        if (this.promptText) this.promptText.setAlpha(1);
        this.siteButtons.forEach(({ btn }) => btn.setVisible(true));
        if (this.depthLabels) this.depthLabels.forEach(l => { if (l && l.setVisible) l.setVisible(true); });
    }

    startLaborTimer(type) {
        const updateFn = () => {
            if (type === 'clean') {
                this.laborCleanCooldown--;
                if (this.laborCleanCooldown <= 0) {
                    this.laborCleanCooldown = 0;
                    this.laborCleanLabel.setText('¥300~500  |  就绪');
                    this.laborCleanLabel.setColor('#5a7a5a');
                    this.laborCleanBtn.setStyle({ color: '#8b7355' });
                    return;
                }
                this.laborCleanLabel.setText(`¥300~500  |  ${this.laborCleanCooldown}s`);
                this.time.delayedCall(1000, updateFn);
            } else {
                this.laborPotteryCooldown--;
                if (this.laborPotteryCooldown <= 0) {
                    this.laborPotteryCooldown = 0;
                    const reqText = this.state.prestigeLevel < 1 ? '需要声望 Lv.1' : '就绪';
                    this.laborPotteryLabel.setText(`¥800~1200  |  ${reqText}`);
                    this.laborPotteryLabel.setColor(this.state.prestigeLevel < 1 ? '#8b7355' : '#5a7a5a');
                    this.laborPotteryBtn.setStyle({ color: '#8b7355' });
                    return;
                }
                this.laborPotteryLabel.setText(`¥800~1200  |  ${this.laborPotteryCooldown}s`);
                this.time.delayedCall(1000, updateFn);
            }
        };
        this.time.delayedCall(1000, updateFn);
    }

    // ══════════════════════════════════════════
    //  时代与层位
    // ══════════════════════════════════════════

    selectEra(eraId) {
        if (this.isDigging || this.isLaboring) {
            this.showMessage('正在忙碌中，请完成后再切换时代', 'error');
            return;
        }
        this.state.currentEra = eraId;
        if (this.audio) this.audio.click();
        this.updateEraButtons();
        this.refreshSiteButtons();
        this.drawSoilPreview();
        this.showMessage(`已切换至${EraData[eraId].name}，发掘层位已更新`);
    }

    drawSoilPreview() {
        const ex = this.config.excavation;
        const g = this.soilPreview;
        g.clear();

        const colors = [
            0x9B7B4A, 0xB8933A, 0x8B6E3E, 0x6B4F3A, 0x3D2817
        ];

        const layerH = ex.height / 5;
        for (let i = 0; i < 5; i++) {
            g.fillStyle(colors[i], 1);
            g.fillRect(ex.x, ex.y + i * layerH, ex.width, layerH + 1);

            for (let j = 0; j < ex.width / 10; j++) {
                const px = ex.x + j * 10 + Math.random() * 6;
                const py = ex.y + i * layerH + Math.random() * layerH;
                g.fillStyle(colors[i], Math.random() * 0.15);
                g.fillCircle(px, py, Math.random() * 2 + 1);
            }
        }

        g.lineStyle(1, 0x5A3A2A, 0.15);
        for (let i = 1; i < 5; i++) {
            g.lineBetween(ex.x, ex.y + i * layerH, ex.x + ex.width, ex.y + i * layerH);
        }
        for (let i = 1; i < 5; i++) {
            g.lineBetween(ex.x + i * ex.width / 5, ex.y, ex.x + i * ex.width / 5, ex.y + ex.height);
        }

        g.fillStyle(0x2c1810, 0.8);
        g.fillRect(ex.x + ex.width + 5, ex.y, 3, ex.height);
        for (let i = 0; i <= 5; i++) {
            const y = ex.y + i * layerH;
            g.fillRect(ex.x + ex.width + 2, y - 0.5, 9, 1);
            if (i < 5) {
                const label = this.add.text(ex.x + ex.width + 20, y + layerH/2, `${(i+1)*30}cm`, {
                    fontSize: '10px', fontFamily: GameConfig.typography.fontFamily, color: '#8b7355'
                }).setOrigin(0, 0.5).setDepth(5);
                if (!this.depthLabels) this.depthLabels = [];
                this.depthLabels.push(label);
            }
        }
    }

    refreshSiteButtons() {
        if (this.siteButtons) {
            this.siteButtons.forEach(({ btn }) => { if (btn && btn.destroy) btn.destroy(); });
        }
        if (this.depthLabels) {
            this.depthLabels.forEach(l => { if (l && l.destroy) l.destroy(); });
            this.depthLabels = [];
        }

        const ex = this.config.excavation;
        // 重绘分隔线
        if (this.siteSeparator) {
            this.siteSeparator.clear();
            this.siteSeparator.lineStyle(1, 0xd4a574, 0.25);
            this.siteSeparator.lineBetween(ex.x, ex.y + ex.height + 48, ex.x + ex.width, ex.y + ex.height + 48);
        }
        const siteY = ex.y + ex.height + 76;
        this.createSiteButtons(siteY);
    }

    updateEraButtons() {
        const unlockedEras = this.prestigeManager.getUnlockedEras();
        this.eraButtons.forEach(({ btn, era }) => {
            // debug模式全解锁
            const isUnlocked = GameConfig.debug || unlockedEras.includes(era.id);
            const isSelected = this.state.currentEra === era.id;
            btn.setStyle({
                color: isSelected ? '#d4a574' : (isUnlocked ? '#8b7355' : '#555555'),
                backgroundColor: isSelected ? '0x3d2817' : '0x2c1810'
            });
            btn.off('pointerdown');
            btn.off('pointerover');
            btn.off('pointerout');
            if (isUnlocked) {
                btn.setInteractive({ useHandCursor: true })
                    .on('pointerdown', () => this.selectEra(era.id));
            } else {
                btn.disableInteractive();
            }
        });
    }

    // ══════════════════════════════════════════
    //  发掘（内嵌在主界面）
    // ══════════════════════════════════════════

    startExcavation(site) {
        const cost = new BigNumber(site.cost);

        if (this.isLaboring) {
            this.showMessage('正在做零活，请完成后再发掘', 'error');
            return;
        }

        if (!this.economy.canAfford(cost)) {
            const hint = `没钱了？右侧 [🧹清理探方] 每次 ¥300~500`;
            this.showMessage('经费不足！' + hint, 'error');
            return;
        }

        // 扣除经费
        this.economy.spendFunds(cost);
        this.state.totalExcavations++;
        this.state.currentSite = site;
        if (this.audio) this.audio.purchase();
        this.updateUI();

        // 生成文物
        this.currentArtifact = ArtifactData.getRandomArtifactForSite(
            this.state.currentEra, site.risk
        );

        // 预加载文物图标（避免刮土时加载延迟导致图标不显示）
        this._preloadArtifactIcon(this.currentArtifact);

        // 初始化挖掘状态
        this.isDigging = true;
        this.isRevealed = false;
        this.isCompleted = false;

        // 构建地层数据
        this.soilLayers = [
            { name: '表土层', soilVolume: 6, color: 0x9B7B4A, lightColor: 0xC4A46A,
              texture: 'humus', desc: '腐殖土，松软易铲' },
            { name: '文化层', soilVolume: 10, color: 0xB8933A, lightColor: 0xD4B06A,
              texture: 'loess', desc: '黄土层，偶见碎陶片' },
            { name: '堆积层', soilVolume: 14, color: 0x8B6E3E, lightColor: 0xA88858,
              texture: 'gravel', desc: '砂砾层，质地较硬' },
            { name: '文物层', soilVolume: 8, color: 0x6B4F3A, lightColor: 0x8B6F5A,
              texture: 'artifact', desc: '深土层，文物在此！' },
            { name: '生土层', soilVolume: 0, color: 0x5A3A2A, lightColor: 0x5A3A2A,
              texture: 'sterile', desc: '原生土 — 已达基底' }
        ];

        this.totalSoilVolume = this.soilLayers.reduce((s, l) => s + l.soilVolume, 0);
        this.currentLayer = 0;
        this.removedSoilVolume = 0;
        this.soilLayers.forEach(l => { l.remaining = l.soilVolume; });

        // 隐藏静态预览和层位按钮
        this.soilPreview.clear();
        if (this.promptText) this.promptText.setAlpha(0);
        this.siteButtons.forEach(({ btn }) => btn.setVisible(false));

        // 隐藏深度标注
        if (this.depthLabels) {
            this.depthLabels.forEach(l => { if (l && l.setVisible) l.setVisible(false); });
        }

        const eraData = EraData[this.state.currentEra];

        // ── 科技考古：一键出土 ──
        if (this.techArchaeologyEnabled) {
            this.soilLayers.forEach(l => { l.remaining = 0; });
            this.removedSoilVolume = this.totalSoilVolume;
            this.currentLayer = this.soilLayers.length - 1;

            this.createDigLayers();
            this.drawStrata();

            // 科技扫描动画
            this.showMessage(`🤖 科技考古扫描中：${eraData.name} · ${site.name}`);
            const scanText = this.add.text(
                this.config.excavation.x + this.config.excavation.width / 2,
                this.config.excavation.y + this.config.excavation.height / 2,
                '🔬 扫描中...', {
                    fontSize: '24px', fontFamily: GameConfig.typography.fontFamily,
                    color: '#00ffcc', fontStyle: 'bold'
                }
            ).setOrigin(0.5).setDepth(30);

            // 扫描线效果
            const scanLine = this.add.graphics().setDepth(25);
            let scanY = this.config.excavation.y;
            this.tweens.add({
                targets: { y: scanY },
                y: this.config.excavation.y + this.config.excavation.height,
                duration: 800, ease: 'Sine.easeInOut',
                onUpdate: (tween) => {
                    scanLine.clear();
                    scanLine.lineStyle(2, 0x00ffcc, 0.8);
                    scanLine.lineBetween(this.config.excavation.x, tween.targets[0].y,
                        this.config.excavation.x + this.config.excavation.width, tween.targets[0].y);
                },
                onComplete: () => {
                    scanLine.destroy();
                    scanText.destroy();
                    this.cameras.main.flash(200, 0, 255, 100);
                    this.revealArtifact();
                }
            });
            return;
        }

        // 创建挖掘层
        this.createDigLayers();
        this.setupDigInput();

        // 进度条
        this.createProgressUI();

        this.showMessage(`开始发掘 ${eraData.name} · ${site.name}`);

        // 入场闪光
        this.cameras.main.flash(200, 28, 20, 8, true);
    }

    createDigLayers() {
        const ex = this.config.excavation;

        // 清除旧的
        this.strataGraphics.forEach(g => g.destroy());
        this.strataGraphics = [];

        for (let i = 0; i < this.soilLayers.length; i++) {
            const g = this.add.graphics().setDepth(5 + this.soilLayers.length - i);
            this.strataGraphics.push(g);
        }

        // 刮痕层
        if (this.scrapeLayer) this.scrapeLayer.destroy();
        this.scrapeLayer = this.add.graphics().setDepth(10);

        // 文物轮廓
        if (this.artifactOutline) this.artifactOutline.destroy();
        this.artifactOutline = this.add.graphics().setDepth(11);

        // 文物名标签
        if (this.artifactLabel) this.artifactLabel.destroy();
        if (this.currentArtifact) {
            this.artifactLabel = this.add.text(ex.x + ex.width/2, ex.y + ex.height + 35,
                '? ? ?', {
                    fontSize: '18px', fontFamily: GameConfig.typography.fontFamily,
                    color: '#d4a574', fontStyle: 'bold'
                }
            ).setOrigin(0.5).setAlpha(0).setDepth(15);
        }

        this.drawStrata();
    }

    drawStrata() {
        const ex = this.config.excavation;
        let yOffset = ex.y;

        this.soilLayers.forEach((layer, index) => {
            const g = this.strataGraphics[index];
            if (!g) return;
            g.clear();

            const layerHeight = (layer.soilVolume / this.totalSoilVolume) * ex.height;
            const remainingHeight = (layer.remaining / layer.soilVolume) * layerHeight;
            const y = yOffset + (layerHeight - remainingHeight);

            if (remainingHeight <= 0 && index < this.soilLayers.length - 1) {
                g.fillStyle(layer.lightColor, 0.3);
                g.fillRect(ex.x, yOffset, ex.width, layerHeight);
                g.lineStyle(1, layer.lightColor, 0.4);
                g.lineBetween(ex.x, yOffset, ex.x + ex.width, yOffset);
            } else if (remainingHeight > 0) {
                const lerpFactor = layer.remaining / layer.soilVolume;
                const color = this.lerpColor(layer.color, layer.lightColor, 1 - lerpFactor);
                g.fillStyle(color, 1);
                g.fillRect(ex.x, y, ex.width, remainingHeight);

                if (index < this.soilLayers.length - 1) {
                    this.drawSoilTexture(g, ex.x, y, ex.width, remainingHeight, layer);
                }

                if (y > yOffset) {
                    g.fillStyle(layer.lightColor, 0.25);
                    g.fillRect(ex.x, yOffset, ex.width, y - yOffset);
                }
            }

            yOffset += layerHeight;
        });
    }

    drawSoilTexture(g, x, y, w, h, layer) {
        const count = Math.floor(w * h / 80);
        for (let i = 0; i < count; i++) {
            const px = x + Math.random() * w;
            const py = y + Math.random() * h;
            let size;
            let dotColors;

            if (layer.texture === 'gravel') {
                size = Math.random() * 4 + 2;
                dotColors = [0x6B5B4F, 0x8B7355, 0x9B8B6F, 0x7B6B5B];
            } else if (layer.texture === 'artifact') {
                size = Math.random() * 2 + 1;
                dotColors = [0xA0522D, 0xCD853F, 0x8B6914, 0xDAA520];
            } else if (layer.texture === 'loess') {
                size = Math.random() * 3 + 1;
                dotColors = [0x8B6914, 0xA07828, 0x9B7B3C, 0x806010];
            } else {
                size = Math.random() * 3 + 1;
                dotColors = [0x8B6914, 0xA07828, 0x9B7B3C, 0x806010];
            }

            g.fillStyle(dotColors[Math.floor(Math.random() * dotColors.length)], Math.random() * 0.2 + 0.15);
            g.fillCircle(px, py, size);
        }
    }

    setupDigInput() {
        this.input.off('pointerdown');
        this.input.off('pointermove');
        this.input.off('pointerup');

        this._isDigPointerDown = false;

        this.input.on('pointerdown', (pointer) => {
            if (!this.isDigging || this.isCompleted) return;
            this._isDigPointerDown = true;
            this.dig(pointer.x, pointer.y);
        });

        this.input.on('pointermove', (pointer) => {
            if (!this.isDigging || this.isCompleted) return;
            if (this._isDigPointerDown) {
                this.dig(pointer.x, pointer.y);
            }
        });

        this.input.on('pointerup', () => {
            this._isDigPointerDown = false;
        });
    }

    dig(px, py) {
        const ex = this.config.excavation;

        if (px < ex.x || px > ex.x + ex.width ||
            py < ex.y || py > ex.y + ex.height) return;
        if (this.isRevealed) return;

        const layer = this.soilLayers[this.currentLayer];
        if (!layer || layer.remaining <= 0) return;

        if (this.audio) this.audio.dig();

        const baseDigPower = 1.5;
        const rangeBonus = this.state.getUpgradeEffect('brushSize');
        const speedBonus = this.state.getUpgradeEffect('excavationSpeed');
        const hardnessMod = 1.0 / (1.0 + this.currentLayer * 0.3);
        const digPower = baseDigPower * (1 + rangeBonus) * (1 + speedBonus) * hardnessMod;

        const removed = Math.min(digPower, layer.remaining);
        layer.remaining -= removed;
        this.removedSoilVolume += removed;

        this.drawScrapeMark(px, py);
        this.spawnDigParticles(px, py);

        // 文物层（第3层）偶尔冒出金色闪光，暗示文物接近
        if (this.currentLayer === 3 && Math.random() < 0.15) {
            this.spawnGlintSparkles(px, py, 2 + Math.floor(Math.random() * 4));
        }

        if (layer.remaining <= 0) {
            if (this.currentLayer === 1 || this.currentLayer === 3) {
                this.maybeSmallFind();
            }
            this.currentLayer++;
            // 地层挖穿闪光
            const nextLayer = this.soilLayers[this.currentLayer];
            if (nextLayer && this.currentLayer < this.soilLayers.length - 1) {
                this.showLayerTransition(nextLayer);
            }
            if (this.currentLayer >= this.soilLayers.length - 1) {
                if (!this.isRevealed) {
                    this.revealArtifact();
                }
                return;
            }
        }

        this.drawStrata();
        this.updateProgress();

        let artifactAlpha;
        if (this.currentLayer <= 0) {
            artifactAlpha = 0;
        } else if (this.currentLayer === 1) {
            artifactAlpha = 0.15;
        } else if (this.currentLayer === 2) {
            artifactAlpha = 0.35;
        } else {
            const layerProgress = 1 - (this.soilLayers[3].remaining / this.soilLayers[3].soilVolume);
            artifactAlpha = 0.35 + layerProgress * 0.55;
        }
        this.drawArtifactOutline(Math.min(1, artifactAlpha));


    }

    showLayerTransition(nextLayer) {
        const ex = this.config.excavation;
        this.cameras.main.flash(100, 40, 30, 5);
        if (this.audio) this.audio.layerBreak();
        // 显示进入新地层提示
        const label = this.add.text(ex.x + ex.width / 2, ex.y + ex.height / 2,
            `▼ ${nextLayer.name} ▼\n${nextLayer.desc}`, {
                fontSize: '18px', fontFamily: GameConfig.typography.fontFamily,
                color: '#f4d03f', fontStyle: 'bold',
                align: 'center', stroke: '#000000', strokeThickness: 3
            }).setOrigin(0.5).setDepth(40).setAlpha(0);

        this.tweens.add({
            targets: label, alpha: 1, y: label.y - 20,
            duration: 600, ease: 'Power2',
            yoyo: true, hold: 800,
            onComplete: () => label.destroy()
        });
    }

    // 文物层闪光粒子
    spawnGlintSparkles(x, y, count) {
        for (let i = 0; i < count; i++) {
            const g = this.add.graphics().setDepth(25);
            const goldColors = [0xF4D03F, 0xDAA520, 0xFFD700, 0xB8860B];
            const color = goldColors[Math.floor(Math.random() * goldColors.length)];
            g.fillStyle(color, 0.9);
            const size = 2 + Math.random() * 4;
            g.fillCircle(0, 0, size);
            g.setPosition(
                x + (Math.random() - 0.5) * 60,
                y + (Math.random() - 0.5) * 40
            );

            this.tweens.add({
                targets: g,
                y: g.y - 30 - Math.random() * 30,
                alpha: 0, scaleX: 0.1, scaleY: 0.1,
                duration: 400 + Math.random() * 400,
                ease: 'Power2',
                onComplete: () => g.destroy()
            });
        }
    }

    drawArtifactOutline(alpha) {
        const ex = this.config.excavation;
        const g = this.artifactOutline;
        if (!g) return;
        g.clear();

        if (!this.currentArtifact || alpha <= 0) return;

        const cx = ex.x + ex.width / 2;
        const cy = ex.y + ex.height * 0.85;
        const rarityData = ArtifactData.rarity[this.currentArtifact.rarity];
        const color = parseInt(rarityData.color.replace('#', '0x'));

        // 脉冲效果
        const pulse = 1 + Math.sin((this.time.now / 600)) * 0.07;
        const r1 = 80 * pulse;
        const r2 = 45 * pulse;

        g.fillStyle(color, alpha * 0.15);
        g.fillCircle(cx, cy, r1);
        g.fillStyle(color, alpha * 0.3);
        g.fillCircle(cx, cy, r2);

        if (alpha < 0.80) {
            if (this.artifactLabel) this.artifactLabel.setAlpha(0);
            // 清除文物图标
            if (this.artifactIcon) { this.artifactIcon.destroy(); this.artifactIcon = null; }
            const qAlpha = alpha < 0.15 ? 1 : 1 - (alpha - 0.15) / 0.65;
            if (this.questionMark) this.questionMark.destroy();
            this.questionMark = this.add.text(cx, cy, '?', {
                fontSize: '48px', fontFamily: 'serif',
                color: '#f5e6d3', fontStyle: 'bold'
            }).setOrigin(0.5).setAlpha(Math.max(0.1, qAlpha * 0.8)).setDepth(12);
        } else {
            if (this.questionMark) { this.questionMark.destroy(); this.questionMark = null; }
            if (this.artifactLabel) {
                this.artifactLabel.setText(this.currentArtifact.name);
                this.artifactLabel.setAlpha((alpha - 0.80) / 0.20);
            }
            // alpha >= 0.80: 揭示文物图标
            if (!this.artifactIcon) {
                const iconKey = this.getArtifactIconKey(this.currentArtifact);
                if (iconKey) {
                    this.artifactIcon = this.add.image(cx, cy - 15, iconKey)
                        .setDisplaySize(80, 80)
                        .setAlpha(0)
                        .setDepth(13);
                    this.tweens.add({
                        targets: this.artifactIcon,
                        alpha: 1,
                        duration: 300
                    });
                }
            }
        }
    }

    drawScrapeMark(x, y) {
        const ex = this.config.excavation;
        const rangeLevel = this.state.upgrades.brushSize;
        const markWidth = 30 + rangeLevel * 5;

        const g = this.scrapeLayer;
        if (!g) return;
        g.fillStyle(0x1a0f0a, 0.4);

        const sx = Math.max(ex.x, x - markWidth / 2);
        const sw = Math.min(markWidth, ex.width - (sx - ex.x));
        const sy = Math.max(ex.y, y - 3);

        g.fillRect(sx, sy, sw, 6);
        g.fillStyle(0x3d2817, 0.3);
        g.fillRect(sx - 2, sy - 1, 4, 8);
        g.fillRect(sx + sw - 2, sy - 1, 4, 8);

        this.time.delayedCall(1000, () => {
            if (this.scrapeLayer) this.scrapeLayer.clear();
        });
    }

    spawnDigParticles(x, y) {
        const count = Phaser.Math.Between(5, 10);
        const layer = this.soilLayers[Math.min(this.currentLayer, this.soilLayers.length - 1)];

        for (let i = 0; i < count; i++) {
            const angle = -Math.PI/2 + (Math.random() - 0.5) * Math.PI;
            const dist = 20 + Math.random() * 40;
            const size = Phaser.Math.Between(2, 5);
            const color = Phaser.Display.Color.IntegerToColor(layer.color);
            const rOffset = Phaser.Math.Between(-20, 20);
            const colorAdj = Phaser.Display.Color.GetColor(
                Math.min(255, color.red + rOffset),
                Math.min(255, color.green + rOffset),
                Math.min(255, color.blue + rOffset)
            );

            const particle = this.add.graphics().setDepth(25);
            particle.fillStyle(colorAdj, 0.8);
            particle.fillCircle(0, 0, size);
            particle.setPosition(x, y);

            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * dist * 0.6,
                y: y + Math.sin(angle) * dist,
                alpha: 0, scaleX: 0.3, scaleY: 0.3,
                duration: 250 + Math.random() * 250,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    maybeSmallFind() {
        const chance = this.currentLayer === 1 ? 0.5 : 0.75;
        if (Math.random() > chance) return;
        if (this.audio) this.audio.smallFind();

        const era = this.state.currentEra;
        let finds;
        if (era === 'neolithic') {
            finds = [
                { name: '彩陶碎片', value: 80, icon: '🏺' },
                { name: '骨针残段', value: 60, icon: '🦴' },
                { name: '炭化粟粒', value: 40, icon: '🌾' },
                { name: '细石器刮削器', value: 120, icon: '🪨' },
                { name: '玉料边角', value: 200, icon: '💎' },
                { name: '蚌壳饰品', value: 90, icon: '🐚' },
                { name: '陶纺轮碎片', value: 70, icon: '🧵' },
                { name: '红陶残片', value: 100, icon: '🎨' }
            ];
        } else if (era === 'shangzhou') {
            finds = [
                { name: '青铜残片', value: 200, icon: '🗡️' },
                { name: '甲骨刻辞残片', value: 300, icon: '📜' },
                { name: '玉戈碎片', value: 250, icon: '💎' },
                { name: '贝币', value: 150, icon: '🪙' },
                { name: '骨镞', value: 100, icon: '🏹' },
                { name: '陶鬲残片', value: 80, icon: '🏺' },
                { name: '绿松石碎片', value: 180, icon: '💠' },
                { name: '饕餮纹陶范', value: 220, icon: '🎭' }
            ];
        } else {
            finds = [
                { name: '半两钱', value: 200, icon: '🪙' },
                { name: '漆器残片', value: 250, icon: '🎨' },
                { name: '铜镜碎片', value: 300, icon: '🪞' },
                { name: '竹简残片', value: 350, icon: '📜' },
                { name: '玉璧碎块', value: 400, icon: '💎' },
                { name: '铁剑残段', value: 280, icon: '⚔️' },
                { name: '鎏金铜扣', value: 320, icon: '✨' },
                { name: '封泥残块', value: 260, icon: '🔖' }
            ];
        }

        const find = finds[Math.floor(Math.random() * finds.length)];
        this.economy.addFunds(find.value);

        const ex = this.config.excavation;
        const fx = ex.x + 50 + Math.random() * (ex.width - 100);
        const fy = ex.y + 50 + Math.random() * (ex.height - 100);

        const toast = this.add.text(fx, fy,
            `${find.icon} 发现${find.name}！+¥${find.value}`, {
                fontSize: '16px', fontFamily: GameConfig.typography.fontFamily,
                color: '#f4d03f', fontStyle: 'bold',
                shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 6, fill: true }
            }).setOrigin(0.5).setDepth(30);

        this.tweens.add({
            targets: toast, alpha: 0, y: toast.y - 60,
            duration: 2000, ease: 'Power2',
            onComplete: () => toast.destroy()
        });

        this.updateUI();
    }

    getProgress() {
        return Math.min(1, this.removedSoilVolume / this.totalSoilVolume);
    }

    createProgressUI() {
        const ex = this.config.excavation;
        // 进度条浮在发掘区域底部内侧
        const barY = ex.y + ex.height - 18;

        if (this.progressBg) this.progressBg.destroy();
        this.progressBg = this.add.graphics().setDepth(20);
        this.progressBg.fillStyle(0x1a0f0a, 0.85);
        this.progressBg.fillRoundedRect(ex.x + 5, barY, ex.width - 10, 8, 4);

        if (this.progressFill) this.progressFill.destroy();
        this.progressFill = this.add.graphics().setDepth(21);

    }

    updateProgress() {
        const ex = this.config.excavation;
        const barY = ex.y + ex.height - 18;
        const pct = this.getProgress();

        if (this.progressFill) {
            this.progressFill.clear();
            const barW = ex.width - 10;
            const fillWidth = barW * pct;
            const progressColor = Phaser.Display.Color.Interpolate.ColorWithColor(
                { r: 100, g: 80, b: 50 },
                { r: 212, g: 165, b: 116 },
                100, Math.floor(pct * 100)
            );
            const colorHex = Phaser.Display.Color.GetColor(progressColor.r, progressColor.g, progressColor.b);
            this.progressFill.fillStyle(colorHex, 1);
            this.progressFill.fillRoundedRect(ex.x + 5, barY, fillWidth, 8, 4);

            if (pct > 0 && pct < 1) {
                // 地层分界线标记在进度条上
                let yCheck = ex.y;
                const fullBarW = barW;
                this.soilLayers.forEach((layer, i) => {
                    if (i >= this.soilLayers.length - 1) return;
                    yCheck += (layer.soilVolume / this.totalSoilVolume) * ex.height;
                    const markX = ex.x + 5 + (yCheck - ex.y) / ex.height * fullBarW;
                    if (markX < ex.x + ex.width - 5 && pct > layer.soilVolume / this.totalSoilVolume * (i + 0.5)) {
                        this.progressFill.fillStyle(0x1a0f0a, 0.6);
                        this.progressFill.fillRect(markX - 1, barY, 2, 8);
                    }
                });
            }
        }

    }

    revealArtifact() {
        this.isRevealed = true;
        this.isCompleted = true;

        const rarityData = ArtifactData.rarity[this.currentArtifact.rarity];
        const isNat = this.currentArtifact.isNationalTreasure;

        // 根据稀有度播放不同音效，发掘完成切回主界面 BGM
        const r = this.currentArtifact.rarity;
        if (this.audio) {
            if (r === 'mythic') this.audio.mythic();
            else if (r === 'legendary' || isNat) this.audio.nationalTreasure();
            else this.audio.discover(r);
        }

        // 发掘结束

        this.cameras.main.shake(600, 0.02);
        this.cameras.main.flash(300, 255, 220, 100);

        const ex = this.config.excavation;
        const flash = this.add.graphics().setDepth(30);
        flash.fillStyle(0xffffff, 0.8);
        flash.fillRect(ex.x, ex.y, ex.width, ex.height);
        this.tweens.add({
            targets: flash, alpha: 0, duration: 600,
            onComplete: () => flash.destroy()
        });

        // 增强粒子庆祝效果
        const cx = ex.x + ex.width / 2;
        const cy = ex.y + ex.height * 0.7;
        const particleColors = isNat
            ? ['#f4d03f', '#ff6b35', '#ffeaa7', '#ffd700', '#fff8dc']
            : (rarityData.color ? [rarityData.color, '#f4d03f', '#fff8e7'] : ['#d4a574', '#f4d03f', '#fff8e7']);
        this.spawnCelebrationBurst(cx, cy, isNat ? 24 : 12, particleColors);

        // 增强通知
        if (isNat) {
            this.showToastEnhanced(`国宝 ${this.currentArtifact.name} 出土！`, 'epic');
        } else if (r === 'mythic') {
            this.showToastEnhanced(`${this.currentArtifact.name} 传说降临！`, 'epic');
        } else {
            this.showToastEnhanced(`发现了 ${this.currentArtifact.name}`, 'success');
        }

        if (this.questionMark) {
            this.questionMark.destroy();
            this.questionMark = null;
        }

        // 清除旧图标，drawArtifactOutline(1.0) 会重新创建
        if (this.artifactIcon) { this.artifactIcon.destroy(); this.artifactIcon = null; }
        this.drawArtifactOutline(1.0);

        if (this.artifactLabel) {
            this.artifactLabel.setText(this.currentArtifact.name);
            this.artifactLabel.setColor(rarityData.color);
            this.tweens.add({
                targets: this.artifactLabel, alpha: 1, duration: 600, ease: 'Power2'
            });
        }

        // 顶部弹窗提示
        const toastText = isNat
            ? `✨ 国宝现世！${this.currentArtifact.name} ✨`
            : `出土了 ${this.currentArtifact.name}`;
        this.showToast(toastText, ex.x + ex.width / 2, 50);

        this.time.delayedCall(1800, () => this.doAppraisal());
    }

    doAppraisal() {
        if (!this.currentArtifact) {
            this.cleanupExcavation();
            return;
        }

        const baseAuth = this.currentArtifact.authenticity;
        // Lv.0 新手保护：无赝品
        const authChance = this.state.prestigeLevel === 0 ? 1.0
            : this.state.calculateAuthenticityChance(baseAuth);
        const isAuthentic = Math.random() < authChance;

        const conditionRoll = Math.random();
        let condition = 'complete';
        if (conditionRoll < 0.05) condition = 'ruined';
        else if (conditionRoll < 0.15) condition = 'fragmentary';
        else if (conditionRoll < 0.3) condition = 'damaged';
        else if (conditionRoll < 0.7) condition = 'complete';
        else if (conditionRoll < 0.9) condition = 'excellent';
        else condition = 'pristine';

        const result = this.economy.processArtifact(this.currentArtifact, isAuthentic, condition, this.state.currentSite ? this.state.currentSite.cost : 0);
        this.state.totalArtifactsFound++;
        this.state.discoveredArtifactIds.add(this.currentArtifact.id);

        this.showAppraisalResult(result, isAuthentic, condition);
    }

    showAppraisalResult(result, isAuthentic, condition) {
        // 鉴定音效
        if (this.audio) {
            if (result.type === 'national_treasure') this.audio.nationalTreasure();
            else if (isAuthentic) this.audio.authentic();
            else this.audio.fake();
        }

        const modal = this.add.container(0, 0).setDepth(100);

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, this.config.width, this.config.height);
        modal.add(overlay);

        const pw = 500;
        // 面板高度自适应：有文物图标时多留空间
        const iconKey = this.getArtifactIconKey(result.artifact);
        const ph = iconKey ? 520 : 450;
        const px = (this.config.width - pw) / 2;
        const py = (this.config.height - ph) / 2;

        const panel = this.add.graphics();
        panel.fillStyle(0x2c1810, 1);
        panel.fillRoundedRect(px, py, pw, ph, 16);

        let borderColor, resultTitle, titleColor;
        if (isAuthentic) {
            if (result.type === 'national_treasure') {
                borderColor = 0xf4d03f;
                resultTitle = '🎊 国宝级文物！';
                titleColor = '#f4d03f';
            } else {
                borderColor = 0x27ae60;
                resultTitle = '✅ 真品';
                titleColor = '#27ae60';
            }
        } else {
            borderColor = 0x888888;
            resultTitle = '❌ 赝品';
            titleColor = '#c0392b';
        }

        panel.lineStyle(4, borderColor, 1);
        panel.strokeRoundedRect(px, py, pw, ph, 16);
        modal.add(panel);

        modal.add(this.add.text(this.config.width / 2, py + 40, resultTitle, {
            fontSize: '28px', fontFamily: GameConfig.typography.fontFamily, color: titleColor, fontStyle: 'bold'
        }).setOrigin(0.5));

        // 文物图标 — 有图标时后续元素整体下移 70px
        const shift = iconKey ? 70 : 0;
        if (iconKey) {
            try {
                const img = this.add.image(this.config.width / 2, py + 90, iconKey)
                    .setDisplaySize(56, 56).setDepth(101);
                modal.add(img);
            } catch (e) {}
        }

        modal.add(this.add.text(this.config.width / 2, py + 85 + shift, result.artifact.name, {
            fontSize: '22px', fontFamily: GameConfig.typography.fontFamily, color: '#f5e6d3'
        }).setOrigin(0.5));

        const rarityData = ArtifactData.rarity[result.artifact.rarity];
        modal.add(this.add.text(this.config.width / 2, py + 120 + shift,
            `[${rarityData.name}] ×${rarityData.multiplier}`, {
                fontSize: '16px', fontFamily: GameConfig.typography.fontFamily, color: rarityData.color
            }).setOrigin(0.5));

        if (isAuthentic) {
            const condData = ArtifactData.condition[condition];
            modal.add(this.add.text(this.config.width / 2, py + 150 + shift,
                `品相: ${condData.name} (×${condData.valueMult})`, {
                    fontSize: '14px', fontFamily: GameConfig.typography.fontFamily, color: '#8b7355'
                }).setOrigin(0.5));
        }

        if (result.value.greaterThan(new BigNumber(0))) {
            const valLabel = isAuthentic ? '💰 获得经费' : '🔧 报销材料费';
            modal.add(this.add.text(this.config.width / 2, py + 200 + shift,
                `${valLabel}: ¥${result.value.toString()}`, {
                    fontSize: isAuthentic ? '26px' : '18px',
                    fontFamily: GameConfig.typography.fontFamily,
                    color: isAuthentic ? '#f4d03f' : '#8b7355',
                    fontStyle: isAuthentic ? 'bold' : 'normal'
                }).setOrigin(0.5));
        }

        modal.add(this.add.text(this.config.width / 2, py + 250 + shift, result.artifact.description, {
            fontSize: '13px', fontFamily: GameConfig.typography.fontFamily, color: '#a08060',
            align: 'center', wordWrap: { width: pw - 60 }
        }).setOrigin(0.5));

        if (result.artifact.funFact) {
            modal.add(this.add.text(this.config.width / 2, py + 285 + shift,
                `💬 ${result.artifact.funFact}`, {
                    fontSize: '12px', fontFamily: GameConfig.typography.fontFamily, color: '#8b7355',
                    fontStyle: 'italic', align: 'center', wordWrap: { width: pw - 60 }
                }).setOrigin(0.5));
        }

        // ── 按钮 ──
        if (result.type === 'national_treasure') {
            modal.add(this.add.text(this.config.width / 2, py + 325 + shift, '🏛️ 国宝级文物，请做抉择:', {
                fontSize: '14px', fontFamily: GameConfig.typography.fontFamily, color: '#d4a574'
            }).setOrigin(0.5));

            const btnY = py + 365 + shift;

            const handOverBtn = this.add.text(this.config.width / 2 - 110, btnY,
                `上交国家 (+${result.artifact.handOverReward || 400}JP)`, {
                    fontSize: '16px', fontFamily: GameConfig.typography.fontFamily, color: '#f5e6d3',
                    backgroundColor: '#27ae60', padding: { x: 18, y: 10 }
                }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            this.addButtonEffects(handOverBtn);

            handOverBtn.on('pointerdown', () => {
                const jpReward = result.artifact.handOverReward || 400;
                this.economy.addPrestigePoints(jpReward);
                this.showToastPopup(`感谢奉献！获得 ${jpReward} 基金点`);
                this.state.save();
                modal.destroy();
                this.time.delayedCall(1200, () => this.cleanupExcavation());
            });

            const keepBtn = this.add.text(this.config.width / 2 + 110, btnY,
                '私人收藏 (5×拍卖)', {
                    fontSize: '16px', fontFamily: GameConfig.typography.fontFamily, color: '#f5e6d3',
                    backgroundColor: '#8b7355', padding: { x: 18, y: 10 }
                }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            this.addButtonEffects(keepBtn);

            keepBtn.on('pointerdown', () => {
                const bonus = result.value.multiply(5);
                this.economy.addFunds(bonus);
                this.showToastPopup(`拍卖成功！额外获得 ¥${bonus.toString()}`);
                this.state.save();
                modal.destroy();
                this.time.delayedCall(1200, () => this.cleanupExcavation());
            });

            modal.add(handOverBtn);
            modal.add(keepBtn);
        } else {
            const continueBtn = this.add.text(this.config.width / 2, py + 390 + shift, '继续游戏 →', {
                fontSize: '18px', fontFamily: GameConfig.typography.fontFamily, color: '#f5e6d3',
                backgroundColor: '#3d2817', padding: { x: 25, y: 10 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            this.addButtonEffects(continueBtn);

            continueBtn.on('pointerdown', () => {
                this.state.save();
                modal.destroy();
                this.cleanupExcavation();
            });
            modal.add(continueBtn);
        }
    }

    cleanupExcavation() {
        this.isDigging = false;
        this.isRevealed = false;
        this.isCompleted = false;

        // 移除挖掘输入监听
        this.input.off('pointerdown');
        this.input.off('pointermove');
        this.input.off('pointerup');

        // 清理挖掘图层
        this.strataGraphics.forEach(g => g.destroy());
        this.strataGraphics = [];
        if (this.scrapeLayer) { this.scrapeLayer.destroy(); this.scrapeLayer = null; }
        if (this.artifactOutline) { this.artifactOutline.destroy(); this.artifactOutline = null; }
        if (this.artifactLabel) { this.artifactLabel.destroy(); this.artifactLabel = null; }
        if (this.questionMark) { this.questionMark.destroy(); this.questionMark = null; }
        if (this.artifactIcon) { this.artifactIcon.destroy(); this.artifactIcon = null; }

        // 清理进度UI
        if (this.progressBg) { this.progressBg.destroy(); this.progressBg = null; }
        if (this.progressFill) { this.progressFill.destroy(); this.progressFill = null; }
        // 清理可能残留的零活图形
        this.cleanupMinigameLeftovers();

        // 恢复静态预览
        this.drawSoilPreview();
        if (this.promptText) this.promptText.setAlpha(1);
        this.siteButtons.forEach(({ btn }) => btn.setVisible(true));

        // 恢复深度标注
        if (this.depthLabels) {
            this.depthLabels.forEach(l => { if (l && l.setVisible) l.setVisible(true); });
        }

        this.updateUI();
        this.state.save();
        this.showMessage('发掘完成！');
    }

    cleanupMinigameLeftovers() {
        if (this.cleanStrataGfx) { this.cleanStrataGfx.forEach(g => g.destroy()); this.cleanStrataGfx = null; }
        if (this.cleanScrapeGfx) { this.cleanScrapeGfx.destroy(); this.cleanScrapeGfx = null; }
        if (this.cleanHintText) { this.cleanHintText.destroy(); this.cleanHintText = null; }
        if (this.potteryBase) { this.potteryBase.destroy(); this.potteryBase = null; }
        if (this.potteryCrackGfx) { this.potteryCrackGfx.forEach(g => g.destroy()); this.potteryCrackGfx = null; }
        if (this.potteryIndicators) { this.potteryIndicators.forEach(m => m.destroy()); this.potteryIndicators = null; }
        if (this.potteryParticles) { this.potteryParticles.forEach(p => { if (p && p.destroy) p.destroy(); }); this.potteryParticles = null; }
        if (this.potteryBaseText) { this.potteryBaseText.destroy(); this.potteryBaseText = null; }
        if (this.potteryPctText) { this.potteryPctText.destroy(); this.potteryPctText = null; }
    }

    showToastPopup(text) {
        const toast = this.add.text(this.config.width / 2, this.config.height / 2, text, {
            fontSize: '20px', fontFamily: GameConfig.typography.fontFamily,
            color: '#f5e6d3', backgroundColor: '#2c1810',
            padding: { x: 25, y: 12 }
        }).setOrigin(0.5).setDepth(200);

        this.tweens.add({
            targets: toast, alpha: 0, y: toast.y - 40,
            duration: 2000, ease: 'Power2',
            onComplete: () => toast.destroy()
        });
    }

    // ══════════════════════════════════════════
    //  升级 / 转生 / 提示 / UI
    // ══════════════════════════════════════════

    purchaseUpgrade(upgradeId) {
        const cost = this.state.getUpgradeCost(upgradeId);
        const level = this.state.upgrades[upgradeId];
        const maxLevel = this.state.getMaxUpgradeLevel(upgradeId);

        if (level >= maxLevel) {
            this.showMessage('已达最大等级！', 'error');
            return;
        }
        if (!this.economy.canAfford(cost)) {
            this.showMessage('经费不足！', 'error');
            return;
        }

        this.economy.spendFunds(cost);
        this.state.upgrades[upgradeId]++;
        if (this.audio) this.audio.upgrade();
        this.showMessage(`${upgradeId} 升级到 Lv.${this.state.upgrades[upgradeId]}！`, 'success');
        this.updateUI();
        this.state.save();
    }

    doPrestige() {
        if (this.state.jackpotPointsThisRun < 5) {
            this.showMessage('本局基金点不足5点，无法操作', 'error');
            return;
        }

        const level = this.prestigeManager.calculatePrestigeLevel();
        if (level >= 5) {
            // Lv.5 学术休假（转生）
            const result = this.prestigeManager.doPrestige();
            if (result.success) {
                if (this.audio) this.audio.prestige();
                this.showPrestigeResult(result);
                this.saveManager.savePermanent();
                this.refreshSiteButtons();
                this.drawSoilPreview();
                this.updateUI();
                this.showMessage(result.message, 'success');
            }
        } else {
            // Lv.0~4 提升声望等级
            const result = this.prestigeManager.doAdvance();
            if (result.success) {
                if (this.audio) this.audio.prestige();
                if (result.leveledUp) {
                    this.showPrestigeResult(result);
                    // 晋升后检查是否需要新建依赖声望等级的功能
                    if (this.state.prestigeLevel >= 3 && !this.techArchaeologyLabel) {
                        this.createTechArchaeologyToggle(this.config.excavation);
                    }
                    if (this.state.prestigeLevel >= 4 && !this.workshopBtn) {
                        this.createRepairWorkshopBtn();
                    }
                }
                this.updateEraButtons();
                this.updateUI();
                this.showMessage(result.message, 'success');
            }
        }
    }

    showPrestigeResult(result) {
        const modal = this.add.container(0, 0).setDepth(100);

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, this.config.width, this.config.height);
        modal.add(overlay);

        const isRebirth = result.reward && typeof result.reward.name === 'string';
        const panelH = isRebirth ? 300 : 220 + (result.reward && result.reward.unlocks ? result.reward.unlocks.length * 26 : 0);

        const panel = this.add.graphics();
        panel.fillStyle(0x2c1810, 1);
        panel.fillRoundedRect(0, 0, 400, panelH, 20);
        panel.lineStyle(3, 0xf4d03f, 1);
        panel.strokeRoundedRect(0, 0, 400, panelH, 20);
        modal.add(panel);

        const title = isRebirth ? '🎉 学术休假完成!' : '⭐ 声望提升！';
        modal.add(this.add.text(200, 50, title, {
            fontSize: '28px', fontFamily: GameConfig.typography.fontFamily, color: '#f4d03f', fontStyle: 'bold'
        }).setOrigin(0.5));

        modal.add(this.add.text(200, 110, `获得 ${result.points} 基金点`, {
            fontSize: '20px', fontFamily: GameConfig.typography.fontFamily, color: '#9b59b6'
        }).setOrigin(0.5));

        if (result.reward) {
            if (isRebirth) {
                modal.add(this.add.text(200, 160, `永久奖励: ${result.reward.name}`, {
                    fontSize: '18px', fontFamily: GameConfig.typography.fontFamily, color: '#d4a574'
                }).setOrigin(0.5));
                modal.add(this.add.text(200, 190, result.reward.effect, {
                    fontSize: '14px', fontFamily: GameConfig.typography.fontFamily, color: '#8b7355'
                }).setOrigin(0.5));
            } else if (result.reward.unlocks) {
                const unlockY = 160;
                result.reward.unlocks.forEach((u, i) => {
                    modal.add(this.add.text(200, unlockY + i * 26, u, {
                        fontSize: '16px', fontFamily: GameConfig.typography.fontFamily, color: '#d4a574'
                    }).setOrigin(0.5));
                });
            }
        }

        const btnY = panelH - 50;
        const continueBtn = this.add.text(200, btnY, '继续游戏', {
            fontSize: '16px', fontFamily: GameConfig.typography.fontFamily, color: '#f5e6d3',
            backgroundColor: '#3d2817', padding: { x: 30, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.addButtonEffects(continueBtn);
        continueBtn.on('pointerdown', () => { this.audio.click(); modal.destroy(); });
        modal.add(continueBtn);
    }

    showUpgradeTooltip(upgrade, level, cost) {
        const descMap = {
            luck: `每级 +3% 真品率 | 当前 +${(this.state.getUpgradeEffect('luck')*100).toFixed(0)}%`,
            brushSize: `每级 铲宽+4% | 一次刮除更多土`,
            excavationSpeed: `每级 力道+6% | 刮得更深更快`,
            artifactValue: `每级 +12% 文物价值 | 当前 ×${(1+this.state.getUpgradeEffect('artifactValue')).toFixed(2)}`,
            appraisalAccuracy: `每级 +5% 鉴定准确率`
        };
        this.bottomText.setText(`💡 ${upgrade.name} Lv.${level}→Lv.${level+1} | ${descMap[upgrade.id] || ''}`);
    }

    hideUpgradeTooltip() {
        this.bottomText.setText('💡 选择一个发掘层位开始考古之旅');
    }

    showPrestigeTooltip() {
        this.bottomText.setText('🔮 学术休假：将本局积累转为永久加成，换取新开始');
    }

    hidePrestigeTooltip() {
        this.bottomText.setText('💡 选择一个发掘层位开始考古之旅');
    }

    showWelcomeMessage() {
        if (!this.saveManager.hasSave()) {
            this.showMessage('🎓 新手指南：选择一个层位→拖动鼠标刮土→发现文物→升级属性→攒JP转生！右侧可做零活赚钱', 'info');
        } else {
            // 回坑提示
            const nextEra = this.prestigeManager.getUnlockedEras();
            const eraCount = nextEra.length;
            const jp = this.state.jackpotPointsThisRun;
            if (jp >= 5) {
                this.showMessage(`🎉 本局已有 ${jp} JP！点击右侧「开始转生」解锁永久加成`, 'success');
            } else if (eraCount <= 1) {
                this.showMessage(`💡 继续发掘！攒够10 JP后转生即可解锁商周时代`, 'info');
            }
        }
    }

    showMessage(text, type = 'info') {
        if (!this.bottomText) return;
        const colors = { info: '#8b7355', success: '#27ae60', error: '#c0392b' };
        this.bottomText.setText(text);
        this.bottomText.setColor(colors[type] || colors.info);
        this.time.delayedCall(4000, () => {
            if (this.bottomText) {
                const tips = [
                    '💡 选择层位→拖动鼠标刮土→发现文物',
                    '💡 升级「文物倍率」可大幅提升收入',
                    `💡 当前声望 Lv.${this.state.prestigeLevel}，再${100 - (this.state.prestigePoints % 100)} JP 升级`,
                    '💡 国宝上交国家获得 JP，凑够 5 点即可转生',
                    '💡 没钱做零活，清理探方零风险赚 ¥300~500',
                ];
                this.bottomText.setText(tips[Math.floor(Math.random() * tips.length)]);
                this.bottomText.setColor('#8b7355');
            }
        });
    }

    showToast(text, tx, ty) {
        const toast = this.add.text(tx || this.config.width / 2, ty || 60, text, {
            fontSize: '18px', fontFamily: GameConfig.typography.fontFamily, color: '#f5e6d3',
            backgroundColor: '#2c1810', padding: { x: 15, y: 8 },
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 6, fill: true }
        }).setOrigin(0.5).setDepth(50);

        this.tweens.add({
            targets: toast, alpha: 0, y: toast.y - 40,
            duration: 2000, ease: 'Power2',
            onComplete: () => toast.destroy()
        });
    }

    updateUI() {
        if (this.fundsText) this.animateNumber(this.fundsText, this.state.funds.toNumber(), '¥', this.formatMoney.bind(this));
        if (this.jpText) this.jpText.setText(`${this.state.prestigePoints} JP`);
        if (this.prestigeText) this.prestigeText.setText(`声望 Lv.${this.state.prestigeLevel}`);

        if (this.statTexts) {
            this.statTexts.totalExcavations.setText(this.state.totalExcavations.toString());
            this.statTexts.totalArtifactsFound.setText(this.state.totalArtifactsFound.toString());
            if (this.statTexts.authFakeRatio) {
                const auth = this.state.totalAuthenticFound;
                const fake = this.state.totalFakesFound;
                this.statTexts.authFakeRatio.setText(`${auth} / ${fake}`);
            }
            this.statTexts.totalNationalTreasures.setText(this.state.totalNationalTreasures.toString());
            if (this.statTexts.collectionProgress) {
                const totalArtifacts = this.state.discoveredArtifactIds.size;
                this.statTexts.collectionProgress.setText(`${totalArtifacts} 件`);
            }
        }

        if (this.jpGainText) this.jpGainText.setText(`可获得: ${this.state.jackpotPointsThisRun} JP`);

        // 更新升级按钮
        const panelX = 20;
        const panelY = 155;
        const dividerY = panelY + 55 + 5 * 38 + 10;
        const upgradeTitleY = dividerY + 20;
        const upgrades = [
            { id: 'luck', name: '勘探运气', icon: 'icon_luck' },
            { id: 'brushSize', name: '挖掘范围', icon: 'icon_brush' },
            { id: 'excavationSpeed', name: '挖掘速度', icon: 'icon_speed' },
            { id: 'artifactValue', name: '文物倍率', icon: 'icon_multiplier' },
            { id: 'appraisalAccuracy', name: '鉴定精度', icon: 'icon_accuracy' }
        ];

        this.upgradeButtons.forEach(({ btn }) => btn.destroy());
        this.upgradeButtons = [];
        upgrades.forEach((upgrade, index) => {
            const y = upgradeTitleY + 25 + index * 36;
            const btn = this.createUpgradeButton(panelX + 15, y, upgrade);
            this.upgradeButtons.push({ btn, upgrade });
        });

        // 更新劳动按钮状态
        if (this.laborPotteryLabel && this.state.prestigeLevel >= 1) {
            if (this.laborPotteryCooldown <= 0) {
                this.laborPotteryLabel.setText('¥800~1200  |  就绪');
                this.laborPotteryLabel.setColor('#5a7a5a');
                this.laborPotteryBtn.setStyle({ color: '#8b7355' });
            }
        }
    }

    // 工具
    lerpColor(c1, c2, t) {
        const r1 = (c1 >> 16) & 0xFF, g1 = (c1 >> 8) & 0xFF, b1 = c1 & 0xFF;
        const r2 = (c2 >> 16) & 0xFF, g2 = (c2 >> 8) & 0xFF, b2 = c2 & 0xFF;
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        return (r << 16) | (g << 8) | b;
    }

    /** 给按钮添加 3D 按压 + hover 效果 */
    addButtonEffects(btn, scale = 1.05) {
        btn.on('pointerover', () => {
            if (btn.input && btn.input.enabled) {
                this.tweens.add({ targets: btn, scaleX: scale, scaleY: scale, duration: 80, ease: 'Back.easeOut' });
            }
        });
        btn.on('pointerout', () => {
            this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 120, ease: 'Back.easeOut' });
        });
        btn.on('pointerdown', () => {
            if (btn.input && btn.input.enabled) {
                this.tweens.add({ targets: btn, scaleX: 0.95, scaleY: 0.95, duration: 40, ease: 'Power2' });
            }
        });
        btn.on('pointerup', () => {
            this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 80, ease: 'Back.easeOut' });
        });
    }

    /** 增强版 Toast 通知 - 带边框和图标 */
    showToastEnhanced(text, type = 'info') {
        const colors = {
            success: { bg: 0x1a3a1a, border: 0x27ae60, icon: '✅ ' },
            error: { bg: 0x3a1a1a, border: 0xc0392b, icon: '❌ ' },
            gold: { bg: 0x2a2010, border: 0xf4d03f, icon: '💰 ' },
            info: { bg: 0x1a1a2a, border: 0x3498db, icon: '💡 ' },
            epic: { bg: 0x2a1a3a, border: 0x9b59b6, icon: '✨ ' },
            default: { bg: 0x2c1810, border: 0xd4a574, icon: '' }
        };
        const style = colors[type] || colors['default'];
        const display = style.icon + text;

        const toast = this.add.text(this.config.width / 2, 60, display, {
            fontSize: '18px', fontFamily: GameConfig.typography.fontFamily, color: '#f5e6d3',
            backgroundColor: '#' + style.bg.toString(16).padStart(6, '0'),
            padding: { x: 20, y: 12 },
            stroke: '#' + style.border.toString(16).padStart(6, '0'),
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(60).setAlpha(0);

        this.tweens.add({
            targets: toast, alpha: 1, duration: 200, ease: 'Power2',
            onComplete: () => {
                this.tweens.add({
                    targets: toast, alpha: 0, y: toast.y - 30,
                    duration: 1500, delay: 1200, ease: 'Power2',
                    onComplete: () => toast.destroy()
                });
            }
        });
    }

    /** 简写金额: ¥1.5K / ¥2.3M / ¥4.5B / ¥1.2T */
    formatMoney(value) {
        if (value >= 1e12) return (value / 1e12).toFixed(1) + 'T';
        if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
        if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
        if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
        return Math.floor(value).toLocaleString();
    }

    /** 数字滚动动画 */
    animateNumber(targetText, newValue, prefix = '', formatFn = null) {
        const currentText = targetText.text.replace(prefix, '').replace(/[,KMBT]/g, '');
        const current = parseFloat(currentText) || 0;
        const target = parseFloat(newValue) || 0;
        if (current === target) return;

        const duration = Math.min(800, Math.abs(target - current) * 2 + 200);

        this.tweens.addCounter({
            from: current,
            to: target,
            duration: duration,
            ease: 'Power2',
            onUpdate: function (tween) {
                const val = Math.round(tween.getValue());
                targetText.setText(prefix + val.toLocaleString());
            },
            onComplete: function () {
                if (formatFn) {
                    targetText.setText(prefix + formatFn(target));
                }
            }
        });
    }

    /** 文物出土时的增强粒子效果 */
    spawnCelebrationBurst(x, y, count, colors) {
        for (let i = 0; i < count; i++) {
            this.time.delayedCall(i * 30, () => {
                const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
                const dist = 40 + Math.random() * 80;
                const color = colors[Math.floor(Math.random() * colors.length)];

                const g = this.add.graphics().setDepth(30);
                g.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.9);
                const size = 2 + Math.random() * 4;
                g.fillCircle(0, 0, size);
                g.setPosition(x, y);

                this.tweens.add({
                    targets: g,
                    x: x + Math.cos(angle) * dist,
                    y: y + Math.sin(angle) * dist - 30,
                    alpha: 0,
                    scaleX: 0.2,
                    scaleY: 0.2,
                    duration: 700 + Math.random() * 400,
                    ease: 'Power2',
                    onComplete: () => g.destroy()
                });
            });
        }
    }

    /**
     * 预加载文物图标 — 在选定文物后立即调用，确保刮土完成前图片已准备好
     */
    _preloadArtifactIcon(artifact) {
        if (!artifact) return;
        const idKey = 'artifact_' + artifact.id;
        const typeKey = 'artifact_' + artifact.type;
        if (!this._loadingIcons) this._loadingIcons = new Set();
        // 使用原生 Image 加载，避免 Phaser scene loader 在 create() 阶段的状态冲突
        const tryLoad = (key, filename) => {
            if (this.textures.exists(key) || this._loadingIcons.has(filename)) return;
            this._loadingIcons.add(filename);
            const img = new Image();
            img.onload = () => { this.textures.addImage(key, img); };
            img.onerror = () => { console.warn('[MainScene] 文物图标加载失败:', filename); };
            img.src = 'assets/artifacts/' + filename + '.png';
        };
        tryLoad(idKey, artifact.id);
        tryLoad(typeKey, artifact.type);
    }

    /**
     * 获取文物图标的纹理 key，优先级：个体纹理 → 类型纹理 → null
     */
    getArtifactIconKey(artifact) {
        if (!artifact) return null;
        const idKey = 'artifact_' + artifact.id;
        if (this.textures.exists(idKey)) return idKey;
        const typeKey = 'artifact_' + artifact.type;
        if (this.textures.exists(typeKey)) return typeKey;
        // 还没加载过则再尝试一次
        if (!this._loadingIcons || !this._loadingIcons.has(artifact.id)) {
            this._preloadArtifactIcon(artifact);
        }
        return null;
    }
}

window.MainScene = MainScene;
