/**
 * 文物修复工坊 — Lv.4 解锁
 * 修复破损文物，修复度越高价值倍率越大（2x ~ 5x）
 */
class RepairWorkshopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RepairWorkshopScene' });
    }

    create() {
        try {
            this.state = window.gameState;
            this.economy = window.economyManager;
            this.audio = window.audioManager;

            if (!this.state || !this.economy) {
                console.error('RepairWorkshopScene: 管理器缺失，返回主界面');
                this.cameras.main.fadeOut(300, 26, 15, 10);
                this.time.delayedCall(300, () => this.scene.start('MainScene'));
                return;
            }

            this.cameras.main.fadeIn(400, 26, 15, 10);

            this.repairCracks = [];
            this.repairedCount = 0;
            this.totalCracks = 0;
            this.repairTime = 0;
            this.maxRepairTime = 20; // 20秒倒计时

            this.createBackground();
            this.createHeader();
            this.selectArtifact();
            this.createRepairArea();
            this.createTimer();
        } catch (e) {
            console.error('RepairWorkshopScene.create 错误:', e);
            this.cameras.main.fadeOut(300, 26, 15, 10);
            this.time.delayedCall(300, () => this.scene.start('MainScene'));
        }
    }

    createBackground() {
        const bg = this.add.graphics();
        bg.fillStyle(0x1a0f0a, 1);
        bg.fillRect(0, 0, this.config.width, this.config.height);

        const topBar = this.add.graphics();
        topBar.fillStyle(0x2c1810, 1);
        topBar.fillRect(0, 0, this.config.width, 60);
        topBar.lineStyle(2, 0xd4a574, 0.4);
        topBar.lineBetween(0, 60, this.config.width, 60);
    }

    createHeader() {
        const backBtn = this.add.text(20, 30, '← 返回', {
            fontSize: '17px', fontFamily: GameConfig.typography.fontFamily,
            color: '#d4a574', backgroundColor: '#3d2817',
            padding: { x: 12, y: 6 }
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
        backBtn.on('pointerdown', () => {
            if (this.audio) this.audio.click();
            this.cameras.main.fadeOut(300, 26, 15, 10);
            this.time.delayedCall(300, () => this.scene.start('MainScene'));
        });

        this.add.text(this.config.width / 2, 30, '🔧 文物修复工坊', {
            fontSize: '26px', fontFamily: GameConfig.typography.fontFamily,
            color: '#7fb3d5', fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    /** 从玩家已收集的文物中随机选一件 */
    selectArtifact() {
        const allArtifacts = [
            ...(ArtifactData.neolithic || []),
            ...(ArtifactData.shangzhou || []),
            ...(ArtifactData.qinhan || []),
            ...(ArtifactData.tang || []),
            ...(ArtifactData.songyuan || []),
            ...(ArtifactData.mingqing || [])
        ];

        const discovered = [];
        this.state.discoveredArtifactIds.forEach(id => {
            const a = allArtifacts.find(aa => aa.id === id);
            if (a) discovered.push(a);
        });

        if (discovered.length === 0) {
            // 没有收集任何文物 — 随机给一件虚拟文物
            this.repairArtifact = {
                name: '未知陶器碎片',
                baseValue: 500,
                rarity: 'common',
                era: this.state.currentEra,
                description: '出土不久的陶器碎片，等待修复'
            };
        } else {
            this.repairArtifact = discovered[
                Math.floor(Math.random() * discovered.length)
            ];
        }

        this.totalCracks = 4 + Math.floor(Math.random() * 5); // 4~8道裂缝
    }

    createRepairArea() {
        const cx = this.config.width / 2;
        const cy = this.config.height / 2 - 20;
        const ex = this.config.excavation;

        // 文物背景区域
        const repairBg = this.add.graphics();
        repairBg.fillStyle(0x2c1810, 1);
        repairBg.fillRoundedRect(cx - 250, cy - 180, 500, 360, 16);
        repairBg.lineStyle(3, 0x7fb3d5, 0.6);
        repairBg.strokeRoundedRect(cx - 250, cy - 180, 500, 360, 16);

        // 工件信息
        this.add.text(cx, cy - 155, this.repairArtifact.name, {
            fontSize: '24px', fontFamily: GameConfig.typography.fontFamily,
            color: '#f5e6d3', fontStyle: 'bold'
        }).setOrigin(0.5);

        const rarityData = ArtifactData.rarity[this.repairArtifact.rarity];
        this.add.text(cx, cy - 120, `[${rarityData.name}] 基础价值 ×${rarityData.multiplier}`, {
            fontSize: '15px', fontFamily: GameConfig.typography.fontFamily,
            color: rarityData.color
        }).setOrigin(0.5);

        // 文物轮廓
        const vaseG = this.add.graphics();
        vaseG.fillStyle(0x8B6914, 0.25);
        vaseG.fillRoundedRect(cx - 90, cy - 75, 180, 180, 20);
        vaseG.fillStyle(0x9B7928, 0.15);
        vaseG.fillRoundedRect(cx - 70, cy - 55, 140, 140, 14);
        vaseG.lineStyle(3, 0x6B4F2A, 0.5);
        vaseG.strokeRoundedRect(cx - 90, cy - 75, 180, 180, 20);
        vaseG.fillStyle(0x8B6914, 0.3);
        vaseG.fillRoundedRect(cx - 25, cy - 95, 50, 28, 6);
        vaseG.lineStyle(2, 0x6B4F2A, 0.5);
        vaseG.strokeRoundedRect(cx - 25, cy - 95, 50, 28, 6);

        // 生成裂缝
        this.repairCrackGfx = [];
        this.repairIndicators = [];

        for (let i = 0; i < this.totalCracks; i++) {
            const angle = ((i / this.totalCracks) * 360 + Math.random() * 40) * Math.PI / 180;
            const dist = 40 + Math.random() * 55;
            const crackX = cx + Math.cos(angle) * dist;
            const crackY = cy + Math.sin(angle) * dist;

            const crack = { x: crackX, y: crackY, repaired: false, id: i };
            this.repairCracks.push(crack);

            // 裂缝线
            const g = this.add.graphics().setDepth(10);
            g.lineStyle(2, 0x4A3020, 0.8);
            const len = 20 + Math.random() * 25;
            g.beginPath();
            g.moveTo(crackX - Math.cos(angle) * len * 0.5, crackY - Math.sin(angle) * len * 0.5);
            g.lineTo(crackX, crackY);
            g.lineTo(crackX + Math.cos(angle + 0.5) * len * 0.5, crackY + Math.sin(angle + 0.5) * len * 0.5);
            g.strokePath();
            this.repairCrackGfx.push(g);

            // 裂缝标记
            const mk = this.add.text(crackX, crackY, '🔴', {
                fontSize: '24px'
            }).setOrigin(0.5).setDepth(15).setInteractive({ useHandCursor: true });

            mk.on('pointerdown', () => this.fixCrack(crack, g, mk));
            mk.on('pointerover', () => mk.setScale(1.3));
            mk.on('pointerout', () => mk.setScale(1.0));

            this.repairIndicators.push(mk);
        }

        // 修复进度
        this.repairText = this.add.text(cx, cy + 120,
            `修复进度: 0/${this.totalCracks}`, {
            fontSize: '20px', fontFamily: GameConfig.typography.fontFamily,
            color: '#d4a574', fontStyle: 'bold'
        }).setOrigin(0.5);

        // 完成按钮（初始隐藏）
        this.finishBtn = this.add.text(cx, cy + 155, '✅ 完成修复', {
            fontSize: '20px', fontFamily: GameConfig.typography.fontFamily,
            color: '#f5e6d3', backgroundColor: '#27ae60',
            padding: { x: 25, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(false);
        this.addButtonEffects(this.finishBtn);
        this.finishBtn.on('pointerdown', () => this.finishRepair());
    }

    createTimer() {
        const cx = this.config.width / 2;
        const cy = this.config.height / 2 - 20;

        this.timerText = this.add.text(cx, cy + 175,
            `⏱ 剩余: ${this.maxRepairTime}s`, {
            fontSize: '17px', fontFamily: GameConfig.typography.fontFamily,
            color: '#8b7355'
        }).setOrigin(0.5);

        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.repairTime++;
                const remaining = this.maxRepairTime - this.repairTime;
                this.timerText.setText(`⏱ 剩余: ${remaining}s`);
                if (remaining <= 5) {
                    this.timerText.setColor('#e74c3c');
                }
                if (this.repairTime >= this.maxRepairTime) {
                    this.timeUp();
                }
            },
            loop: true
        });
    }

    fixCrack(crack, gfx, marker) {
        if (crack.repaired || this.repairTime >= this.maxRepairTime) return;
        crack.repaired = true;
        this.repairedCount++;
        if (this.audio) this.audio.click();

        // 视觉效果
        gfx.clear();
        gfx.fillStyle(0x27ae60, 0.6);
        gfx.fillCircle(crack.x, crack.y, 12);
        gfx.fillStyle(0x2ecc71, 0.4);
        gfx.fillCircle(crack.x, crack.y, 18);

        marker.setText('✅').setStyle({ fontSize: '18px' });
        marker.removeInteractive();

        // 粒子
        for (let i = 0; i < 5; i++) {
            const p = this.add.text(
                crack.x + (Math.random() - 0.5) * 20,
                crack.y + (Math.random() - 0.5) * 15,
                '✦', { fontSize: '12px', color: '#27ae60' }
            ).setOrigin(0.5).setDepth(20);
            this.tweens.add({
                targets: p, alpha: 0, y: p.y - 20,
                duration: 500, ease: 'Power2',
                onComplete: () => p.destroy()
            });
        }

        this.repairText.setText(`修复进度: ${this.repairedCount}/${this.totalCracks}`);

        if (this.repairedCount >= this.totalCracks) {
            this.finishBtn.setVisible(true);
            this.repairText.setColor('#27ae60');
            this.timerText.setVisible(false);
            if (this.timerEvent) this.timerEvent.remove();
        }
    }

    timeUp() {
        if (this.timerEvent) this.timerEvent.remove();
        // 自动完成修复
        this.finishBtn.setVisible(true);
        if (this.repairText) this.repairText.setText(`时间到！修复了 ${this.repairedCount}/${this.totalCracks} 道裂缝`);
        if (this.repairText) this.repairText.setColor('#f39c12');
    }

    finishRepair() {
        const ratio = Math.min(1, this.repairedCount / this.totalCracks);
        // 修复倍率: 2x ~ 5x
        const multiplier = 2 + ratio * 3;

        const baseValue = new BigNumber(this.repairArtifact.baseValue);
        const rarityData = ArtifactData.rarity[this.repairArtifact.rarity];
        const repairValue = baseValue.multiply(rarityData.multiplier).multiply(multiplier);
        this.economy.addFunds(repairValue);

        if (this.audio) this.audio.discover('rare');

        this.showResult(multiplier, repairValue, ratio);
    }

    showResult(multiplier, repairValue, ratio) {
        const modal = this.add.container(0, 0).setDepth(100);

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, this.config.width, this.config.height);
        overlay.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, this.config.width, this.config.height),
            Phaser.Geom.Rectangle.Contains
        );
        modal.add(overlay);

        const pw = 420, ph = 320;
        const px = (this.config.width - pw) / 2;
        const py = (this.config.height - ph) / 2;

        const panel = this.add.graphics();
        panel.fillStyle(0x2c1810, 1);
        panel.fillRoundedRect(px, py, pw, ph, 16);
        panel.lineStyle(3, 0x7fb3d5, 1);
        panel.strokeRoundedRect(px, py, pw, ph, 16);
        modal.add(panel);

        const cx = this.config.width / 2;
        const grade = ratio >= 1 ? '🏆 完美修复！' :
            ratio >= 0.7 ? '👍 良好修复' :
            ratio >= 0.4 ? '🔧 基础修复' : '💔 粗糙修复';

        modal.add(this.add.text(cx, py + 40, grade, {
            fontSize: '30px', fontFamily: GameConfig.typography.fontFamily,
            color: ratio >= 1 ? '#f4d03f' : '#d4a574', fontStyle: 'bold'
        }).setOrigin(0.5));

        modal.add(this.add.text(cx, py + 90, this.repairArtifact.name, {
            fontSize: '22px', fontFamily: GameConfig.typography.fontFamily,
            color: '#f5e6d3'
        }).setOrigin(0.5));

        modal.add(this.add.text(cx, py + 140, `修复倍率: ×${multiplier.toFixed(1)}`, {
            fontSize: '20px', fontFamily: GameConfig.typography.fontFamily,
            color: '#7fb3d5'
        }).setOrigin(0.5));

        modal.add(this.add.text(cx, py + 180,
            `💰 获得经费: ¥${repairValue.toString()}`, {
            fontSize: '26px', fontFamily: GameConfig.typography.fontFamily,
            color: '#f4d03f', fontStyle: 'bold'
        }).setOrigin(0.5));

        const continueBtn = this.add.text(cx, py + 250, '继续游戏', {
            fontSize: '17px', fontFamily: GameConfig.typography.fontFamily,
            color: '#f5e6d3', backgroundColor: '#3d2817',
            padding: { x: 25, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.addButtonEffects(continueBtn);
        continueBtn.on('pointerdown', () => {
            this.state.save();
            this.cameras.main.fadeOut(300, 26, 15, 10);
            this.time.delayedCall(300, () => this.scene.start('MainScene'));
        });
        modal.add(continueBtn);

        this.cameras.main.flash(300, 100, 200, 50);
    }

    /** 给按钮添加 hover/按压效果 */
    addButtonEffects(btn, scale = 1.05) {
        if (!btn) return;
        btn.on('pointerover', () => {
            if (btn.input && btn.input.enabled) {
                this.tweens.add({ targets: btn, scaleX: scale, scaleY: scale, duration: 80 });
            }
        });
        btn.on('pointerout', () => {
            this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 120 });
        });
        btn.on('pointerdown', () => {
            if (btn.input && btn.input.enabled) {
                this.tweens.add({ targets: btn, scaleX: 0.95, scaleY: 0.95, duration: 40 });
            }
        });
        btn.on('pointerup', () => {
            this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 80 });
        });
    }

    get config() {
        return GameConfig;
    }
}

window.RepairWorkshopScene = RepairWorkshopScene;
