/**
 * 声望场景 - 六级阶梯 + 诱惑预览
 */
class PrestigeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PrestigeScene' });
    }

    create() {
        this.state = window.gameState;
        this.prestigeManager = window.prestigeManager;
        this.audio = window.audioManager;

        if (!this.state || !this.prestigeManager) {
            console.error('PrestigeScene: 管理器缺失，返回主界面');
            this.cameras.main.fadeOut(300, 26, 15, 10);
            this.time.delayedCall(300, () => this.scene.start('MainScene'));
            return;
        }

        this.cameras.main.fadeIn(400, 26, 15, 10);

        this.createBackground();
        this.createHeader();
        this.createTierTree();
        this.createFooter();
    }

    createBackground() {
        const W = GameConfig.width;
        const H = GameConfig.height;

        const bg = this.add.graphics();
        bg.fillStyle(0x1a0f0a, 1);
        bg.fillRect(0, 0, W, H);

        // 顶部栏
        const topBar = this.add.graphics();
        topBar.fillStyle(0x2c1810, 1);
        topBar.fillRect(0, 0, W, 60);
        topBar.lineStyle(2, 0xd4a574, 0.4);
        topBar.lineBetween(0, 60, W, 60);
    }

    createHeader() {
        const W = GameConfig.width;
        const font = GameConfig.typography.fontFamily;

        // 返回按钮
        const backBtn = this.add.text(20, 30, '← 返回', {
            fontSize: '17px',
            fontFamily: font,
            color: '#d4a574',
            backgroundColor: '#3d2817',
            padding: { x: 12, y: 6 }
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerdown', () => {
            if (this.audio) this.audio.click();
            this.cameras.main.fadeOut(300, 26, 15, 10);
            this.time.delayedCall(300, () => this.scene.start('MainScene'));
        });

        // 标题
        const tier = this.prestigeManager.getCurrentTier();
        this.add.text(W / 2, 30, '⭐ 声望等级 — ' + tier.name, {
            fontSize: '26px',
            fontFamily: font,
            color: '#f5e6d3',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 基金点
        this.add.text(W - 30, 20, '累积: ' + this.state.prestigePoints + ' JP', {
            fontSize: '17px',
            fontFamily: font,
            color: '#9b59b6'
        }).setOrigin(1, 0);

        this.add.text(W - 30, 44, '本局: ' + this.state.jackpotPointsThisRun + ' JP', {
            fontSize: '15px',
            fontFamily: font,
            color: '#8b7355'
        }).setOrigin(1, 0);
    }

    createTierTree() {
        const tiers = this.prestigeManager.getTierPreview();
        const startY = 130;
        const tierH = 80;
        const gapY = 12;
        const centerX = GameConfig.width / 2;

        tiers.forEach((tier, idx) => {
            const y = startY + idx * (tierH + gapY);
            this.createTierNode(centerX, y, tier, idx);
        });
    }

    createTierNode(cx, y, tier, idx) {
        const w = 580;
        const h = 76;
        const font = GameConfig.typography.fontFamily;
        const container = this.add.container(cx, y);

        // 背景卡片
        const bg = this.add.graphics();
        if (tier.current) {
            bg.fillStyle(0x3d2817, 1);
            bg.lineStyle(3, 0xd4a574, 1);
        } else if (tier.unlocked) {
            bg.fillStyle(0x2a1a0f, 1);
            bg.lineStyle(1, 0x555555, 0.5);
        } else if (tier.visible) {
            bg.fillStyle(0x1f1208, 1);
            bg.lineStyle(1, 0x444444, 0.4);
        } else {
            bg.fillStyle(0x151012, 1);
            bg.lineStyle(1, 0x333333, 0.3);
        }
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
        container.add(bg);

        // 等级数字圆
        const numCircle = this.add.graphics();
        const numX = -w / 2 + 40;
        if (tier.current) {
            numCircle.fillStyle(this._parseColor(tier.color), 1);
        } else if (tier.unlocked) {
            numCircle.fillStyle(0x27ae60, 1);
        } else {
            numCircle.fillStyle(0x444444, 1);
        }
        numCircle.fillCircle(numX, 0, 20);
        container.add(numCircle);

        container.add(this.add.text(numX, 0, 'Lv.' + tier.level, {
            fontSize: '15px',
            fontFamily: font,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5));

        // 等级名称
        const nameX = numX + 35;
        const nameColor = tier.current ? '#f4d03f' : (tier.unlocked ? '#f5e6d3' : '#666666');
        container.add(this.add.text(nameX, -10, tier.name, {
            fontSize: tier.current ? '20px' : '17px',
            fontFamily: font,
            color: nameColor,
            fontStyle: tier.current ? 'bold' : 'normal'
        }));

        // 解锁内容
        if (tier.visible) {
            var detailColor = tier.visible && !tier.unlocked ? tier.color : '#8b7355';
            var unlockText = tier.unlock;
            if (tier.current) unlockText = '✨ ' + unlockText + ' ✨';
            container.add(this.add.text(nameX, 14, unlockText, {
                fontSize: '14px',
                fontFamily: font,
                color: detailColor
            }));
        } else {
            container.add(this.add.text(nameX, 14, '🔒 未知能力', {
                fontSize: '14px',
                fontFamily: font,
                color: '#444444'
            }));
        }

        // 右侧状态
        const statusX = w / 2 - 40;
        if (tier.current) {
            const next = this.prestigeManager.getNextThreshold();
            if (next !== null) {
                const progress = Math.min(1, this.state.prestigePoints / next);
                const pct = Math.floor(progress * 100);
                container.add(this.add.text(statusX, -12, pct + '%', {
                    fontSize: '17px',
                    fontFamily: font,
                    color: '#f4d03f',
                    fontStyle: 'bold'
                }).setOrigin(1, 0.5));

                container.add(this.add.text(statusX, 12, this.state.prestigePoints + '/' + next + ' JP', {
                    fontSize: '12px',
                    fontFamily: font,
                    color: '#8b7355'
                }).setOrigin(1, 0.5));

                // 小进度条
                const barW = 80;
                const barX = statusX - barW - 15;
                const barG = this.add.graphics();
                barG.fillStyle(0x1a0f0a, 1);
                barG.fillRoundedRect(barX, -4, barW, 8, 4);
                barG.fillStyle(this._parseColor(tier.color), 1);
                barG.fillRoundedRect(barX, -4, barW * progress, 8, 4);
                container.add(barG);
            } else {
                container.add(this.add.text(statusX, 0, '🔮 可转生', {
                    fontSize: '15px',
                    fontFamily: font,
                    color: '#9b59b6',
                    fontStyle: 'bold'
                }).setOrigin(1, 0.5));
            }
        } else if (tier.unlocked) {
            container.add(this.add.text(statusX, 0, '✅ 已解锁', {
                fontSize: '15px',
                fontFamily: font,
                color: '#27ae60'
            }).setOrigin(1, 0.5));
        } else if (tier.visible) {
            container.add(this.add.text(statusX, 0, tier.threshold + ' JP', {
                fontSize: '15px',
                fontFamily: font,
                color: '#9b59b6'
            }).setOrigin(1, 0.5));
        } else {
            container.add(this.add.text(statusX, 0, '??? JP', {
                fontSize: '15px',
                fontFamily: font,
                color: '#444444'
            }).setOrigin(1, 0.5));
        }

        // 连接线（下一级）
        if (idx < 5) {
            const lineG = this.add.graphics();
            const lineColor = tier.unlocked ? 0x27ae60 : 0x3d2817;
            lineG.lineStyle(2, lineColor, tier.unlocked ? 0.6 : 0.3);
            const gapY = 12;
            lineG.lineBetween(cx, y + h / 2, cx, y + h / 2 + gapY);
        }
    }

    createFooter() {
        const W = GameConfig.width;
        const H = GameConfig.height;
        const font = GameConfig.typography.fontFamily;
        const y = H - 45;
        const currentTier = this.prestigeManager.getCurrentTier();
        const nextThreshold = this.prestigeManager.getNextThreshold();

        if (currentTier.level >= 5) {
            this.add.text(W / 2, y - 15,
                '💡 已达满级！使用学术休假（转生）换取永久加成', {
                fontSize: '15px',
                fontFamily: font,
                color: '#9b59b6'
            }).setOrigin(0.5);

            this.add.text(W / 2, y + 15,
                '已转生 ' + this.state.prestigeCount + ' 次 | 每转 +2% 全属性', {
                fontSize: '14px',
                fontFamily: font,
                color: '#8b7355'
            }).setOrigin(0.5);
        } else if (nextThreshold !== null) {
            this.add.text(W / 2, y,
                '💡 达到 ' + nextThreshold + ' JP 即可升至 Lv.' + (currentTier.level + 1),
                {
                    fontSize: '15px',
                    fontFamily: font,
                    color: '#8b7355'
                }).setOrigin(0.5);
        }
    }

    /**
     * 安全地将 '#rrggbb' 颜色字符串转为整数
     */
    _parseColor(str) {
        if (!str) return 0x444444;
        return parseInt(str.replace('#', '0x'), 16) || 0x444444;
    }
}

window.PrestigeScene = PrestigeScene;
