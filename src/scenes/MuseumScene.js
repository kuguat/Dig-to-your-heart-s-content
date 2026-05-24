/**
 * 博物馆场景 - 文物图鉴
 */
class MuseumScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MuseumScene' });
        this.currentPage = 0;
        this.itemsPerPage = 12;
        this.currentRarityFilter = 'all';
    }

    create() {
        try {
            this.state = window.gameState;
            this.audio = window.audioManager;

            if (!this.state) {
                console.error('MuseumScene: 状态缺失，返回主界面');
                this.cameras.main.fadeOut(300, 26, 15, 10);
                this.time.delayedCall(300, () => this.scene.start('MainScene'));
                return;
            }

            this.collectedArtifacts = this.getCollectedArtifacts();

            this.cameras.main.fadeIn(400, 26, 15, 10);

            this.createBackground();
            this.createUI();
            this.createFilterTabs();
            this.displayPage(0);
        } catch (e) {
            console.error('MuseumScene.create 错误:', e);
            this.cameras.main.fadeOut(300, 26, 15, 10);
            this.time.delayedCall(300, () => this.scene.start('MainScene'));
        }
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
        // 返回按钮（depth=50 确保不会被卡片遮住点击区域）
        const backBtn = this.add.text(20, 30, '← 返回', {
            fontSize: '17px',
            fontFamily: GameConfig.typography.fontFamily,
            color: '#d4a574',
            backgroundColor: '#3d2817',
            padding: { x: 12, y: 6 }
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setDepth(50);

        backBtn.on('pointerdown', () => {
            if (this.audio) this.audio.click();
            this.cameras.main.fadeOut(300, 26, 15, 10);
            this.time.delayedCall(300, () => this.scene.start('MainScene'));
        });

        // 标题
        this.add.text(this.config.width/2, 30, '🏛️ 文物图鉴', {
            fontSize: '26px',
            fontFamily: GameConfig.typography.fontFamily,
            color: '#f5e6d3',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 统计
        const total = this.getTotalArtifacts();
        this.statText = this.add.text(this.config.width - 30, 30, `已收集: ${this.collectedArtifacts.length}/${total}`, {
            fontSize: '17px',
            fontFamily: GameConfig.typography.fontFamily,
            color: '#8b7355'
        }).setOrigin(1, 0.5);

        // ── 收藏家套装奖励 ──
        this.createSetBonusPanel();

        // 分页按钮
        this.prevBtn = this.add.text(100, this.config.height - 40, '◀ 上一页', {
            fontSize: '15px',
            fontFamily: GameConfig.typography.fontFamily,
            color: '#d4a574',
            backgroundColor: '#3d2817',
            padding: { x: 12, y: 6 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(50);

        this.prevBtn.on('pointerdown', () => {
            if (this.currentPage > 0) {
                this.displayPage(this.currentPage - 1);
            }
        });

        this.nextBtn = this.add.text(this.config.width - 100, this.config.height - 40, '下一页 ▶', {
            fontSize: '15px',
            fontFamily: GameConfig.typography.fontFamily,
            color: '#d4a574',
            backgroundColor: '#3d2817',
            padding: { x: 12, y: 6 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(50);

        this.nextBtn.on('pointerdown', () => {
            const list = this.getFilteredArtifacts();
            const pp = (this.state.prestigeLevel >= 2) ? 9 : 12;
            const totalPages = Math.ceil(list.length / pp);
            if (this.currentPage < totalPages - 1) {
                this.displayPage(this.currentPage + 1);
            }
        });

        // 页码显示
        this.pageText = this.add.text(this.config.width/2, this.config.height - 40, '', {
            fontSize: '15px',
            fontFamily: GameConfig.typography.fontFamily,
            color: '#8b7355'
        }).setOrigin(0.5);

        // 筛选提示
        this.filterHint = this.add.text(this.config.width/2, this.config.height - 60, '', {
            fontSize: '15px',
            fontFamily: GameConfig.typography.fontFamily,
            color: '#d4a574'
        }).setOrigin(0.5);
    }

    /**
     * 创建稀有度筛选标签栏 — 直接添加到场景（避免 Phaser 3 嵌套 Container 的输入坐标 bug）
     */
    createFilterTabs() {
        this.filterTabs = [];

        const rarityOrder = ['all', 'mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
        const tabWidth = 96;
        const tabHeight = 30;
        const gap = 8;
        const totalWidth = rarityOrder.length * tabWidth + (rarityOrder.length - 1) * gap;
        const startX = (this.config.width - totalWidth) / 2;
        const tabY = 70;

        // 统计各稀有度的文物数量
        const counts = {};
        counts['all'] = this.collectedArtifacts.length;
        rarityOrder.slice(1).forEach(r => {
            counts[r] = this.collectedArtifacts.filter(a => a.rarity === r).length;
        });

        rarityOrder.forEach((rarity, i) => {
            const x = startX + i * (tabWidth + gap);
            const isActive = this.currentRarityFilter === rarity;

            const rarityData = rarity === 'all'
                ? { name: '全部', color: '#d4a574' }
                : ArtifactData.rarity[rarity];
            const color = parseInt(rarityData.color.replace('#', '0x'));

            // 使用 Zone 作为独立 HitBox（避免 Container.setInteractive 的坐标偏移）
            const hitZone = this.add.zone(x + tabWidth / 2, tabY + tabHeight / 2, tabWidth, tabHeight)
                .setInteractive({ useHandCursor: true })
                .setDepth(15);

            // 背景（独立 Graphics，不在 Container 内）
            const bg = this.add.graphics().setDepth(10);
            this._drawTabBg(bg, tabWidth, tabHeight, isActive, color);
            bg.setPosition(x, tabY);

            // 名称
            const nameText = this.add.text(x + tabWidth / 2, tabY + 8, rarityData.name, {
                fontSize: '15px',
                fontFamily: GameConfig.typography.fontFamily,
                color: isActive ? rarityData.color : '#8b7355',
                fontStyle: isActive ? 'bold' : 'normal'
            }).setOrigin(0.5).setDepth(15);

            // 数量
            const countLabel = rarity === 'all' ? `(${counts[rarity]})` : `×${counts[rarity]}`;
            const countText = this.add.text(x + tabWidth / 2, tabY + 23, countLabel, {
                fontSize: '12px',
                fontFamily: GameConfig.typography.fontFamily,
                color: isActive ? rarityData.color : '#6b5b4a'
            }).setOrigin(0.5).setDepth(15);

            // 点击事件 — 绑在 Zone 上
            hitZone.on('pointerdown', () => {
                if (this.currentRarityFilter !== rarity) {
                    if (this.audio) this.audio.click();
                    this.currentRarityFilter = rarity;
                    this._refreshTabStyles();
                    this.refreshFilterDisplay();
                }
            });

            this.filterTabs.push({ hitZone, bg, nameText, countText, rarity, rarityData, x, tabY, counts });
        });
    }

    /** 绘制单个标签背景 */
    _drawTabBg(graphics, w, h, isActive, color) {
        graphics.clear();
        if (isActive) {
            graphics.fillStyle(color, 0.3);
            graphics.fillRoundedRect(0, 0, w, h, 6);
            graphics.lineStyle(2, color, 1);
            graphics.strokeRoundedRect(0, 0, w, h, 6);
        } else {
            graphics.fillStyle(0x1f1208, 1);
            graphics.fillRoundedRect(0, 0, w, h, 6);
            graphics.lineStyle(1, color, 0.35);
            graphics.strokeRoundedRect(0, 0, w, h, 6);
        }
    }

    /** 原位刷新标签样式（不再使用 Container，直接更新 Graphics 和 Text） */
    _refreshTabStyles() {
        this.filterTabs.forEach(tab => {
            const isActive = this.currentRarityFilter === tab.rarity;
            const color = parseInt(tab.rarityData.color.replace('#', '0x'));

            // 重绘背景
            tab.bg.clear();
            tab.bg.setPosition(tab.x, tab.tabY);
            this._drawTabBg(tab.bg, 96, 30, isActive, color);

            tab.nameText.setStyle({
                color: isActive ? tab.rarityData.color : '#8b7355',
                fontStyle: isActive ? 'bold' : 'normal'
            });
            tab.countText.setStyle({
                color: isActive ? tab.rarityData.color : '#6b5b4a'
            });
        });
    }

    /**
     * 根据当前筛选条件获取文物列表
     */
    getFilteredArtifacts() {
        if (this.currentRarityFilter === 'all') {
            return this.collectedArtifacts;
        }
        return this.collectedArtifacts.filter(a => a.rarity === this.currentRarityFilter);
    }

    /**
     * 刷新筛选标签和显示 — 标签样式已在 _refreshTabStyles 中更新
     */
    refreshFilterDisplay() {
        // 更新筛选提示
        if (this.currentRarityFilter !== 'all') {
            const rData = ArtifactData.rarity[this.currentRarityFilter];
            this.filterHint.setText(`当前筛选: ${rData.name}级文物 · 倍率 ×${rData.multiplier}`).setVisible(true);
        } else {
            this.filterHint.setVisible(false);
        }

        // 重置分页并显示
        this.displayPage(0);
    }

    displayPage(page) {
        this.currentPage = page;

        // 清除之前的物品（确保彻底销毁，包括独立 hitZone）
        if (this.itemContainers) {
            this.itemContainers.forEach(c => {
                if (c && c._hitZone) { c._hitZone.destroy(); c._hitZone = null; }
                if (c && c.active) c.destroy();
            });
        }
        this.itemContainers = [];

        const hasPanel = this.state.prestigeLevel >= 2;
        const itemsPerPage = hasPanel ? 9 : 12;

        const list = this.getFilteredArtifacts();
        const startIdx = page * itemsPerPage;
        const endIdx = Math.min(startIdx + itemsPerPage, list.length);
        const pageItems = list.slice(startIdx, endIdx);

        // 布局：有收藏家面板时 3列 × 3行(9件/页)，否则 4列 × 3行(12件/页)
        const cols = hasPanel ? 3 : 4;
        const startX = hasPanel ? 310 : 100;
        const startY = 125;
        const itemWidth = 250;
        const itemHeight = 160;
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
        const totalPages = Math.ceil(list.length / itemsPerPage);
        if (totalPages > 0) {
            const filterLabel = this.currentRarityFilter !== 'all'
                ? ` (${list.length}件)`
                : '';
            this.pageText.setText(`第 ${page + 1} / ${totalPages} 页${filterLabel}`);
        } else {
            this.pageText.setText('暂无该等级文物');
        }

        // 更新按钮状态
        this.prevBtn.setAlpha(page > 0 ? 1 : 0.5);
        this.nextBtn.setAlpha(page < totalPages - 1 ? 1 : 0.5);
    }

    createArtifactCard(x, y, artifact) {
        const container = this.add.container(x, y).setDepth(5);

        // 卡片背景
        const bg = this.add.graphics();
        const rarityData = ArtifactData.rarity[artifact.rarity];
        const borderColor = parseInt(rarityData.color.replace('#', '0x'));

        bg.fillStyle(0x2c1810, 1);
        bg.fillRoundedRect(0, 0, 240, 145, 10);
        bg.lineStyle(2, borderColor, 0.7);
        bg.strokeRoundedRect(0, 0, 240, 145, 10);
        container.add(bg);

        // 稀有度标签
        const tagBg = this.add.graphics();
        tagBg.fillStyle(borderColor, 1);
        tagBg.fillRoundedRect(10, 10, 60, 20, 4);
        container.add(tagBg);

        container.add(this.add.text(40, 20, rarityData.name, {
            fontSize: '12px',
            fontFamily: GameConfig.typography.fontFamily,
            color: '#ffffff'
        }).setOrigin(0.5));

        // 文物名称 (左对齐，限制宽度避免与右侧图标重叠)
        const iconKey = this.getArtifactIconKey(artifact);
        const nameMaxW = iconKey ? 130 : 210;
        container.add(this.add.text(15, 42, artifact.name, {
            fontSize: '17px',
            fontFamily: GameConfig.typography.fontFamily,
            color: '#f5e6d3',
            fontStyle: 'bold',
            wordWrap: { width: nameMaxW }
        }));

        // 时代
        const eraName = EraData[artifact.era] ? EraData[artifact.era].name : artifact.era;
        container.add(this.add.text(15, 75, `时代: ${eraName}`, {
            fontSize: '15px',
            fontFamily: GameConfig.typography.fontFamily,
            color: '#8b7355'
        }));

        // 基础价值
        container.add(this.add.text(15, 100, `价值: ¥${new BigNumber(artifact.baseValue).toString()}`, {
            fontSize: '15px',
            fontFamily: GameConfig.typography.fontFamily,
            color: '#f4d03f'
        }));

        // 文物图标 (优先个体纹理→类型纹理)
        if (iconKey) {
            const icon = this.add.image(198, 82, iconKey).setDisplaySize(54, 54).setOrigin(0.5);
            container.add(icon);
        }

        // 国宝标记
        if (artifact.isNationalTreasure) {
            container.add(this.add.text(175, 118, '🎊 国宝', {
                fontSize: '15px',
                fontFamily: GameConfig.typography.fontFamily,
                color: '#f4d03f'
            }));
        }

        // 点击显示详情 — 在场景中创建独立 Zone（不放入 Container，避免坐标嵌套）
        const hitZone = this.add.zone(x + 120, y + 72.5, 240, 145)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(6);
        hitZone.on('pointerdown', () => {
            if (!this._modalOpen) this.showArtifactDetail(artifact);
        });
        // 记录到容器引用中，供销毁时清理
        container._hitZone = hitZone;

        return container;
    }

    showArtifactDetail(artifact) {
        // 防止重复打开
        if (this._modalOpen) return;
        this._modalOpen = true;
        this._modalJustOpened = true;

        const modal = this.add.container(0, 0).setDepth(200);

        // 关闭模态的统一入口（防止点击穿透/重复关闭）
        let _closing = false;
        const closeModal = () => {
            // 防止刚打开就被同一组 pointer 事件误关闭
            if (this._modalJustOpened) return;
            if (_closing) return;
            if (!this._modalOpen) return;
            _closing = true;
            this._modalOpen = false;
            // 立即禁用遮罩交互，防止后续事件穿透
            if (overlay && overlay.input) overlay.disableInteractive();
            // 延迟销毁确保事件消费完毕
            this.time.delayedCall(100, () => {
                if (modal && modal.active) modal.destroy();
            });
        };

        // 遮罩背景 — 全屏 Graphics 捕获所有点击
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, this.config.width, this.config.height);
        overlay.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, this.config.width, this.config.height),
            Phaser.Geom.Rectangle.Contains
        );
        overlay.on('pointerdown', closeModal);
        overlay.on('pointerup', closeModal);
        modal.add(overlay);

        // 延迟清除"刚打开"标记，防止同组 pointer 事件误触关闭
        this.time.delayedCall(350, () => {
            this._modalJustOpened = false;
        });

        // 面板 — 国宝/传说级需要更高以容纳额外标记
        const hasMarker = artifact.isNationalTreasure || artifact.isMythic;
        const pw = 500;
        const ph = hasMarker ? 520 : 450;
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
            fontSize: '20px',
            fontFamily: GameConfig.typography.fontFamily,
            color: rarityData.color
        }).setOrigin(0.5));

        // 名称
        modal.add(this.add.text(this.config.width/2, py + 65, artifact.name, {
            fontSize: '30px',
            fontFamily: GameConfig.typography.fontFamily,
            color: '#f5e6d3',
            fontStyle: 'bold'
        }).setOrigin(0.5));

        // 国宝/传说标记 — 会使后续内容整体下移
        let markerOffset = 0;
        if (hasMarker) {
            const markerText = artifact.isMythic ? '🔥 传说级文物' : '🎊 国宝级文物';
            const markerColor = artifact.isMythic ? '#e74c3c' : '#f4d03f';
            modal.add(this.add.text(this.config.width/2, py + 100, markerText, {
                fontSize: '26px',
                fontFamily: GameConfig.typography.fontFamily,
                color: markerColor
            }).setOrigin(0.5));
            markerOffset = 40;
        }

        // 文物大图
        const iconKey = this.getArtifactIconKey(artifact);
        let descY = py + 150 + markerOffset;
        if (iconKey) {
            modal.add(this.add.image(this.config.width/2, py + 125 + markerOffset, iconKey).setDisplaySize(80, 80));
            descY = py + 190 + markerOffset;
        }

        // 描述
        modal.add(this.add.text(this.config.width/2, descY, artifact.description, {
            fontSize: '17px',
            fontFamily: GameConfig.typography.fontFamily,
            color: '#a08060',
            align: 'center',
            wordWrap: { width: pw - 60 }
        }).setOrigin(0.5));

        // 趣味知识
        const funFactY = descY + 60;
        if (artifact.funFact) {
            modal.add(this.add.text(this.config.width/2, funFactY, '💡 ' + artifact.funFact, {
                fontSize: '15px',
                fontFamily: GameConfig.typography.fontFamily,
                color: '#8b7355',
                align: 'center',
                wordWrap: { width: pw - 60 }
            }).setOrigin(0.5));
        }

        // 数值信息
        const infoY = funFactY + 70;
        const eraName = EraData[artifact.era] ? EraData[artifact.era].name : artifact.era;

        modal.add(this.add.text(this.config.width/2 - 80, infoY, [
            `时代: ${eraName}`,
            `类型: ${artifact.type}`,
            `基础真品率: ${Math.round(artifact.authenticity * 100)}%`
        ].join('\n'), {
            fontSize: '15px',
            fontFamily: GameConfig.typography.fontFamily,
            color: '#8b7355',
            lineSpacing: 8
        }).setOrigin(0.5));

        modal.add(this.add.text(this.config.width/2 + 80, infoY, [
            `稀有度: ×${rarityData.multiplier}`,
            `基础价值: ¥${new BigNumber(artifact.baseValue).toString()}`,
            artifact.handOverReward ? `上交奖励: ${artifact.handOverReward} JP` : ''
        ].join('\n'), {
            fontSize: '15px',
            fontFamily: GameConfig.typography.fontFamily,
            color: '#8b7355',
            lineSpacing: 8
        }).setOrigin(0.5));

        // 关闭按钮
        const closeBtn = this.add.text(this.config.width/2, infoY + 70, '关闭', {
            fontSize: '17px',
            fontFamily: GameConfig.typography.fontFamily,
            color: '#f5e6d3',
            backgroundColor: '#3d2817',
            padding: { x: 25, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', closeModal);
        modal.add(closeBtn);
    }

    /**
     * 收藏家套装面板 — 左侧竖列，显示各朝代收集进度与加成
     */
    createSetBonusPanel() {
        if (this.state.prestigeLevel < 2) return;

        const panelX = 10;
        const panelY = 125;
        const panelW = 280;
        const rowH = 32;
        const eraRows = 6;
        const titleH = 35;
        const bonusH = 32;
        const panelH = titleH + eraRows * rowH + bonusH;

        // 面板背景
        const bg = this.add.graphics().setDepth(8);
        bg.fillStyle(0x2c1810, 0.95);
        bg.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
        bg.lineStyle(2, 0xd4a574, 0.3);
        bg.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);

        // 标题
        this.add.text(panelX + panelW / 2, panelY + 18, '🎖️ 收藏家奖励', {
            fontSize: '17px', fontFamily: GameConfig.typography.fontFamily,
            color: '#d4a574', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(9);

        // 分隔线
        const sep = this.add.graphics().setDepth(9);
        sep.lineStyle(1, 0xd4a574, 0.2);
        sep.lineBetween(panelX + 20, panelY + titleH, panelX + panelW - 20, panelY + titleH);

        const eraKeys = ['neolithic', 'shangzhou', 'qinhan', 'tang', 'songyuan', 'mingqing'];
        const eraNames = ['新石器', '商周', '秦汉', '盛唐', '宋元', '明清'];

        let bonusTotal = 0;
        eraKeys.forEach((era, i) => {
            const totalInEra = (ArtifactData[era] || []).length;
            const collected = this.collectedArtifacts.filter(a => a.era === era).length;
            const complete = collected >= totalInEra && totalInEra > 0;

            const y = panelY + titleH + 4 + i * rowH + rowH / 2;
            const check = complete ? '✅' : (collected > 0 ? '🔶' : '⬜');
            const count = `${collected}/${totalInEra}`;
            const color = complete ? '#27ae60' : (collected > 0 ? '#f39c12' : '#555555');
            const pct = totalInEra > 0 ? Math.round(collected / totalInEra * 100) : 0;

            // 进度条背景
            const barX = panelX + 20;
            const barY = y - 9;
            const barW = panelW - 100;
            const barH = 18;
            const barBg = this.add.graphics().setDepth(9);
            barBg.fillStyle(0x1a0f0a, 1);
            barBg.fillRoundedRect(barX, barY, barW, barH, 4);

            // 进度条填充
            if (pct > 0) {
                const barFill = this.add.graphics().setDepth(9);
                const fillColor = complete ? 0x27ae60 : (collected > 0 ? 0xf39c12 : 0x555555);
                const fillW = Math.max(barW * pct / 100, 4);
                barFill.fillStyle(fillColor, 0.5);
                barFill.fillRoundedRect(barX, barY, fillW, barH, 4);
            }

            // 朝代标签 (进度条上方)
            this.add.text(barX + 4, barY + barH / 2, `${check} ${eraNames[i]}`, {
                fontSize: '13px', fontFamily: GameConfig.typography.fontFamily, color: color
            }).setOrigin(0, 0.5).setDepth(10);

            // 数量 (进度条右侧)
            this.add.text(barX + barW + 6, barY + barH / 2, count, {
                fontSize: '12px', fontFamily: GameConfig.typography.fontFamily, color: color
            }).setOrigin(0, 0.5).setDepth(10);

            if (complete) bonusTotal += 5;
        });

        // 分隔线
        const sep2 = this.add.graphics().setDepth(9);
        const bonusY = panelY + titleH + eraRows * rowH;
        sep2.lineStyle(1, 0xd4a574, 0.2);
        sep2.lineBetween(panelX + 20, bonusY, panelX + panelW - 20, bonusY);

        // 总加成显示
        const bonusPct = bonusTotal;
        this.setBonusText = this.add.text(panelX + panelW / 2, bonusY + bonusH / 2,
            bonusPct > 0 ? `累计加成: 文物价值 +${bonusPct}%` : '集齐任一套装获得 +5%',
            {
                fontSize: '13px', fontFamily: GameConfig.typography.fontFamily,
                color: bonusPct > 0 ? '#f4d03f' : '#8b7355'
            }).setOrigin(0.5).setDepth(10);

        this._setBonusPct = bonusPct;
    }

    /** 获取已完成的收藏套装数量 */
    getCompletedSets() {
        const eraKeys = ['neolithic', 'shangzhou', 'qinhan', 'tang', 'songyuan', 'mingqing'];
        let completed = 0;
        eraKeys.forEach(era => {
            const totalInEra = (ArtifactData[era] || []).length;
            const collected = this.collectedArtifacts.filter(a => a.era === era).length;
            if (collected >= totalInEra && totalInEra > 0) completed++;
        });
        return completed;
    }

    getCollectedArtifacts() {
        const collected = [];

        const allArtifacts = [
            ...ArtifactData.neolithic,
            ...ArtifactData.shangzhou,
            ...ArtifactData.qinhan,
            ...ArtifactData.tang,
            ...ArtifactData.songyuan,
            ...ArtifactData.mingqing
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
        return (ArtifactData.neolithic || []).length
            + (ArtifactData.shangzhou || []).length
            + (ArtifactData.qinhan || []).length
            + (ArtifactData.tang || []).length
            + (ArtifactData.songyuan || []).length
            + (ArtifactData.mingqing || []).length;
    }

    /**
     * 获取文物图标的纹理 key，优先级：个体纹理 → 类型纹理 → null
     */
    getArtifactIconKey(artifact) {
        const idKey = 'artifact_' + artifact.id;
        if (this.textures.exists(idKey)) return idKey;
        return null;
    }

    get config() {
        return GameConfig;
    }
}

window.MuseumScene = MuseumScene;
