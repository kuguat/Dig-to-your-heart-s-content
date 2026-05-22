/**
 * 声望/转生系统管理器
 */
class PrestigeManager {
    constructor(gameState) {
        this.gameState = gameState;
    }

    // 声望升级所需基金点
    getPrestigeLevelUpCost(level) {
        return Math.floor(100 * Math.pow(1.5, level));
    }

    // 计算声望等级
    calculatePrestigeLevel() {
        const points = this.gameState.prestigePoints;
        // 每100点升一级
        return Math.floor(points / 100);
    }

    // 检查是否可以升级声望
    canPrestige() {
        // 解锁新时代所需声望
        return this.gameState.jackpotPointsThisRun >= 10;
    }

    // 执行学术休假（转生）
    doPrestige() {
        const points = this.gameState.jackpotPointsThisRun;

        if (points < 10) {
            return { success: false, message: '基金点不足，需要至少10点' };
        }

        // 保存永久数据
        this.gameState.prestigePoints += points;
        this.gameState.prestigeCount++;
        this.gameState.prestigeLevel = this.calculatePrestigeLevel();

        // 获取转生奖励
        const reward = this.getPrestigeReward();

        // 重置局内数据
        this.resetForPrestige();

        return {
            success: true,
            points: points,
            reward: reward,
            message: `学术休假完成！获得 ${points} 基金点`
        };
    }

    // 获取转生奖励
    getPrestigeReward() {
        const count = this.gameState.prestigeCount;
        const rewards = [
            { name: '田野基本功', effect: '所有文物 +25% 价值', type: 'artifactValue', value: 0.25 },
            { name: '考古启动金', effect: '新档获得 ¥5,000 经费', type: 'startFunds', value: 5000 },
            { name: '火眼金睛', effect: '国宝级文物概率 +5%', type: 'nationalChance', value: 0.05 },
            { name: '科技考古', effect: '开局获得基础设备', type: 'startEquipment', value: 1 }
        ];

        // 前4次转生自动解锁
        if (count < 4) {
            return rewards[count];
        }

        return null;
    }

    // 转生后重置局内数据
    resetForPrestige() {
        this.gameState.funds = new BigNumber(10000); // 初始经费
        this.gameState.currentEra = 'neolithic';
        this.gameState.currentSite = null;
        this.gameState.currentArtifact = null;
        this.gameState.totalExcavations = 0;
        this.gameState.totalArtifactsFound = 0;
        this.gameState.totalAuthenticFound = 0;
        this.gameState.totalFakesFound = 0;
        this.gameState.jackpotPointsThisRun = 0;
        this.gameState.discoveredArtifactIds = new Set();
        this.gameState.upgrades = {
            luck: 0,
            brushSize: 0,
            excavationSpeed: 0,
            artifactValue: 0,
            appraisalAccuracy: 0
        };
    }

    // 获取永久加成
    getPermanentBonus(type) {
        let bonus = 0;

        // 转生次数加成
        bonus += this.gameState.prestigeCount * 0.02;

        // 特定转生奖励
        if (this.gameState.prestigeCount >= 1) {
            if (type === 'artifactValue') bonus += 0.25;
        }
        if (this.gameState.prestigeCount >= 3) {
            if (type === 'nationalChance') bonus += 0.05;
        }

        return bonus;
    }

    // 获取可解锁的时代
    getUnlockedEras() {
        const level = this.gameState.prestigeLevel;
        const eras = [];

        // 初始解锁
        eras.push('neolithic');

        // 声望等级解锁
        if (level >= 1) eras.push('shangzhou');
        if (level >= 2) eras.push('qinhan');
        if (level >= 3) eras.push('tang');
        if (level >= 4) eras.push('songyuan');
        if (level >= 5) eras.push('mingqing');

        return eras;
    }

    // 获取当前可解锁新时代的基金点
    getNextEraUnlockCost() {
        const level = this.gameState.prestigeLevel;
        const costs = {
            0: 100,   // 商周
            1: 500,   // 秦汉
            2: 2000,  // 唐
            3: 10000, // 宋元
            4: 50000  // 明清
        };
        return costs[level] || null;
    }
}

window.PrestigeManager = PrestigeManager;
