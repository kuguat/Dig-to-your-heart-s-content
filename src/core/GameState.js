/**
 * 游戏状态管理
 * 管理当前游戏的内存状态
 */
class GameState {
    constructor() {
        this.reset();
    }

    // 重置为新游戏状态
    reset() {
        // 资源
        this.funds = new BigNumber(10000);      // 初始经费 ¥10,000
        this.prestigePoints = 0;                 // 基金点 (JP)

        // 当前游戏进度
        this.currentEra = 'neolithic';           // 当前时代
        this.currentSite = null;                  // 当前发掘层位
        this.currentArtifact = null;              // 当前文物

        // 统计数据
        this.totalExcavations = 0;                // 总发掘次数
        this.totalArtifactsFound = 0;             // 总发现文物数
        this.totalAuthenticFound = 0;             // 总发现真品数
        this.totalFakesFound = 0;                 // 总发现赝品数
        this.totalNationalTreasures = 0;           // 国宝数

        // 升级状态
        this.upgrades = {
            luck: 0,              // 勘探运气
            brushSize: 0,         // 刷除范围
            excavationSpeed: 0,   // 清理速度
            artifactValue: 0,     // 文物倍率
            appraisalAccuracy: 0  // 鉴定精度
        };

        // 发掘运气加成（本次发掘）
        this.currentLuckBonus = 0;

        // 已解锁的文物ID（用于防止重复）
        this.discoveredArtifactIds = new Set();

        // 声望等级
        this.prestigeLevel = 0;

        // 本局获得的基金点
        this.jackpotPointsThisRun = 0;

        // 转生次数
        this.prestigeCount = 0;
    }

    // 复制状态（用于存档）
    clone() {
        const state = new GameState();
        state.funds = this.funds;
        state.prestigePoints = this.prestigePoints;
        state.currentEra = this.currentEra;
        state.currentSite = this.currentSite;
        state.currentArtifact = this.currentArtifact;
        state.totalExcavations = this.totalExcavations;
        state.totalArtifactsFound = this.totalArtifactsFound;
        state.totalAuthenticFound = this.totalAuthenticFound;
        state.totalFakesFound = this.totalFakesFound;
        state.totalNationalTreasures = this.totalNationalTreasures;
        state.upgrades = { ...this.upgrades };
        state.currentLuckBonus = this.currentLuckBonus;
        state.discoveredArtifactIds = new Set(this.discoveredArtifactIds);
        state.prestigeLevel = this.prestigeLevel;
        state.jackpotPointsThisRun = this.jackpotPointsThisRun;
        state.prestigeCount = this.prestigeCount;
        return state;
    }

    // 获取升级费用 — 乘数从 1.8 降至 1.5，让升级系统真正可用
    getUpgradeCost(upgradeType) {
        const baseCosts = {
            luck: 1000,
            brushSize: 2000,
            excavationSpeed: 1500,
            artifactValue: 3000,
            appraisalAccuracy: 2500
        };
        const level = this.upgrades[upgradeType];
        return new BigNumber(Math.floor(baseCosts[upgradeType] * Math.pow(1.5, level)));
    }

    // 获取升级效果 — 平衡各线路，artifactValue 不再一家独大
    getUpgradeEffect(upgradeType) {
        const level = this.upgrades[upgradeType];
        const effects = {
            luck: 0.03,              // 每级 +3% 真品率
            brushSize: 0.04,         // 每级 +4% 铲宽（挖土范围）
            excavationSpeed: 0.06,   // 每级 +6% 力道（挖掘深度）
            artifactValue: 0.12,     // 每级 +12% 文物价值
            appraisalAccuracy: 0.05  // 每级 +5% 鉴定准确率
        };
        return effects[upgradeType] * level;
    }

    // 获取最大升级等级
    getMaxUpgradeLevel(upgradeType) {
        return 50;
    }

    // 计算文物价值
    calculateArtifactValue(baseValue, rarity, condition) {
        const rarityMult = ArtifactData.rarity[rarity].multiplier;
        const conditionMult = ArtifactData.condition[condition].valueMult;
        const valueBonus = this.getUpgradeEffect('artifactValue');

        let value = new BigNumber(baseValue)
            .multiply(rarityMult)
            .multiply(conditionMult)
            .multiply(1 + valueBonus);

        return value;
    }

    // 计算真品概率
    calculateAuthenticityChance(baseAuthenticity) {
        const luckBonus = this.getUpgradeEffect('luck');
        const accuracyBonus = this.getUpgradeEffect('appraisalAccuracy');
        return Math.min(0.98, baseAuthenticity + luckBonus + accuracyBonus);
    }

    // 保存到本地
    save() {
        const data = {
            funds: { mantissa: this.funds.mantissa, exponent: this.funds.exponent },
            prestigePoints: this.prestigePoints,
            totalExcavations: this.totalExcavations,
            totalArtifactsFound: this.totalArtifactsFound,
            totalAuthenticFound: this.totalAuthenticFound,
            totalFakesFound: this.totalFakesFound,
            totalNationalTreasures: this.totalNationalTreasures,
            upgrades: this.upgrades,
            prestigeLevel: this.prestigeLevel,
            prestigeCount: this.prestigeCount,
            discoveredArtifactIds: Array.from(this.discoveredArtifactIds)
        };
        localStorage.setItem('qianzai_game_save', JSON.stringify(data));
    }

    // 从本地加载
    load() {
        const saved = localStorage.getItem('qianzai_game_save');
        if (!saved) return false;

        try {
            const data = JSON.parse(saved);
            this.funds = new BigNumber(data.funds.mantissa, data.funds.exponent);
            this.prestigePoints = data.prestigePoints || 0;
            this.totalExcavations = data.totalExcavations || 0;
            this.totalArtifactsFound = data.totalArtifactsFound || 0;
            this.totalAuthenticFound = data.totalAuthenticFound || 0;
            this.totalFakesFound = data.totalFakesFound || 0;
            this.totalNationalTreasures = data.totalNationalTreasures || 0;
            this.upgrades = data.upgrades || this.upgrades;
            this.prestigeLevel = data.prestigeLevel || 0;
            this.prestigeCount = data.prestigeCount || 0;
            this.discoveredArtifactIds = new Set(data.discoveredArtifactIds || []);
            return true;
        } catch (e) {
            console.error('Failed to load save:', e);
            return false;
        }
    }
}

// 导出
window.GameState = GameState;
