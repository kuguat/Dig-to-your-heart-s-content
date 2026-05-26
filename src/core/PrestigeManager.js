/**
 * 声望/转生系统管理器 — 六级阶梯制
 * Lv.0→Lv.1: 100JP  | 解锁鉴定之眼
 * Lv.1→Lv.2: 500JP  | 解锁博物馆
 * Lv.2→Lv.3: 2000JP | 解锁科技考古+高风险遗址
 * Lv.3→Lv.4: 10000JP| 解锁文物修复工坊
 * Lv.4→Lv.5: 50000JP| 解锁学术休假(转生)
 */
class PrestigeManager {
    constructor(gameState) {
        this.gameState = gameState;
    }

    /** 声望等级配置 */
    static TIERS = [
        { level: 0, name: '见习考古学家', threshold: 0,    color: '#c4784a',
          unlock: '基础发掘', era: 'neolithic',
          description: '刚入行的考古新手，佩戴见习徽章在新石器时代遗址进行基础发掘练习。\n\n🎁 新手保护：此阶段不会挖到赝品，是熟悉发掘流程、积累初始资金的黄金时期。\n\n📍 可发掘时代：新石器时代 — 彩陶、玉器、骨器等原始文明的珍贵遗存。',
          detailTitle: '🔰 新手保护期' },
        { level: 1, name: '初级考古学家', threshold: 100,   color: '#5a7a5a',
          unlock: '鉴定之眼', era: 'shangzhou',
          description: '通过初步考核获得正式职称，正式踏上考古探索之路。\n\n🔍 解锁「鉴定之眼」：可对出土文物进行真伪鉴定，正确鉴定可提高文物出售价格。鉴定准确率可通过升级提升。\n\n📍 解锁时代：商周 — 青铜器、甲骨文、礼器等着你发掘。\n\n⚠️ 从此阶段开始，发掘可能出现赝品。',
          detailTitle: '🔍 解锁鉴定系统' },
        { level: 2, name: '中级考古学家', threshold: 500,   color: '#6b5b4f',
          unlock: '博物馆', era: 'qinhan',
          description: '学术圈崭露头角，获准建立个人博物馆，展示你发掘的珍贵文物。\n\n🏛️ 解锁「博物馆」：收藏已发现的文物，可随时回顾你的考古成就。\n\n🎁 解锁「收藏家套装奖励」：集齐同一时代的全部文物，永久获得 +5% 文物价值加成，每个时代可叠加！\n\n📍 解锁时代：秦汉 — 统一王朝的珍贵遗存，兵马俑、铜车马等待出土。',
          detailTitle: '🏛️ 解锁博物馆' },
        { level: 3, name: '高级考古学家', threshold: 2000,  color: '#c9a227',
          unlock: '科技考古+高风险遗址', era: 'tang',
          description: '晋升高级职称，在考古界拥有重要话语权，获得进入高风险遗址的资格。\n\n🔬 解锁「科技考古」升级线：可使用先进科技设备提升发掘效率与精度。\n\n⚠️ 解锁「高风险遗址」：这些遗址出土文物等级更高、价值更丰，但挖到赝品的概率也更大。富贵险中求！\n\n📍 解锁时代：盛唐 — 追寻大唐盛世的辉煌，唐三彩、金银器等珍宝等你发现。',
          detailTitle: '🔬 解锁科技考古' },
        { level: 4, name: '资深考古学家', threshold: 10000, color: '#7fb3d5',
          unlock: '文物修复工坊', era: 'songyuan',
          description: '学界公认的权威专家，你的名字已被写入考古教科书。掌握文物修复技艺，能将残缺之美重焕光彩。\n\n🔧 解锁「文物修复工坊」：可修复在发掘中损坏的文物，使其重获价值。修复成功率随升级提升，高级修复甚至能提升文物等级！\n\n📍 解锁时代：宋元 — 瓷器的黄金时代，青花瓷、汝窑、钧窑等国之瑰宝静候出土。',
          detailTitle: '🔧 解锁文物修复' },
        { level: 5, name: '首席考古学家', threshold: 50000, color: '#8e44ad',
          unlock: '学术休假(转生)', era: 'mingqing',
          description: '考古界最高荣誉！你已站在学术之巅，获得终身成就奖。解锁终极系统——学术休假（转生）。\n\n🔄 解锁「学术休假（转生）」：重置游戏进度，将本局积累的基金点转化为永久加成奖励。\n\n🎁 转生奖励（按次数解锁）：\n  • 第1转：田野基本功 — 所有文物 +25% 价值\n  • 第2转：考古启动金 — 新档获得 +¥5,000 经费\n  • 第3转：火眼金睛 — 国宝级文物概率 +5%\n  • 第4转：科技考古 — 开局获得基础设备\n  • 每次转生永久 +2% 全属性加成\n\n📍 解锁时代：明清 — 最后的王朝，景泰蓝、宣德炉、明清瓷器等绝世珍品。',
          detailTitle: '🔄 解锁转生系统' }
    ];

