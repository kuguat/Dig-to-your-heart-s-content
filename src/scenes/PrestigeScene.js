/**
 * 声望场景 - 技能树
 */
class PrestigeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PrestigeScene' });
    }

    create() {
        this.state = window.gameState;
        this.prestigeManager = window.prestigeManager;

        this.createBackground();
        this.createUI();
        this.createPrestigeTree();
    }

    createBackground() {
        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(0x1a0f0a, 1);
        bg.fillRect(0, 0, this.config.width, this.config.height);
    }

    createUI() {
        // 顶部栏
        const topBar = this.add.graphics();
        topBar.fillStyle(0x2c1810, 1);
        topBar.fillRect(0, 0, this.config.width, 60);

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
        this.add.text(this.config.width/2, 30, '⭐ 声望技能树', {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            color: '#f5e6d3',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 基金点显示
        this.add.text(this.config.width - 30, 30, `基金点: ${this.state.prestigePoints} JP`, {
            fontSize: '18px',
            fontFamily: 'Microsoft YaHei',
            color: '#9b59b6'
        }).setOrigin(1, 0.5);
    }

    createPrestigeTree() {
        // 技能树容器
        const startY = 100;
        const nodeHeight = 80;

        // 定义技能节点
        const nodes = [
            {
                id: 'artifact_bonus',
                name: '田野基本功',
                desc: '所有文物价值 +25%',
                cost: 50,
                unlocked: this.state.prestigeCount >= 1,
                branch: 'profit',
                icon: 'icon_money'
            },
            {
                id: 'start_funds',
                name: '考古启动金',
                desc: '新档获得 ¥5,000',
                cost: 100,
                unlocked: this.state.prestigeCount >= 2,
                branch: 'profit',
                icon: 'icon_money'
            },
            {
                id: 'national_bonus',
                name: '火眼金睛',
                desc: '国宝概率 +5%',
                cost: 150,
                unlocked: this.state.prestigeCount >= 3,
                branch: 'profit',
                icon: 'icon_national'
            },
            {
                id: 'start_equip',
                name: '科技考古',
                desc: '开局获得基础设备',
                cost: 200,
                unlocked: this.state.prestigeCount >= 4,
                branch: 'automation',
                icon: 'icon_excavate'
            }
        ];

        // 绘制技能树
        const centerX = this.config.width / 2;

        // 标题
        this.add.text(centerX, startY, '🔮 转生永久奖励（自动解锁）', {
            fontSize: '18px',
            fontFamily: 'Microsoft YaHei',
            color: '#d4a574'
        }).setOrigin(0.5);

        // 绘制已解锁节点
        nodes.forEach((node, idx) => {
            const y = startY + 50 + idx * nodeHeight;
            this.createNode(centerX, y, node, idx);
        });

        // 底部说明
        this.add.text(centerX, this.config.height - 50,
            '💡 每进行一次"学术休假"（转生），自动解锁下一层永久奖励', {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            color: '#8b7355'
        }).setOrigin(0.5);

        // 当前转生次数
        this.add.text(centerX, this.config.height - 25,
            `当前转生次数: ${this.state.prestigeCount} / 4（全部解锁）`, {
            fontSize: '16px',
            fontFamily: 'Microsoft YaHei',
            color: '#9b59b6'
        }).setOrigin(0.5);
    }

    createNode(x, y, node, index) {
        const container = this.add.container(x, y);

        // 节点背景
        const bg = this.add.graphics();
        bg.fillStyle(node.unlocked ? 0x3d2817 : 0x2c1810, 1);
        bg.fillRoundedRect(-180, -30, 360, 55, 10);

        if (node.unlocked) {
            bg.lineStyle(2, 0x27ae60, 0.8);
        } else {
            bg.lineStyle(2, 0x555555, 0.5);
        }
        bg.strokeRoundedRect(-180, -30, 360, 55, 10);
        container.add(bg);

        // 序号
        const numCircle = this.add.graphics();
        if (node.unlocked) {
            numCircle.fillStyle(0x27ae60, 1);
        } else {
            numCircle.fillStyle(0x555555, 1);
        }
        numCircle.fillCircle(-150, 0, 15);
        container.add(numCircle);

        container.add(this.add.text(-150, 0, (index + 1).toString(), {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff'
        }).setOrigin(0.5));

        // 图标
        container.add(this.add.image(-110, 0, node.icon).setScale(0.7));

        // 名称
        const nameColor = node.unlocked ? '#f5e6d3' : '#666666';
        container.add(this.add.text(-70, -8, node.name, {
            fontSize: '16px',
            fontFamily: 'Microsoft YaHei',
            color: nameColor,
            fontStyle: 'bold'
        }));

        // 描述
        const descColor = node.unlocked ? '#8b7355' : '#555555';
        container.add(this.add.text(-70, 12, node.desc, {
            fontSize: '13px',
            fontFamily: 'Microsoft YaHei',
            color: descColor
        }));

        // 状态标签
        const statusText = node.unlocked ? '✓ 已解锁' : `需要 ${node.cost} JP`;
        const statusColor = node.unlocked ? '#27ae60' : '#666666';
        container.add(this.add.text(120, 0, statusText, {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            color: statusColor
        }).setOrigin(0.5));

        // 连接线
        if (index > 0) {
            const line = this.add.graphics();
            line.lineStyle(2, node.unlocked ? 0x27ae60 : 0x3d2817, 0.5);
            line.lineBetween(x, y - nodeHeight + 25, x, y - 30);
        }

        return container;
    }

    get config() {
        return GameConfig;
    }
}

window.PrestigeScene = PrestigeScene;
