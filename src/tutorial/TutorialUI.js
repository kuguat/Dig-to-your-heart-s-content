/**
 * TutorialUI — 对话气泡 + 遮罩 + 高亮框 + 打字机效果
 */
class TutorialUI {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.visible = false;
        this.typewriterTimer = null;
        this.currentHighlight = null;
        this.onNext = null;
        this.onSkip = null;
        this.allowSkip = false;
        this.fullText = '';
        this.isTyping = false;
        this.typeIndex = 0;
        this.charSpeed = 35; // ms per character
    }

    /**
     * 显示教程面板
     * @param {string} text - 对话文本
     * @param {object|null} highlight - 高亮区域 {x, y, width, height}，null 为全屏遮罩无高亮
     * @param {object} options - {allowSkip, onNext, onSkip}
     */
    show(text, highlight, options = {}) {
        if (this.visible) this.hide(true);
        this.visible = true;

        this.fullText = text;
        this.allowSkip = !!options.allowSkip;
        this.onNext = options.onNext || null;
        this.onSkip = options.onSkip || null;
        this.typeIndex = 0;
        this._noMask = !!options.noMask;

        const w = this.scene.config.width;
        const h = this.scene.config.height;
        const depth = 200;

        this.container = this.scene.add.container(0, 0).setDepth(depth);

        // ── 遮罩层：半透明黑底，高亮区域留空 ──
        // noMask 模式：跳过遮罩，让玩家自由交互
        this._maskZones = [];

        if (!this._noMask) {
            if (highlight) {
                const hx = highlight.x, hy = highlight.y, hw = highlight.width, hh = highlight.height;
                // 四块遮罩 + 各自的交互区域
                const pieces = [];
                if (hy > 0) pieces.push({ rx: 0, ry: 0, rw: w, rh: hy });
                if (hy + hh < h) pieces.push({ rx: 0, ry: hy + hh, rw: w, rh: h - (hy + hh) });
                if (hx > 0) pieces.push({ rx: 0, ry: hy, rw: hx, rh: hh });
                if (hx + hw < w) pieces.push({ rx: hx + hw, ry: hy, rw: w - (hx + hw), rh: hh });

                pieces.forEach(p => {
                    const gfx = this.scene.add.graphics().setDepth(depth);
                    gfx.fillStyle(0x000000, 0.65);
                    gfx.fillRect(p.rx, p.ry, p.rw, p.rh);
                    this.container.add(gfx);
                    // 不设置 interactive，不拦截点击
                });

                // 高亮边框（单独绘制，不拦截点击）
                const borderGfx = this.scene.add.graphics().setDepth(depth);
                borderGfx.lineStyle(3, 0xffd700, 0.9);
                borderGfx.strokeRect(hx - 2, hy - 2, hw + 4, hh + 4);
                this.container.add(borderGfx);
            } else {
                // 全屏遮罩无高亮
                const gfx = this.scene.add.graphics().setDepth(depth);
                gfx.fillStyle(0x000000, 0.65);
                gfx.fillRect(0, 0, w, h);
                this.container.add(gfx);
            }
        }

        // ── 对话气泡 ──
        const bubbleW = Math.min(520, w - 40);
        const textW = bubbleW - 120; // 文本可用宽度
        const charPerLine = Math.floor(textW / 16); // 中文字符约 16px 宽
        // 计算文本行数
        const segments = text.split('\n');
        let totalLines = 0;
        segments.forEach(seg => {
            totalLines += Math.max(1, Math.ceil(seg.length / charPerLine));
        });
        const lineHeight = 22; // 16px 字号 + 6px 行间距
        const bubbleH = Math.min(
            Math.max(140, 50 + totalLines * lineHeight + 40), // 最小140，文本区 + 按钮/内边距
            h - 20 // 不超过屏幕高度
        );
        const bubbleX = (w - bubbleW) / 2;
        let bubbleY;
        if (options.forceBubbleY !== undefined) {
            bubbleY = Math.max(10, Math.min(options.forceBubbleY, h - bubbleH - 10));
        } else if (highlight && highlight.y < h / 2) {
            bubbleY = Math.min(highlight.y + highlight.height + 30, h - bubbleH - 20);
        } else if (highlight) {
            bubbleY = Math.max(highlight.y - bubbleH - 30, 20);
        } else {
            bubbleY = (h - bubbleH) / 2;
        }

        // 气泡背景
        const bubbleBg = this.scene.add.graphics().setDepth(depth + 1);
        bubbleBg.fillStyle(0x2c1810, 0.95);
        bubbleBg.fillRoundedRect(bubbleX, bubbleY, bubbleW, bubbleH, 12);
        bubbleBg.lineStyle(2, 0xd4a574, 0.8);
        bubbleBg.strokeRoundedRect(bubbleX, bubbleY, bubbleW, bubbleH, 12);
        this.container.add(bubbleBg);

        // ── 头像（左侧圆形） ──
        const avatarR = 30;
        const avatarX = bubbleX + 50;
        const avatarY = bubbleY + 55;
        const avatarGfx = this.scene.add.graphics().setDepth(depth + 2);
        // 脸
        avatarGfx.fillStyle(0xd4a574, 1);
        avatarGfx.fillCircle(avatarX, avatarY, avatarR);
        // 帽子
        avatarGfx.fillStyle(0x5a4030, 1);
        avatarGfx.fillRect(avatarX - 22, avatarY - 38, 44, 16);
        avatarGfx.fillRect(avatarX - 28, avatarY - 26, 56, 6);
        // 眼睛
        avatarGfx.fillStyle(0x1a0f0a, 1);
        avatarGfx.fillCircle(avatarX - 8, avatarY - 4, 4);
        avatarGfx.fillCircle(avatarX + 8, avatarY - 4, 4);
        // 眼镜框
        avatarGfx.lineStyle(2, 0x8b7355, 1);
        avatarGfx.strokeCircle(avatarX - 8, avatarY - 4, 6);
        avatarGfx.strokeCircle(avatarX + 8, avatarY - 4, 6);
        avatarGfx.lineBetween(avatarX - 2, avatarY - 4, avatarX + 2, avatarY - 4);
        // 微笑
        avatarGfx.lineStyle(2, 0x8b7355, 1);
        avatarGfx.beginPath();
        avatarGfx.arc(avatarX, avatarY + 6, 10, 0.1, Math.PI - 0.1, false);
        avatarGfx.strokePath();
        this.container.add(avatarGfx);

        // ── 名字标签 ──
        const nameText = this.scene.add.text(avatarX, avatarY + 37, '老陈', {
            fontSize: '12px',
            fontFamily: 'KaiTi, STKaiti, Microsoft YaHei, serif',
            color: '#d4a574',
        }).setOrigin(0.5).setDepth(depth + 2);
        this.container.add(nameText);

        // ── 对话文本 ──
        const textX = bubbleX + 90;
        const textY = bubbleY + 20;
        this._dialogText = this.scene.add.text(textX, textY, '', {
            fontSize: '16px',
            fontFamily: 'KaiTi, STKaiti, Microsoft YaHei, serif',
            color: '#f5e6d3',
            wordWrap: { width: textW, useAdvancedWrap: true },
            lineSpacing: 6,
        }).setDepth(depth + 2);
        this.container.add(this._dialogText);

        // ── "下一步" 按钮 ──
        const btnW = 100;
        const btnH = 36;
        const btnX = bubbleX + bubbleW - btnW - 20;
        const btnY = bubbleY + bubbleH - btnH - 15;
        const btnGfx = this.scene.add.graphics().setDepth(depth + 2);
        btnGfx.fillStyle(0x5a4030, 1);
        btnGfx.fillRoundedRect(btnX, btnY, btnW, btnH, 6);
        this.container.add(btnGfx);

        this._nextBtn = this.scene.add.text(btnX + btnW / 2, btnY + btnH / 2, '下一步 ▸', {
            fontSize: '14px',
            fontFamily: 'KaiTi, STKaiti, Microsoft YaHei, serif',
            color: '#f5e6d3',
        }).setOrigin(0.5).setDepth(depth + 3).setInteractive({ useHandCursor: true });
        this._nextBtn.on('pointerover', () => this._nextBtn.setColor('#ffd700'));
        this._nextBtn.on('pointerout', () => this._nextBtn.setColor('#f5e6d3'));
        this._nextBtn.on('pointerdown', () => this._handleNext());
        this._nextBtn.setVisible(false); // 打字机完成前隐藏
        this.container.add(this._nextBtn);
        this._btnGfx = btnGfx;
        btnGfx.setVisible(false);

        // ── 跳过按钮（×） ──
        if (this.allowSkip) {
            const skipX = bubbleX + bubbleW - 20;
            const skipY = bubbleY + 10;
            this._skipBtn = this.scene.add.text(skipX, skipY, '✕', {
                fontSize: '18px',
                fontFamily: 'KaiTi, STKaiti, Microsoft YaHei, serif',
                color: '#8b7355',
            }).setOrigin(0.5).setDepth(depth + 3).setInteractive({ useHandCursor: true });
            this._skipBtn.on('pointerover', () => this._skipBtn.setColor('#c0392b'));
            this._skipBtn.on('pointerout', () => this._skipBtn.setColor('#8b7355'));
            this._skipBtn.on('pointerdown', () => this._handleSkip());
            this.container.add(this._skipBtn);
        }

        // 点击气泡内非按钮区域也推进（noMask 模式下不拦截点击）
        if (!this._noMask) {
            const clickZone = this.scene.add.zone(
                bubbleX + bubbleW / 2,
                bubbleY + bubbleH / 2,
                bubbleW, bubbleH
            ).setDepth(depth + 1).setInteractive({ useHandCursor: false });
            clickZone.on('pointerdown', () => this._handleNext());
            this.container.add(clickZone);
        }

        // ── 启动打字机效果 ──
        this._startTypewriter();
    }

    /** 打字机动画 */
    _startTypewriter() {
        this.isTyping = true;
        this.typeIndex = 0;
        this._dialogText.setText('');
        this._tickTypewriter();
    }

    _tickTypewriter() {
        if (this.typeIndex < this.fullText.length) {
            // 一次输出1~3个字符，视觉更流畅
            const chunk = this.fullText.substring(this.typeIndex, this.typeIndex + 2);
            this.typeIndex += 2;
            this._dialogText.setText(this.fullText.substring(0, this.typeIndex));
            this.typewriterTimer = this.scene.time.delayedCall(this.charSpeed, () => this._tickTypewriter());
        } else {
            this._finishTypewriter();
        }
    }

    _finishTypewriter() {
        this.isTyping = false;
        this._dialogText.setText(this.fullText);
        // 显示"下一步"按钮
        if (this._nextBtn) this._nextBtn.setVisible(true);
        if (this._btnGfx) this._btnGfx.setVisible(true);
    }

    /** 点击下一步 */
    _handleNext() {
        if (this.isTyping) {
            // 正在打字，点击则直接显示全部
            if (this.typewriterTimer) this.typewriterTimer.remove(false);
            this._finishTypewriter();
            return;
        }
        // 触发回调
        if (this.onNext) this.onNext();
    }

    /** 点击跳过 */
    _handleSkip() {
        if (this.onSkip) this.onSkip();
        else this.hide();
    }

    /** 隐藏教程面板 */
    hide(silent = false) {
        this.visible = false;
        if (this.typewriterTimer) {
            this.typewriterTimer.remove(false);
            this.typewriterTimer = null;
        }
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        this._maskGraphics = null;
        this._dialogText = null;
        this._nextBtn = null;
        this._btnGfx = null;
        this._skipBtn = null;
    }

    /** 检查教程是否可见 */
    isShowing() {
        return this.visible;
    }
}

window.TutorialUI = TutorialUI;