    /** 当前等级配置 */
    getCurrentTier() {
        const lv = this.calculatePrestigeLevel();
        return PrestigeManager.TIERS[lv] || PrestigeManager.TIERS[0];
    }

    /** 下一级所需总 JP */
    getNextThreshold() {
        const lv = this.calculatePrestigeLevel();
        if (lv >= 5) return null;
        return PrestigeManager.TIERS[lv + 1].threshold;
    }

    /** 计算声望等级 — 基于累积 prestigePoints 阈值 */
    calculatePrestigeLevel() {
        const pts = this.gameState.prestigePoints;
        for (let i = 5; i >= 0; i--) {
            if (pts >= PrestigeManager.TIERS[i].threshold) return i;
        }
        return 0;
    }

    /** 检查是否可以提升声望（JP>=5 且 金钱足够） */
    canPrestige() {
        return this.gameState.jackpotPointsThisRun >= 5 && this.gameState.funds.gte(2500);
    }

    /** 是否可以转生（满级后才解锁） */
    canRebirth() {
        return this.calculatePrestigeLevel() >= 5 && this.canPrestige();
    }

    /**
     * 提升声望等级 — Lv.0~4 使用
     * 消耗 JP + 金钱（1JP = 500元），累积 JP 到永久池，达到阈值自动升级
     */
    doAdvance(points) {
        if (!points || points < 5) {
            return { success: false, message: '至少需要投入5点基金点' };
        }
        if (points > this.gameState.jackpotPointsThisRun) {
            return { success: false, message: `本局基金点不足，当前仅有 ${this.gameState.jackpotPointsThisRun} 点` };
        }

        const moneyCost = points * 500;
        if (this.gameState.funds.lt(moneyCost)) {
            return { success: false, message: `资金不足，需要 ¥${moneyCost}，当前仅有 ¥${this.gameState.funds.toNumber()}` };
        }

        const oldLevel = this.calculatePrestigeLevel();
        this.gameState.funds = this.gameState.funds.minus(moneyCost);
        this.gameState.jackpotPointsThisRun -= points;
        this.gameState.prestigePoints += points;
        const newLevel = this.calculatePrestigeLevel();
        this.gameState.prestigeLevel = newLevel;

        const leveledUp = newLevel > oldLevel;
        let reward = null;
        if (leveledUp) {
            reward = this.getLevelUpReward(oldLevel, newLevel);
        }

        // 重置局内数据
        this.resetForAdvance();

        return {
            success: true,
            points: points,
            moneyCost: moneyCost,
            oldLevel: oldLevel,
            newLevel: newLevel,
            leveledUp: leveledUp,
            reward: reward,
            message: leveledUp
                ? `声望提升至 Lv.${newLevel} ${PrestigeManager.TIERS[newLevel].name}！`
                : `获得 ${points} 基金点`
        };
    }

    /**
     * 执行学术休假（转生）— 仅 Lv.5 可用
     */
    doPrestige() {
        const points = this.gameState.jackpotPointsThisRun;
        if (points < 5) {
            return { success: false, message: '基金点不足，需要至少5点' };
        }

        this.gameState.prestigePoints += points;
        this.gameState.prestigeCount++;
        this.gameState.prestigeLevel = this.calculatePrestigeLevel();

        const reward = this.getPrestigeReward();

        this.resetForPrestige();

        return {
            success: true,
            points: points,
            reward: reward,
            prestigeCount: this.gameState.prestigeCount,
            message: `学术休假完成！转生次数: ${this.gameState.prestigeCount}`
        };
    }

    /** Lv.0~4 升级时获取奖励通知 */
    getLevelUpReward(oldLevel, newLevel) {
        const unlocks = [];
        for (let i = oldLevel + 1; i <= newLevel; i++) {
            const tier = PrestigeManager.TIERS[i];
            if (tier) {
                unlocks.push(`🔓 Lv.${i}: ${tier.unlock}`);
            }
        }
        return { unlocks: unlocks };
    }

    /** 转生奖励（仅 Lv.5 学术休假） */
    getPrestigeReward() {
        const count = this.gameState.prestigeCount;
        const rewards = [
            { name: '田野基本功', effect: '所有文物 +25% 价值', type: 'artifactValue', value: 0.25 },
            { name: '考古启动金', effect: '新档获得 ¥5,000 经费', type: 'startFunds', value: 5000 },
            { name: '火眼金睛', effect: '国宝级文物概率 +5%', type: 'nationalChance', value: 0.05 },
            { name: '科技考古', effect: '开局获得基础设备', type: 'startEquipment', value: 1 }
        ];
        if (count <= 4 && count > 0) {
            return rewards[count - 1];
        }
        return null;
    }

