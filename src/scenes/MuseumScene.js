/**
 * 博物馆场景 - 文物图鉴
 */
class MuseumScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MuseumScene' });
        this.currentPage = 0;
        this.itemsPerPage = 8;
    }

    create() {
        this.state = window.gameState;
        this.collectedArtifacts = this.getCollectedArtifacts();

        this.createBackground();
        this.createUI();
        this.displayPage(0);
    }

    createBackground() {
        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(0x1a0f0a, 1);
        bg.fillRect(0, 0, this.config.width, this.config.height);

        // 顶部栏
        const topBar = this.add.graphics();
        topBar.fillStyle(0x2c1810, 1);
        topBar.fillRect(0, 0, this.config.width, 60);
    }

    createUI() {
        // 返回按钮
        const backBtn = this.add.text(20, 30, '← 返回', {
            fontSize: '16px',
            fontFamily: 'Microsoft YaHei',
            color: '#d4a574',
            backgroundColor: '#3d2817',
            padding: { x: 12, y: 6 }
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerdown', () => {
            this.scene.start('MainScene');
        });

        // 标题
        this.add.text(this.config.width/2, 30, '🏛️ 文物图鉴', {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            color: '#f5e6d3',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 统计
        const total = this.getTotalArtifacts();
        this.add.text(this.config.width - 30, 30, `已收集: ${this.collectedArtifacts.length}/${total}`, {
            fontSize: '16px',
            fontFamily: 'Microsoft YaHei',
            color: '#8b7355'
        }).setOrigin(1, 0.5);

        // 分页按钮
        this.prevBtn = this.add.text(100, this.config.height - 40, '◀ 上一页', {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            color: '#d4a574',
            backgroundColor: '#3d2817',
            padding: { x: 12, y: 6 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.prevBtn.on('pointerdown', () => {
            if (this.currentPage > 0) {
                this.displayPage(this.currentPage - 1);
            }
        });

        this.nextBtn = this.add.text(this.config.width - 100, this.config.height - 40, '下一页 ▶', {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            color: '#d4a574',
            backgroundColor: '#3d2817',
            padding: { x: 12, y: 6 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.nextBtn.on('pointerdown', () => {
            const totalPages = Math.ceil(this.collectedArtifacts.length / this.itemsPerPage);
            if (this.currentPage < totalPages - 1) {
                this.displayPage(this.currentPage + 1);
            }
        });

        // 页码显示
        this.pageText = this.add.text(this.config.width/2, this.config.height - 40, '', {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            color: '#8b7355'
        }).setOrigin(0.5);
    }

    displayPage(page) {
        this.currentPage = page;

        // 清除之前的物品
        if (this.itemContainers) {
            this.itemContainers.forEach(c => c.destroy());
        }
        this.itemContainers = [];

        const startIdx = page * this.itemsPerPage;
        const endIdx = Math.min(startIdx + this.itemsPerPage, this.collectedArtifacts.length);
        const pageItems = this.collectedArtifacts.slice(startIdx, endIdx);

        // 布局
        const cols = 4;
        const rows = 2;
        const startX = 100;
        const startY = 100;
        const itemWidth = 250;
        const itemHeight = 150;
        const gapX = 20;
        const gapY = 20;

        pageItems.forEach((artifact, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const x = startX + col * (itemWidth + gapX);
            const y = startY + row * (itemHeight + gapY);

            const container = this.createArtifactCard(x, y, artifact);
            this.itemContainers.push(container);
        });

        // 更新页码
        const totalPages = Math.ceil(this.collectedArtifacts.length / this.itemsPerPage);
        if (totalPages > 0) {
            this.pageText.setText(`第 ${page + 1} / ${totalPages} 页`);
        } else {
            this.pageText.setText('暂无收藏');
        }

        // 更新按钮状态
        this.prevBtn.setAlpha(page > 0 ? 1 : 0.5);
        this.nextBtn.setAlpha(page < totalPages - 1 ? 1 : 0.5);
    }

    createArtifactCard(x, y, artifact) {
        const container = this.add.container(x, y);

        // 卡片背景
        const bg = this.add.graphics();
        const rarityData = ArtifactData.rarity[artifact.rarity];
        const borderColor = parseInt(rarityData.color.replace('#', '0x'));

        bg.fillStyle(0x2c1810, 1);
        bg.fillRoundedRect(0, 0, 240, 140, 10);
        bg.lineStyle(2, borderColor, 0.7);
        bg.strokeRoundedRect(0, 0, 240, 140, 10);
        container.add(bg);

        // 稀有度标签
        const tagBg = this.add.graphics();
        tagBg.fillStyle(borderColor, 1);
        tagBg.fillRoundedRect(10, 10, 60, 20, 4);
        container.add(tagBg);

        container.add(this.add.text(40, 20, rarityData.name, {
            fontSize: '11px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff'
        }).setOrigin(0.5));

        // 文物名称
        container.add(this.add.text(120, 45, artifact.name, {
            fontSize: '16px',
            fontFamily: 'Microsoft YaHei',
            color: '#f5e6d3',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0));

        // 时代
        const eraName = EraData[artifact.era] ? EraData[artifact.era].name : artifact.era;
        container.add(this.add.text(15, 75, `时代: ${eraName}`, {
            fontSize: '12px',
            fontFamily: 'Microsoft YaHei',
            color: '#8b7355'
        }));

        // 基础价值
        container.add(this.add.text(15, 100, `价值: ¥${new BigNumber(artifact.baseValue).toString()}`, {
            fontSize: '12px',
            fontFamily: 'Microsoft YaHei',
            color: '#f4d03f'
        }));

        // 国宝标记
        if (artifact.isNationalTreasure) {
            container.add(this.add.text(180, 115, '🎊 国宝', {
                fontSize: '14px',
                fontFamily: 'Microsoft YaHei',
                color: '#f4d03f'
            }));
        }

        // 点击显示详情
        container.setSize(240, 140);
        container.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.showArtifactDetail(artifact));

        return container;
    }

    showArtifactDetail(artifact) {
        const modal = this.add.container(0, 0).setDepth(100);

        // 背景
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, this.config.width, this.config.height);
        modal.add(overlay);

        // 面板
        const pw = 500;
        const ph = 450;
        const px = (this.config.width - pw) / 2;
        const py = (this.config.height - ph) / 2;

        const panel = this.add.graphics();
        panel.fillStyle(0x2c1810, 1);
        panel.fillRoundedRect(px, py, pw, ph, 16);
        panel.lineStyle(3, 0xd4a574, 0.8);
        panel.strokeRoundedRect(px, py, pw, ph, 16);
        modal.add(panel);

        // 稀有度
        const rarityData = ArtifactData.rarity[artifact.rarity];
        modal.add(this.add.text(this.config.width/2, py + 30, `[${rarityData.name}]`, {
            fontSize: '18px',
            fontFamily: 'Microsoft YaHei',
            color: rarityData.color
        }).setOrigin(0.5));

        // 名称
        modal.add(this.add.text(this.config.width/2, py + 65, artifact.name, {
            fontSize: '26px',
            fontFamily: 'Microsoft YaHei',
            color: '#f5e6d3',
            fontStyle: 'bold'
        }).setOrigin(0.5));

        // 国宝标记
        if (artifact.isNationalTreasure) {
            modal.add(this.add.text(this.config.width/2, py + 100, '🎊 国宝级文物', {
                fontSize: '20px',
                fontFamily: 'Microsoft YaHei',
                color: '#f4d03f'
            }).setOrigin(0.5));
        }

        // 描述
        modal.add(this.add.text(this.config.width/2, py + 150, artifact.description, {
            fontSize: '15px',
            fontFamily: 'Microsoft YaHei',
            color: '#a08060',
            align: 'center',
            wordWrap: { width: pw - 60 }
        }).setOrigin(0.5));

        // 趣味知识
        if (artifact.funFact) {
            modal.add(this.add.text(this.config.width/2, py + 230, '💡 ' + artifact.funFact, {
                fontSize: '13px',
                fontFamily: 'Microsoft YaHei',
                color: '#8b7355',
                align: 'center',
                wordWrap: { width: pw - 60 }
            }).setOrigin(0.5));
        }

        // 数值信息
        const infoY = py + 300;
        const eraName = EraData[artifact.era] ? EraData[artifact.era].name : artifact.era;

        modal.add(this.add.text(this.config.width/2 - 80, infoY, [
            `时代: ${eraName}`,
            `类型: ${artifact.type}`,
            `基础真品率: ${Math.round(artifact.authenticity * 100)}%`
        ].join('\n'), {
            fontSize: '13px',
            fontFamily: 'Microsoft YaHei',
            color: '#8b7355',
            lineSpacing: 8
        }).setOrigin(0.5));

        modal.add(this.add.text(this.config.width/2 + 80, infoY, [
            `稀有度: ×${rarityData.multiplier}`,
            `基础价值: ¥${new BigNumber(artifact.baseValue).toString()}`,
            artifact.handOverReward ? `上交奖励: ${artifact.handOverReward} JP` : ''
        ].join('\n'), {
            fontSize: '13px',
            fontFamily: 'Microsoft YaHei',
            color: '#8b7355',
            lineSpacing: 8
        }).setOrigin(0.5));

        // 关闭按钮
        const closeBtn = this.add.text(this.config.width/2, py + ph - 35, '关闭', {
            fontSize: '16px',
            fontFamily: 'Microsoft YaHei',
            color: '#f5e6d3',
            backgroundColor: '#3d2817',
            padding: { x: 25, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', () => modal.destroy());
        modal.add(closeBtn);
    }

    getCollectedArtifacts() {
        const collected = [];

        // 收集已发现的文物
        const allArtifacts = [
            ...ArtifactData.neolithic,
            ...ArtifactData.shangzhou
        ];

        this.state.discoveredArtifactIds.forEach(id => {
            const artifact = allArtifacts.find(a => a.id === id);
            if (artifact) {
                collected.push(artifact);
            }
        });

        return collected;
    }

    getTotalArtifacts() {
        return ArtifactData.neolithic.length + ArtifactData.shangzhou.length;
    }

    get config() {
        return GameConfig;
    }
}

window.MuseumScene = MuseumScene;
