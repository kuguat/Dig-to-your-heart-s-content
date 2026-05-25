/**
 * 声望场景 - 六级阶梯 + 诱惑预览 + 详情弹窗
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

        this._detailPopup = null;
        this._popupMask = null;

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

        // 仅可见等级可点击查看详情，未解锁等级（???）不可交互
        const self = this;
        if (tier.visible) {
            const hitArea = this.add.rectangle(0, 0, w, h, 0xffffff, 0)
                .setInteractive({ useHandCursor: true });
            container.add(hitArea);

            hitArea.on('pointerdown', () => {
                if (self.audio) self.audio.click();
                self._showTierDetail(tier);
            });
            hitArea.on('pointerover', () => {
                bg.clear();
                if (tier.current) {
                    bg.fillStyle(0x4a3020, 1);
                    bg.lineStyle(3, 0xd4a574, 1);
                } else if (tier.unlocked) {
                    bg.fillStyle(0x352218, 1);
                    bg.lineStyle(1, 0x666666, 0.7);
                } else {
                    bg.fillStyle(0x2a1a10, 1);
                    bg.lineStyle(1, 0x555555, 0.6);
                }
                bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
                bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
            });
            hitArea.on('pointerout', () => {
                bg.clear();
                if (tier.current) {
                    bg.fillStyle(0x3d2817, 1);
                    bg.lineStyle(3, 0xd4a574, 1);
                } else if (tier.unlocked) {
                    bg.fillStyle(0x2a1a0f, 1);
                    bg.lineStyle(1, 0x555555, 0.5);
                } else {
                    bg.fillStyle(0x1f1208, 1);
                    bg.lineStyle(1, 0x444444, 0.4);
                }
                bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
                bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
            });
        }

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

        // 点击提示图标（仅可见等级显示）
        const tipIconX = nameX + 240;
        container.add(this.add.text(tipIconX, -10, tier.visible ? '🔍' : '🔒', {
            fontSize: '12px',
            fontFamily: font,
            color: tier.visible ? '#8b7355' : '#444444'
        }));

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
     * 显示某一声望等级的详细介绍弹窗（大尺寸，占页面3/4）
     */
    _showTierDetail(tier) {
        const W = GameConfig.width;
        const H = GameConfig.height;
        const font = GameConfig.typography.fontFamily;

        // 先关闭已有弹窗
        if (this._detailPopup) {
            this._detailPopup.destroy();
            this._detailPopup = null;
        }
        if (this._popupMask) {
            this._popupMask.destroy();
            this._popupMask = null;
        }

        // 弹窗尺寸 — 约占页面 3/4
        const pw = W * 0.78;
        const ph = H * 0.82;
        const halfW = pw / 2;
        const halfH = ph / 2;

        // 半透明遮罩
        this._popupMask = this.add.rectangle(0, 0, W, H, 0x000000, 0.6)
            .setOrigin(0, 0)
            .setDepth(100)
            .setInteractive()
            .on('pointerdown', () => {
                this._closeDetailPopup();
            });

        this._detailPopup = this.add.container(W / 2, H / 2).setDepth(101);

        // 弹窗背景
        const popupBg = this.add.graphics();
        popupBg.fillStyle(0x1a0f0a, 1);
        popupBg.fillRoundedRect(-halfW, -halfH, pw, ph, 18);
        popupBg.lineStyle(4, this._parseColor(tier.color), 0.85);
        popupBg.strokeRoundedRect(-halfW, -halfH, pw, ph, 18);
        this._detailPopup.add(popupBg);

        // 标题栏背景
        const headerH = 100;
        const headerBg = this.add.graphics();
        headerBg.fillStyle(this._parseColor(tier.color), 0.25);
        headerBg.fillRoundedRect(-halfW + 6, -halfH + 6, pw - 12, headerH, { tl: 14, tr: 14, bl: 0, br: 0 });
        this._detailPopup.add(headerBg);

        // 等级徽章
        const badgeCY = -halfH + headerH / 2 + 5;
        const badgeR = 24;
        const badgeG = this.add.graphics();
        badgeG.fillStyle(this._parseColor(tier.color), 1);
        badgeG.fillCircle(-halfW + 58, badgeCY, badgeR);
        this._detailPopup.add(badgeG);

        this._detailPopup.add(this.add.text(-halfW + 58, badgeCY, 'Lv.' + tier.level, {
            fontSize: '18px',
            fontFamily: font,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5));

        // 标题文字
        this._detailPopup.add(this.add.text(-halfW + 100, badgeCY - 16, tier.name, {
            fontSize: '30px',
            fontFamily: font,
            color: '#f4d03f',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5));

        // 副标题
        const subtitle = tier.detailTitle || ('Lv.' + tier.level + ' 详情');
        this._detailPopup.add(this.add.text(-halfW + 100, badgeCY + 16, subtitle, {
            fontSize: '19px',
            fontFamily: font,
            color: '#8b7355',
            fontStyle: 'italic'
        }).setOrigin(0, 0.5));

        // 分隔线
        const sepY = -halfH + headerH + 22;
        const sepG = this.add.graphics();
        sepG.lineStyle(2, this._parseColor(tier.color), 0.3);
        sepG.lineBetween(-halfW + 30, sepY, halfW - 30, sepY);
        this._detailPopup.add(sepG);

        // 状态标签
        let statusText = '';
        let statusColor = '#8b7355';
        if (tier.current) {
            statusText = '⭐ 当前等级';
            statusColor = '#f4d03f';
        } else if (tier.unlocked) {
            statusText = '✅ 已解锁';
            statusColor = '#27ae60';
        } else if (tier.visible) {
            statusText = '需要 ' + tier.threshold + ' JP 解锁';
            statusColor = '#9b59b6';
        }
        const statusY = sepY + 30;
        if (statusText) {
            this._detailPopup.add(this.add.text(0, statusY, statusText, {
                fontSize: '18px',
                fontFamily: font,
                color: statusColor,
                fontStyle: 'bold'
            }).setOrigin(0.5));
        }

        // 分隔线2
        const sep2Y = statusY + 30;
        const sep2G = this.add.graphics();
        sep2G.lineStyle(1, this._parseColor(tier.color), 0.15);
        sep2G.lineBetween(-halfW + 60, sep2Y, halfW - 60, sep2Y);
        this._detailPopup.add(sep2G);

        // 详细介绍 — 手动中文换行（Phaser wordWrap 对 CJK 无效）
        const descStartY = sep2Y + 20;
        const maxBottom = halfH - 20;
        const maxTextW = pw - 80;
        const descText = tier.description || '暂无详细介绍';
        // 预估算字号（基于字符量）
        const rawLineEst = descText.length / (Math.floor(maxTextW / 17)) + descText.split('\n').length;
        const availH = maxBottom - descStartY;
        let descSize = Math.min(19, Math.floor(availH / (rawLineEst * 1.25)));
        descSize = Math.max(14, descSize);

        // 手动 CJK 换行，Canvas 精确测量
        const wrappedText = PrestigeScene._wrapCJK(descText, maxTextW, descSize, font);
        const descObj = this.add.text(-(maxTextW / 2), descStartY, wrappedText, {
            fontSize: descSize + 'px',
            fontFamily: font,
            color: '#d4c5b0',
            lineSpacing: 8,
            align: 'left'
        }).setOrigin(0, 0);
        this._detailPopup.add(descObj);

        // 垂直溢出兜底
        const descBottom = descStartY + descObj.height;
        if (descBottom > maxBottom && descSize > 14) {
            descObj.destroy();
            const smallerSize = Math.max(14, Math.floor(descSize * 0.85));
            const retryText = PrestigeScene._wrapCJK(descText, maxTextW, smallerSize, font);
            const retryObj = this.add.text(-(maxTextW / 2), descStartY, retryText, {
                fontSize: smallerSize + 'px',
                fontFamily: font,
                color: '#d4c5b0',
                lineSpacing: 8,
                align: 'left'
            }).setOrigin(0, 0);
            this._detailPopup.add(retryObj);
            // 用 retryObj 替换 descObj 引用给底部提示用
            this._tempDescRef = retryObj;
        } else {
            this._tempDescRef = descObj;
        }

        // 关闭按钮
        const closeBtn = this.add.text(halfW - 36, -halfH + 18, '✕', {
            fontSize: '30px',
            fontFamily: font,
            color: '#8b7355',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(102).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => {
            this._closeDetailPopup();
        });
        closeBtn.on('pointerover', () => closeBtn.setColor('#f5e6d3'));
        closeBtn.on('pointerout', () => closeBtn.setColor('#8b7355'));
        this._detailPopup.add(closeBtn);

        // 底部提示（仅当空间够时显示）
        const refObj = this._tempDescRef;
        const finalBottom = descStartY + (refObj ? refObj.height : 0);
        if (finalBottom < maxBottom - 20) {
            this._detailPopup.add(this.add.text(0, halfH - 22, '点击空白处关闭 · 点击 ✕ 关闭', {
                fontSize: '13px',
                fontFamily: font,
                color: '#555555'
            }).setOrigin(0.5));
        }
        this._tempDescRef = null;

        // 入场动画
        this._detailPopup.setScale(0.8).setAlpha(0);
        this.tweens.add({
            targets: this._detailPopup,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 250,
            ease: 'Back.easeOut'
        });
    }

    /**
     * 关闭详情弹窗
     */
    _closeDetailPopup() {
        if (this._detailPopup) {
            this.tweens.killTweensOf(this._detailPopup);
            this.tweens.add({
                targets: this._detailPopup,
                scaleX: 0.9,
                scaleY: 0.9,
                alpha: 0,
                duration: 120,
                ease: 'Quad.easeIn',
                onComplete: () => {
                    if (this._detailPopup) {
                        this._detailPopup.destroy();
                        this._detailPopup = null;
                    }
                }
            });
        }
        if (this._popupMask) {
            this.tweens.add({
                targets: this._popupMask,
                alpha: 0,
                duration: 120,
                onComplete: () => {
                    if (this._popupMask) {
                        this._popupMask.destroy();
                        this._popupMask = null;
                    }
                }
            });
        }
    }

    /**
     * 手动 CJK 文本换行（Phaser wordWrap 对中文无效，因为没有空格分词）
     * 使用 Canvas measureText 精确测量每个字符像素宽度
     */
    static _wrapCJK(text, maxWidth, fontSize, fontFamily) {
        if (!PrestigeScene._measureCtx) {
            const c = document.createElement('canvas');
            PrestigeScene._measureCtx = c.getContext('2d');
        }
        const ctx = PrestigeScene._measureCtx;
        ctx.font = fontSize + 'px ' + (fontFamily || 'serif');

        const paragraphs = text.split('\n');
        const result = [];

        for (const para of paragraphs) {
            if (para === '') {
                result.push('');
                continue;
            }
            let line = '';
            let lineW = 0;
            for (const ch of para) {
                const chW = ctx.measureText(ch).width;
                if (lineW + chW > maxWidth && line.length > 0) {
                    result.push(line);
                    line = ch;
                    lineW = chW;
                } else {
                    line += ch;
                    lineW += chW;
                }
            }
            if (line.length > 0) result.push(line);
        }
        return result.join('\n');
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
