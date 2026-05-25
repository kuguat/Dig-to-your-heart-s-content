/**
 * 发掘场景 - 探方分层刮面法
 * 模拟真实考古：地层剖面 + 逐层刮土 + 文物逐渐浮现
 */
class ExcavationScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ExcavationScene' });
    }

    create(data) {
        try {
            this.gameState = window.gameState;
            this.economy = window.economyManager;
            this.audio = window.audioManager;

            if (!this.gameState || !this.economy) {
                console.error('ExcavationScene: 管理器缺失，返回主界面');
                this.scene.start('MainScene');
                return;
            }

            this.cameras.main.fadeIn(400, 26, 15, 10);

            this.era = (data && data.era) ? data.era : this.gameState.currentEra;
            this.eraData = EraData[this.era];
            this.site = (data && data.site) ? data.site : (this.eraData ? this.eraData.sites[0] : null);

            if (!this.eraData || !this.site) {
                this.scene.start('MainScene');
                return;
            }

        // 生成随机文物
        this.currentArtifact = ArtifactData.getRandomArtifactForSite(this.era, this.site.risk);

        // 预加载文物图标（避免刮土时加载延迟导致图标不显示）
        this._preloadArtifactIcon(this.currentArtifact);

        // 初始化状态
        this.isRevealed = false;
        this.isCompleted = false;
        this.totalSoilVolume = 0;
        this.removedSoilVolume = 0;

        // 构建地层
        this.buildStrata();

        // 创建界面
        this.createBackground();
        this.createExcavationView();
        this.createStrataDisplay();
        this.createUI();
        this.setupDigInput();

        // 入场动画
        this.playEntryAnimation();
        } catch (e) {
            console.error('ExcavationScene.create 错误:', e);
            this.scene.start('MainScene');
        }
    }

    // ── 地层数据 ──
    buildStrata() {
        // 地层定义：每层有 名称、土质强度（需刮除的土量）、颜色、描述
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

        this.totalSoilVolume = this.soilLayers.reduce((sum, l) => sum + l.soilVolume, 0);
        this.currentLayer = 0;

        // 初始化每层剩余土量
        this.soilLayers.forEach(l => { l.remaining = l.soilVolume; });
    }

    // ── 背景 ──
    createBackground() {
        const bg = this.add.graphics();
        bg.fillStyle(0x1a0f0a, 1);
        bg.fillRect(0, 0, this.config.width, this.config.height);

        // 网格线
        bg.lineStyle(1, 0x2c1810, 0.3);
        for (let y = 0; y < this.config.height; y += 30) {
            bg.lineBetween(0, y, this.config.width, y);
        }
        for (let x = 0; x < this.config.width; x += 30) {
            bg.lineBetween(x, 0, x, this.config.height);
        }
    }

    // ── 发掘视图 ──
    createExcavationView() {
        const ex = this.config.excavation;

        // 探方边框
        const frame = this.add.graphics().setDepth(1);
        frame.fillStyle(0x2c1810, 1);
        frame.fillRect(ex.x - 8, ex.y - 8, ex.width + 16, ex.height + 16);

        const eraColor = parseInt(this.eraData.color.replace('#', '0x'));
        frame.lineStyle(3, eraColor, 0.8);
        frame.strokeRect(ex.x - 8, ex.y - 8, ex.width + 16, ex.height + 16);

        // 四角铆钉装饰
        const rivetSize = 4;
        [[ex.x-8, ex.y-8], [ex.x+ex.width+8, ex.y-8],
         [ex.x-8, ex.y+ex.height+8], [ex.x+ex.width+8, ex.y+ex.height+8]].forEach(([rx, ry]) => {
            frame.fillStyle(eraColor, 1);
            frame.fillCircle(rx, ry, rivetSize);
        });

        // 地层绘制层（从底到顶）
        this.strataGraphics = [];
        for (let i = 0; i < this.soilLayers.length; i++) {
            const g = this.add.graphics().setDepth(5 + this.soilLayers.length - i);
            this.strataGraphics.push(g);
        }

        // 刮痕层（覆盖在地层上面）
        this.scrapeLayer = this.add.graphics().setDepth(10);

        // 文物轮廓层
        this.artifactOutline = this.add.graphics().setDepth(11);
        this.drawArtifactOutline(0);

        // 文物名称标签（初始隐藏）
        if (this.currentArtifact) {
            this.artifactLabel = this.add.text(
                ex.x + ex.width / 2, ex.y + ex.height + 35,
                `? ? ?`, {
                    fontSize: '20px',
                    fontFamily: GameConfig.typography.fontFamily,
                    color: '#d4a574',
                    fontStyle: 'bold'
                }
            ).setOrigin(0.5).setAlpha(0).setDepth(15);
        }

        // 侧边地层标注
        this.layerLabels = [];
        this.drawStrata();
    }

    // ── 绘制地层 ──
    drawStrata() {
        const ex = this.config.excavation;

        // 计算每层在地层中的高度比例
        let yOffset = ex.y;
        const totalVisibleVol = this.totalSoilVolume;

        this.soilLayers.forEach((layer, index) => {
            const g = this.strataGraphics[index];
            g.clear();

            const layerHeight = (layer.soilVolume / totalVisibleVol) * ex.height;
            const remainingHeight = (layer.remaining / layer.soilVolume) * layerHeight;
            const y = yOffset + (layerHeight - remainingHeight);

            if (remainingHeight <= 0 && index < this.soilLayers.length - 1) {
                // 完全刮净的层 - 画浅色残迹
                g.fillStyle(layer.lightColor, 0.3);
                g.fillRect(ex.x, yOffset, ex.width, layerHeight);

                // 边界线
                g.lineStyle(1, layer.lightColor, 0.4);
                g.lineBetween(ex.x, yOffset, ex.x + ex.width, yOffset);
            } else if (remainingHeight > 0) {
                // 还有土 - 画土壤颜色
                const lerpFactor = layer.remaining / layer.soilVolume;
                const color = this.lerpColor(layer.color, layer.lightColor, 1 - lerpFactor);

                g.fillStyle(color, 1);
                g.fillRect(ex.x, y, ex.width, remainingHeight);

                // 纹理颗粒
                if (index < this.soilLayers.length - 1) {
                    this.drawSoilTexture(g, ex.x, y, ex.width, remainingHeight, layer);
                }

                // 已刮除部分的残迹
                if (y > yOffset) {
                    g.fillStyle(layer.lightColor, 0.25);
                    g.fillRect(ex.x, yOffset, ex.width, y - yOffset);
                }
            }

            yOffset += layerHeight;
        });
    }

    // ── 土壤纹理 ──
    drawSoilTexture(g, x, y, w, h, layer) {
        const seed = layer.texture === 'gravel' ? 15 :
                     layer.texture === 'loess' ? 8 :
                     layer.texture === 'artifact' ? 5 : 20;
        const count = Math.floor(w * h / 80);

        for (let i = 0; i < count; i++) {
            const px = x + Math.random() * w;
            const py = y + Math.random() * h;
            const size = layer.texture === 'gravel' ? Math.random() * 4 + 2 :
                         layer.texture === 'artifact' ? Math.random() * 2 + 1 :
                         Math.random() * 3 + 1;

            let dotColor;
            if (layer.texture === 'artifact') {
                dotColor = [0xA0522D, 0xCD853F, 0x8B6914, 0xDAA520][Math.floor(Math.random() * 4)];
            } else if (layer.texture === 'gravel') {
                dotColor = [0x6B5B4F, 0x8B7355, 0x9B8B6F, 0x7B6B5B][Math.floor(Math.random() * 4)];
            } else {
                dotColor = [0x8B6914, 0xA07828, 0x9B7B3C, 0x806010][Math.floor(Math.random() * 4)];
            }

            g.fillStyle(dotColor, Math.random() * 0.2 + 0.15);
            g.fillCircle(px, py, size);
        }
    }

    // ── 文物轮廓 ──
    drawArtifactOutline(alpha) {
        const ex = this.config.excavation;
        const g = this.artifactOutline;
        g.clear();

        if (!this.currentArtifact || alpha <= 0) return;

        const cx = ex.x + ex.width / 2;
        const cy = ex.y + ex.height * 0.85;

        const rarityData = ArtifactData.rarity[this.currentArtifact.rarity];
        const color = parseInt(rarityData.color.replace('#', '0x'));

        // 光晕
        g.fillStyle(color, alpha * 0.15);
        g.fillCircle(cx, cy, 80);

        // 文物主体
        g.fillStyle(color, alpha * 0.3);
        g.fillCircle(cx, cy, 45);

        // 问号图标 / 名称切换
        if (alpha < 0.80) {
            // 还没完全显露 — 显示问号
            if (this.artifactLabel) this.artifactLabel.setAlpha(0);
            const qAlpha = alpha < 0.15 ? 1 : 1 - (alpha - 0.15) / 0.65;
            if (this.questionMark) this.questionMark.destroy();
            this.questionMark = this.add.text(cx, cy, '?', {
                fontSize: '52px',
                fontFamily: GameConfig.typography.mysteryFont,
                color: '#f5e6d3',
                fontStyle: 'bold'
            }).setOrigin(0.5).setAlpha(Math.max(0.1, qAlpha * 0.8)).setDepth(12);
        } else {
            // 文物层挖到八成以上 — 揭晓名称和图标
            if (this.questionMark) { this.questionMark.destroy(); this.questionMark = null; }
            if (this.artifactLabel) {
                this.artifactLabel.setText(this.currentArtifact.name);
                this.artifactLabel.setAlpha((alpha - 0.80) / 0.20);
            }
            // 显示文物图标 (优先个体纹理)
            if (alpha >= 0.70 && !this.artifactIcon) {
                const iconKey = this.getArtifactIconKey(this.currentArtifact);
                if (iconKey) {
                    try {
                        this.artifactIcon = this.add.image(cx, cy - 10, iconKey)
                            .setDisplaySize(70, 70)
                            .setAlpha(0)
                            .setDepth(13);
                        this.tweens.add({
                            targets: this.artifactIcon,
                            alpha: 1,
                            duration: 300
                        });
                    } catch (e) {
                        console.error('[drawArtifactOutline] 添加图标失败:', e);
                    }
                }
            }
        }
    }

    // ── 侧边地层标注 ──
    createStrataDisplay() {
        this.layerLabels.forEach(l => l.destroy());
        this.layerLabels = [];

        const ex = this.config.excavation;
        const labelX = ex.x - 15;

        let yOffset = ex.y;
        this.soilLayers.forEach((layer, index) => {
            const layerHeight = (layer.soilVolume / this.totalSoilVolume) * ex.height;
            const midY = yOffset + layerHeight / 2;

            const label = this.add.text(labelX, midY, layer.name, {
                fontSize: '12px',
                fontFamily: GameConfig.typography.fontFamily,
                color: '#8b7355',
                fontStyle: 'bold'
            }).setOrigin(1, 0.5).setDepth(15);

            this.layerLabels.push(label);
            yOffset += layerHeight;
        });
    }

    // ── 顶部 & 底部 UI ──
    createUI() {
        // 顶栏
        const topBar = this.add.graphics().setDepth(20);
        topBar.fillStyle(0x2c1810, 0.95);
        topBar.fillRect(0, 0, this.config.width, 60);
        topBar.lineStyle(2, 0xd4a574, 0.4);
        topBar.lineBetween(0, 60, this.config.width, 60);

        // 返回按钮
        const backBtn = this.add.text(20, 30, '← 返回', {
            fontSize: '17px', fontFamily: GameConfig.typography.fontFamily,
            color: '#d4a574', backgroundColor: '#3d2817',
            padding: { x: 12, y: 6 }
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setDepth(21);
        backBtn.on('pointerdown', () => {
            if (!this.isCompleted) {
                this.gameState.save();
            }
            if (this.audio) this.audio.click();
            this.cameras.main.fadeOut(300, 26, 15, 10);
            this.time.delayedCall(300, () => this.scene.start('MainScene'));
        });

        // 标题
        this.add.text(this.config.width / 2, 30,
            `${this.eraData.name} · ${this.site.name}`, {
                fontSize: '20px', fontFamily: GameConfig.typography.fontFamily,
                color: '#f5e6d3', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(21);

        // 进度条
        const ex = this.config.excavation;
        const barY = ex.y + ex.height + 60;

        this.progressBg = this.add.graphics().setDepth(20);
        this.progressBg.fillStyle(0x3d2817, 1);
        this.progressBg.fillRoundedRect(ex.x, barY, ex.width, 12, 6);

        this.progressFill = this.add.graphics().setDepth(21);

        // 工具状态栏
        const toolY = barY + 48;
        this.toolText = this.add.text(ex.x, toolY, '', {
            fontSize: '15px', fontFamily: GameConfig.typography.fontFamily,
            color: '#a08060'
        }).setDepth(21);
        this.updateToolText();

        // 发掘进度（覆盖在探方右下角）
        this.overlayPct = this.add.text(
            ex.x + ex.width - 15, ex.y + ex.height - 5,
            '0%', {
                fontSize: '34px', fontFamily: GameConfig.typography.mysteryFont,
                color: '#d4a574', fontStyle: 'bold'
            }).setOrigin(1, 1).setAlpha(0.3).setDepth(15);
    }

    updateToolText() {
        const rangeLevel = this.gameState.upgrades.brushSize;
        const speedLevel = this.gameState.upgrades.excavationSpeed;
        const rangeBonus = (1 + this.gameState.getUpgradeEffect('brushSize')).toFixed(1);
        const speedBonus = (1 + this.gameState.getUpgradeEffect('excavationSpeed')).toFixed(1);

        this.toolText.setText(
            `🔧 铲宽 Lv.${rangeLevel} (×${rangeBonus}) | ⚡ 力道 Lv.${speedLevel} (×${speedBonus})`
        );
    }

    // ── 入场动画 ──
    playEntryAnimation() {
        const ex = this.config.excavation;
        this.cameras.main.flash(300, 28, 20, 8, true);

        // 标题短暂显示
        const title = this.add.text(ex.x + ex.width/2, ex.y + ex.height/2,
            `${this.site.name}`, {
                fontSize: '38px', fontFamily: GameConfig.typography.fontFamily,
                color: '#f5e6d3', fontStyle: 'bold',
                shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 10, fill: true }
            }).setOrigin(0.5).setDepth(30);

        this.tweens.add({
            targets: title,
            alpha: 0, y: title.y - 50,
            duration: 1500, ease: 'Power2',
            onComplete: () => title.destroy()
        });
    }

    // ── 点击挖掘输入 ──
    setupDigInput() {
        this.input.on('pointerdown', (pointer) => {
            if (this.isCompleted) return;
            this.dig(pointer.x, pointer.y);
        });
    }

    dig(px, py) {
        const ex = this.config.excavation;

        // 检查点击是否在发掘区域内
        if (px < ex.x || px > ex.x + ex.width ||
            py < ex.y || py > ex.y + ex.height) {
            return;
        }

        if (this.isRevealed) return;

        // 获取当前正在挖掘的层
        const layer = this.soilLayers[this.currentLayer];
        if (!layer || layer.remaining <= 0) return;

        // ── 计算挖掘力道 ──
        // 基础刮土量
        const baseDigPower = 1.5;
        // 挖掘范围加成（铲宽更大 = 一次刮更多土）
        const rangeBonus = this.gameState.getUpgradeEffect('brushSize');
        // 挖掘速度加成（力道更大 = 一次刮更深）
        const speedBonus = this.gameState.getUpgradeEffect('excavationSpeed');
        // 地层硬度修正（越深越慢）
        const hardnessMod = 1.0 / (1.0 + this.currentLayer * 0.3);

        const digPower = baseDigPower * (1 + rangeBonus) * (1 + speedBonus) * hardnessMod;

        // 扣除当前层土量
        const removed = Math.min(digPower, layer.remaining);
        layer.remaining -= removed;
        this.removedSoilVolume += removed;

        // ── 刮痕效果 ──
        this.drawScrapeMark(px, py);

        // ── 粒子效果 ──
        this.spawnDigParticles(px, py);

        // ── 检查当前层是否刮完 ──
        if (layer.remaining <= 0) {
            // 小发现（文化层和文物层有机会）
            if (this.currentLayer === 1 || this.currentLayer === 3) {
                this.maybeSmallFind();
            }

            this.currentLayer++;
            if (this.currentLayer >= this.soilLayers.length - 1) {
                // 到达生土层 — 文物完全揭示
                if (!this.isRevealed) {
                    this.revealArtifact();
                }
                return;
            }
        }

        // ── 更新显示 ──
        this.drawStrata();
        this.updateProgress();

        // 文物轮廓渐变 — 分层递进
        let artifactAlpha;
        if (this.currentLayer <= 0) {
            // 表土层：什么都看不到
            artifactAlpha = 0;
        } else if (this.currentLayer === 1) {
            // 文化层：隐约轮廓 + 问号
            artifactAlpha = 0.15;
        } else if (this.currentLayer === 2) {
            // 堆积层：轮廓渐清
            artifactAlpha = 0.35;
        } else {
            // 文物层：随刮土逐渐浮现 (0.35 → 0.90)
            const layerProgress = 1 - (this.soilLayers[3].remaining / this.soilLayers[3].soilVolume);
            artifactAlpha = 0.35 + layerProgress * 0.55;
        }
        this.drawArtifactOutline(Math.min(1, artifactAlpha));

        // 更新进度
        const pct = Math.min(100, Math.floor(this.getProgress() * 100));
    }

    // ── 刮痕绘制 ──
    drawScrapeMark(x, y) {
        const ex = this.config.excavation;
        const rangeLevel = this.gameState.upgrades.brushSize;
        const markWidth = 30 + rangeLevel * 5; // 铲宽随升级增大

        const g = this.scrapeLayer;
        g.fillStyle(0x1a0f0a, 0.4);

        // 水平刮痕（模拟手铲方向）
        const sx = Math.max(ex.x, x - markWidth / 2);
        const sw = Math.min(markWidth, ex.width - (sx - ex.x));
        const sy = Math.max(ex.y, y - 3);

        g.fillRect(sx, sy, sw, 6);

        // 边缘碎土
        g.fillStyle(0x3d2817, 0.3);
        g.fillRect(sx - 2, sy - 1, 4, 8);
        g.fillRect(sx + sw - 2, sy - 1, 4, 8);

        // 在 1 秒后淡化刮痕
        this.time.delayedCall(1000, () => {
            this.scrapeLayer.clear();
        });
    }

    // ── 粒子效果 ──
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
                alpha: 0,
                scaleX: 0.3,
                scaleY: 0.3,
                duration: 250 + Math.random() * 250,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    // ── 小发现 ──
    maybeSmallFind() {
        // 20% 概率在文化层，35% 在文物层
        const chance = this.currentLayer === 1 ? 0.2 : 0.35;
        if (Math.random() > chance) return;

        const finds = [
            { name: '碎陶片', value: 30, icon: '🏺' },
            { name: '骨器碎片', value: 50, icon: '🦴' },
            { name: '炭化谷物', value: 20, icon: '🌾' },
            { name: '旧铜钱', value: 80, icon: '🪙' },
            { name: '石斧残片', value: 60, icon: '🪨' },
            { name: '彩陶碎片', value: 100, icon: '🎨' },
            { name: '玉料边角', value: 150, icon: '💎' },
            { name: '卜骨残片', value: 120, icon: '🔮' }
        ];

        const find = finds[Math.floor(Math.random() * finds.length)];
        this.economy.addFunds(find.value);

        // 浮动提示
        const ex = this.config.excavation;
        const fx = ex.x + 50 + Math.random() * (ex.width - 100);
        const fy = ex.y + 50 + Math.random() * (ex.height - 100);

        const toast = this.add.text(fx, fy,
            `${find.icon} 发现${find.name}！+¥${find.value}`, {
                fontSize: '17px', fontFamily: GameConfig.typography.fontFamily,
                color: '#f4d03f', fontStyle: 'bold',
                shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 6, fill: true }
            }).setOrigin(0.5).setDepth(30);

        this.tweens.add({
            targets: toast,
            alpha: 0, y: toast.y - 60,
            duration: 2000, ease: 'Power2',
            onComplete: () => toast.destroy()
        });
    }

    // ── 进度更新 ──
    getProgress() {
        return Math.min(1, this.removedSoilVolume / this.totalSoilVolume);
    }

    updateProgress() {
        const ex = this.config.excavation;
        const barY = ex.y + ex.height + 60;
        const pct = this.getProgress();

        // 更新进度条
        this.progressFill.clear();
        const fillWidth = ex.width * pct;

        const progressColor = Phaser.Display.Color.Interpolate.ColorWithColor(
            { r: 100, g: 80, b: 50 },
            { r: 212, g: 165, b: 116 },
            100,
            Math.floor(pct * 100)
        );
        const colorHex = Phaser.Display.Color.GetColor(
            progressColor.r, progressColor.g, progressColor.b
        );

        this.progressFill.fillStyle(colorHex, 1);
        this.progressFill.fillRoundedRect(ex.x, barY, fillWidth, 12, 6);

        // 进度分段线
        if (pct > 0) {
            let yCheck = ex.y;
            this.soilLayers.forEach((layer, i) => {
                yCheck += (layer.soilVolume / this.totalSoilVolume) * ex.height;
                const barX = ex.x + (yCheck - ex.y) / ex.height * ex.width;
                if (barX < ex.x + ex.width && i < this.soilLayers.length - 1) {
                    this.progressFill.fillStyle(0x1a0f0a, 0.5);
                    this.progressFill.fillRect(barX - 1, barY, 2, 12);
                }
            });
        }

        // 探方内百分比
        this.overlayPct.setText(`${Math.floor(pct * 100)}%`);
        this.overlayPct.setAlpha(0.2 + pct * 0.4);
    }

    // ── 揭示文物 ──
    revealArtifact() {
        this.isRevealed = true;
        this.isCompleted = true;



        // 震动
        this.cameras.main.shake(600, 0.01);

        // 闪光
        const ex = this.config.excavation;
        const flash = this.add.graphics().setDepth(30);
        flash.fillStyle(0xffffff, 0.7);
        flash.fillRect(ex.x, ex.y, ex.width, ex.height);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            onComplete: () => flash.destroy()
        });

        // 清除问号
        if (this.questionMark) {
            this.questionMark.destroy();
            this.questionMark = null;
        }

        // 显示文物全貌
        this.drawArtifactOutline(1.0);

        // 显示名称
        if (this.artifactLabel) {
            this.artifactLabel.setText(this.currentArtifact.name);
            this.tweens.add({
                targets: this.artifactLabel,
                alpha: 1,
                duration: 600,
                ease: 'Power2'
            });
        }

        // 延迟鉴定
        this.time.delayedCall(1500, () => this.doAppraisal());
    }

    // ── 鉴定 ──
    doAppraisal() {
        if (!this.currentArtifact) {
            this.scene.start('MainScene');
            return;
        }

        // Lv.0 新手保护：无赝品
        const baseAuth = this.currentArtifact.authenticity;
        const authChance = this.gameState.prestigeLevel === 0 ? 1.0
            : this.gameState.calculateAuthenticityChance(baseAuth);
        const isAuthentic = Math.random() < authChance;

        const conditionRoll = Math.random();
        let condition = 'complete';
        if (conditionRoll < 0.05) condition = 'ruined';
        else if (conditionRoll < 0.15) condition = 'fragmentary';
        else if (conditionRoll < 0.3) condition = 'damaged';
        else if (conditionRoll < 0.7) condition = 'complete';
        else if (conditionRoll < 0.9) condition = 'excellent';
        else condition = 'pristine';

        const result = this.economy.processArtifact(
            this.currentArtifact, isAuthentic, condition,
            this.site ? this.site.cost : 0
        );

        this.gameState.totalArtifactsFound++;
        this.gameState.discoveredArtifactIds.add(this.currentArtifact.id);

        this.showAppraisalResult(result, isAuthentic, condition);
    }

    // ── 鉴定结果弹窗 ──
    showAppraisalResult(result, isAuthentic, condition) {
        const modal = this.add.container(0, 0).setDepth(100);

        // 遮罩
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, this.config.width, this.config.height);
        modal.add(overlay);

        // 面板
        const pw = 500, ph = 440;
        const px = (this.config.width - pw) / 2;
        const py = (this.config.height - ph) / 2;

        const panel = this.add.graphics();
        panel.fillStyle(0x2c1810, 1);
        panel.fillRoundedRect(px, py, pw, ph, 16);

        let borderColor = 0x888888;
        let resultTitle = '❌ 赝品';
        let titleColor = '#c0392b';

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
        }

        panel.lineStyle(4, borderColor, 1);
        panel.strokeRoundedRect(px, py, pw, ph, 16);
        modal.add(panel);

        // 标题
        modal.add(this.add.text(this.config.width / 2, py + 40, resultTitle, {
            fontSize: '30px', fontFamily: GameConfig.typography.fontFamily,
            color: titleColor, fontStyle: 'bold'
        }).setOrigin(0.5));

        // 文物图标
        const iconKey = this.getArtifactIconKey(result.artifact);
        let nameY = py + 85;
        if (iconKey) {
            try {
                const img = this.add.image(this.config.width / 2, py + 75, iconKey).setDisplaySize(60, 60).setDepth(101);
                modal.add(img);
                nameY = py + 120;
            } catch (e) {
                console.error('[showAppraisalResult] 添加图标失败:', e);
            }
        }

        // 文物名称
        modal.add(this.add.text(this.config.width / 2, nameY, result.artifact.name, {
            fontSize: '26px', fontFamily: GameConfig.typography.fontFamily,
            color: '#f5e6d3'
        }).setOrigin(0.5));

        // 稀有度
        const rarityData = ArtifactData.rarity[result.artifact.rarity];
        const rarityY = this.textures.exists(iconKey) ? py + 150 : py + 120;
        modal.add(this.add.text(this.config.width / 2, rarityY,
            `[${rarityData.name}] ×${rarityData.multiplier}`, {
                fontSize: '17px', fontFamily: GameConfig.typography.fontFamily,
                color: rarityData.color
            }).setOrigin(0.5));

        // 品相
        const condY = rarityY + 30;
        if (isAuthentic) {
            const condData = ArtifactData.condition[condition];
            modal.add(this.add.text(this.config.width / 2, condY,
                `品相: ${condData.name} (×${condData.valueMult})`, {
                    fontSize: '15px', fontFamily: GameConfig.typography.fontFamily,
                    color: '#8b7355'
                }).setOrigin(0.5));
        }

        // 获得经费
        const valueY = condY + 50;
        if (result.value.greaterThan(new BigNumber(0))) {
            if (isAuthentic) {
                modal.add(this.add.text(this.config.width / 2, valueY,
                    `💰 获得经费: ¥${result.value.toString()}`, {
                        fontSize: '30px', fontFamily: GameConfig.typography.fontFamily,
                        color: '#f4d03f', fontStyle: 'bold'
                    }).setOrigin(0.5));
            } else {
                modal.add(this.add.text(this.config.width / 2, valueY,
                    `🔧 报销材料费: ¥${result.value.toString()}`, {
                        fontSize: '20px', fontFamily: GameConfig.typography.fontFamily,
                        color: '#8b7355'
                    }).setOrigin(0.5));
            }
        }

        // 描述
        const descY = valueY + 50;
        modal.add(this.add.text(this.config.width / 2, descY, result.artifact.description, {
            fontSize: '15px', fontFamily: GameConfig.typography.fontFamily,
            color: '#a08060', align: 'center',
            wordWrap: { width: pw - 60 }
        }).setOrigin(0.5));

        // 冷知识
        const funY = descY + 35;
        if (result.artifact.funFact) {
            modal.add(this.add.text(this.config.width / 2, funY,
                `💬 ${result.artifact.funFact}`, {
                    fontSize: '15px', fontFamily: GameConfig.typography.fontFamily,
                    color: '#8b7355', fontStyle: 'italic', align: 'center',
                    wordWrap: { width: pw - 60 }
                }).setOrigin(0.5));
        }

        // ── 国宝抉择 ──
        const choiceY = funY + 40;
        let modalClosed = false;
        const safeCloseModal = (callback) => {
            if (modalClosed) return;
            modalClosed = true;
            this.time.delayedCall(60, () => {
                if (modal && modal.active) modal.destroy();
                if (callback) this.time.delayedCall(10, callback);
            });
        };

        if (result.type === 'national_treasure') {
            modal.add(this.add.text(this.config.width / 2, choiceY, '🏛️ 国宝级文物，请做抉择:', {
                fontSize: '15px', fontFamily: GameConfig.typography.fontFamily,
                color: '#d4a574'
            }).setOrigin(0.5));

            const btnY = choiceY + 40;

            const handOverBtn = this.add.text(this.config.width / 2 - 110, btnY, `上交国家 (+${result.artifact.handOverReward || 400}JP)`, {
                fontSize: '17px', fontFamily: GameConfig.typography.fontFamily,
                color: '#f5e6d3', backgroundColor: '#27ae60',
                padding: { x: 18, y: 10 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            handOverBtn.on('pointerdown', () => {
                const jpReward = result.artifact.handOverReward || 400;
                this.economy.addPrestigePoints(jpReward);
                this.showToast(`感谢奉献！获得 ${jpReward} 基金点`);
                this.gameState.save();
                safeCloseModal(() => {
                    this.cameras.main.fadeOut(300, 26, 15, 10);
                    this.time.delayedCall(300, () => this.scene.start('MainScene'));
                });
            });

            const keepBtn = this.add.text(this.config.width / 2 + 110, btnY, '私人收藏 (5×拍卖)', {
                fontSize: '17px', fontFamily: GameConfig.typography.fontFamily,
                color: '#f5e6d3', backgroundColor: '#8b7355',
                padding: { x: 18, y: 10 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            keepBtn.on('pointerdown', () => {
                const bonus = result.value.multiply(5);
                this.economy.addFunds(bonus);
                this.showToast(`拍卖成功！额外获得 ¥${bonus.toString()}`);
                this.gameState.save();
                safeCloseModal(() => {
                    this.cameras.main.fadeOut(300, 26, 15, 10);
                    this.time.delayedCall(300, () => this.scene.start('MainScene'));
                });
            });

            modal.add(handOverBtn);
            modal.add(keepBtn);
        } else {
            const continueBtn = this.add.text(this.config.width / 2, py + 390, '继续游戏 →', {
                fontSize: '20px', fontFamily: GameConfig.typography.fontFamily,
                color: '#f5e6d3', backgroundColor: '#3d2817',
                padding: { x: 25, y: 10 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            continueBtn.on('pointerdown', () => {
                this.gameState.save();
                safeCloseModal(() => {
                    this.cameras.main.fadeOut(300, 26, 15, 10);
                    this.time.delayedCall(300, () => this.scene.start('MainScene'));
                });
            });
            modal.add(continueBtn);
        }
    }

    showToast(text) {
        const toast = this.add.text(this.config.width / 2, this.config.height / 2, text, {
            fontSize: '26px', fontFamily: GameConfig.typography.fontFamily,
            color: '#f5e6d3', backgroundColor: '#2c1810',
            padding: { x: 25, y: 12 }
        }).setOrigin(0.5).setDepth(200);

        this.tweens.add({
            targets: toast,
            alpha: 0, y: toast.y - 40,
            duration: 2000, ease: 'Power2',
            onComplete: () => toast.destroy()
        });
    }

    // ── 工具函数 ──
    /**
     * 预加载文物图标 — 在选定文物后立即调用
     */
    _preloadArtifactIcon(artifact) {
        if (!artifact) return;
        const idKey = 'artifact_' + artifact.id;
        if (this.textures.exists(idKey)) return;
        if (!this._loadingIcons) this._loadingIcons = new Set();
        if (this._loadingIcons.has(artifact.id)) return;
        this._loadingIcons.add(artifact.id);
        this.load.image(idKey, 'assets/artifacts/' + artifact.id + '.png');
        this.load.start();
    }

    /**
     * 获取文物图标的纹理 key，优先级：个体纹理 → 类型纹理 → null
     */
    getArtifactIconKey(artifact) {
        if (!artifact) return null;
        const idKey = 'artifact_' + artifact.id;
        if (this.textures.exists(idKey)) return idKey;
        return null;
    }

    lerpColor(c1, c2, t) {
        const r1 = (c1 >> 16) & 0xFF, g1 = (c1 >> 8) & 0xFF, b1 = c1 & 0xFF;
        const r2 = (c2 >> 16) & 0xFF, g2 = (c2 >> 8) & 0xFF, b2 = c2 & 0xFF;
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        return (r << 16) | (g << 8) | b;
    }

    get config() {
        return GameConfig;
    }
}

window.ExcavationScene = ExcavationScene;