    /** 声望提升后重置（保留升级和文物图鉴） */
    resetForAdvance() {
        this.gameState.funds = new BigNumber(10000);
        this.gameState.currentEra = 'neolithic';
        this.gameState.currentSite = null;
        this.gameState.currentArtifact = null;
        this.gameState.totalExcavations = 0;
        this.gameState.totalArtifactsFound = 0;
        this.gameState.totalAuthenticFound = 0;
        this.gameState.totalFakesFound = 0;
        this.gameState.jackpotPointsThisRun = 0;
        this.gameState.earningsThisRun = 0;
        this.gameState.upgrades = {
            luck: 0,
            brushSize: 0,
            excavationSpeed: 0,
            artifactValue: 0,
            appraisalAccuracy: 0
        };
    }

    /** 转生后重置（全重置，保留永久数据） */
    resetForPrestige() {
        // 转生启动金：第2次转生起 +¥5,000，之后每次转生额外 +¥2,000
        const count = this.gameState.prestigeCount;
        let startFunds = 10000;
        if (count >= 2) startFunds += 5000;  // 考古启动金
        if (count >= 3) startFunds += (count - 2) * 2000;
        this.gameState.funds = new BigNumber(startFunds);
        this.gameState.currentEra = 'neolithic';
        this.gameState.currentSite = null;
        this.gameState.currentArtifact = null;
        this.gameState.totalExcavations = 0;
        this.gameState.totalArtifactsFound = 0;
        this.gameState.totalAuthenticFound = 0;
        this.gameState.totalFakesFound = 0;
        this.gameState.jackpotPointsThisRun = 0;
        this.gameState.earningsThisRun = 0;
        this.gameState.discoveredArtifactIds = new Set();
        // 转生奖励：第4次转生获得基础设备（挖掘范围+速度各+1级）
        this.gameState.upgrades = {
            luck: 0,
            brushSize: count >= 4 ? 1 : 0,
            excavationSpeed: count >= 4 ? 1 : 0,
            artifactValue: 0,
            appraisalAccuracy: 0
        };
    }

    /** 获取收藏套装加成（供外部注入） */
    getCollectionBonus(type) {
        if (type === 'artifactValue') {
            const completedSets = this.getCompletedSetCount();
            return completedSets * 0.05; // 每套 +5%
        }
        return 0;
    }

    /** 计算已完成的收藏套装数量 */
    getCompletedSetCount() {
        const eraKeys = ['neolithic', 'shangzhou', 'qinhan', 'tang', 'songyuan', 'mingqing'];
        let completed = 0;
        eraKeys.forEach(era => {
            const totalInEra = (ArtifactData[era] || []).length;
            const collected = this.gameState.discoveredArtifactIds;
            let count = 0;
            (ArtifactData[era] || []).forEach(a => {
                if (collected.has(a.id)) count++;
            });
            if (count >= totalInEra && totalInEra > 0) completed++;
        });
        return completed;
    }

    /** 获取永久加成（含转生+收藏套装） */
    getPermanentBonus(type) {
        let bonus = 0;
        bonus += this.gameState.prestigeCount * 0.02;
        if (this.gameState.prestigeCount >= 1 && type === 'artifactValue') bonus += 0.25;
        if (this.gameState.prestigeCount >= 3 && type === 'nationalChance') bonus += 0.05;
        // 收藏套装加成
        bonus += this.getCollectionBonus(type);
        return bonus;
    }

    /** 获取可解锁的时代 */
    getUnlockedEras() {
        const level = this.gameState.prestigeLevel;
        const eras = [];
        for (let i = 0; i <= level && i < PrestigeManager.TIERS.length; i++) {
            eras.push(PrestigeManager.TIERS[i].era);
        }
        return eras;
    }

    /** 获取当前可解锁新时代的基金点 */
    getNextEraUnlockCost() {
        const level = this.gameState.prestigeLevel;
        if (level >= 5) return null;
        const next = PrestigeManager.TIERS[level + 1];
        return next ? next.threshold : null;
    }

    /** 获取预览信息（当前+后2级可见，再往后显示???） */
    getTierPreview() {
        const current = this.calculatePrestigeLevel();
        const visible = Math.min(current + 3, PrestigeManager.TIERS.length);
        const tiers = [];
        for (let i = 0; i < PrestigeManager.TIERS.length; i++) {
            const tier = PrestigeManager.TIERS[i];
            if (i < visible) {
                tiers.push({
                    ...tier,
                    visible: true,
                    unlocked: i <= current,
                    current: i === current
                });
            } else {
                tiers.push({
                    level: i,
                    name: '???',
                    threshold: tier.threshold,
                    color: '#444444',
                    unlock: '???',
                    era: null,
                    description: '🔒 继续探索以解锁此等级',
                    detailTitle: '🔒 未知',
                    visible: false,
                    unlocked: false,
                    current: false
                });
            }
        }
        return tiers;
    }
}

window.PrestigeManager = PrestigeManager;
