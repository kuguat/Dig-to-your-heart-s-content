/**
 * 存档管理器
 */
class SaveManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.saveKey = 'qianzai_game_save';
        this.autoSaveInterval = 30000; // 30秒自动保存
        this.autoSaveTimer = null;
    }

    // 开始自动存档
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        this.autoSaveTimer = setInterval(() => {
            this.save();
            console.log('Auto-saved');
        }, this.autoSaveInterval);
    }

    // 停止自动存档
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    // 保存游戏
    save() {
        const saveData = {
            version: '1.0.0',
            timestamp: Date.now(),
            funds: {
                mantissa: this.gameState.funds.mantissa,
                exponent: this.gameState.funds.exponent
            },
            prestigePoints: this.gameState.prestigePoints,
            currentEra: this.gameState.currentEra,
            totalExcavations: this.gameState.totalExcavations,
            totalArtifactsFound: this.gameState.totalArtifactsFound,
            totalAuthenticFound: this.gameState.totalAuthenticFound,
            totalFakesFound: this.gameState.totalFakesFound,
            totalNationalTreasures: this.gameState.totalNationalTreasures,
            upgrades: { ...this.gameState.upgrades },
            prestigeLevel: this.gameState.prestigeLevel,
            prestigeCount: this.gameState.prestigeCount,
            discoveredArtifactIds: Array.from(this.gameState.discoveredArtifactIds),
            tutorialFlags: { ...this.gameState.tutorialFlags }
        };

        try {
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    }

    // 加载游戏
    load() {
        const savedData = localStorage.getItem(this.saveKey);
        if (!savedData) return false;

        try {
            const data = JSON.parse(savedData);

            // 处理旧存档格式：funds 可能是数字或 BigNumber 格式
            if (typeof data.funds === 'number') {
                this.gameState.funds = new BigNumber(data.funds);
            } else if (data.funds && typeof data.funds.mantissa !== 'undefined') {
                this.gameState.funds = new BigNumber(data.funds.mantissa, data.funds.exponent);
            } else {
                this.gameState.funds = new BigNumber(10000);
            }
            this.gameState.prestigePoints = data.prestigePoints || 0;
            this.gameState.currentEra = data.currentEra || 'neolithic';
            this.gameState.totalExcavations = data.totalExcavations || 0;
            this.gameState.totalArtifactsFound = data.totalArtifactsFound || 0;
            this.gameState.totalAuthenticFound = data.totalAuthenticFound || 0;
            this.gameState.totalFakesFound = data.totalFakesFound || 0;
            this.gameState.totalNationalTreasures = data.totalNationalTreasures || 0;
            this.gameState.upgrades = data.upgrades || this.gameState.upgrades;
            // 安全处理声望等级
            let lv = data.prestigeLevel || 0;
            if (typeof lv !== 'number' || lv < 0 || lv > 5) {
                console.warn('SaveManager: prestigeLevel 越界 (' + lv + ')，重置为 0');
                lv = 0;
            }
            this.gameState.prestigeLevel = lv;
            this.gameState.prestigeCount = data.prestigeCount || 0;
            this.gameState.discoveredArtifactIds = new Set(data.discoveredArtifactIds || []);
            if (data.tutorialFlags) {
                Object.assign(this.gameState.tutorialFlags, data.tutorialFlags);
            }

            console.log('Game loaded successfully');
            return true;
        } catch (e) {
            console.error('Load failed:', e);
            return false;
        }
    }

    // 检查是否有存档
    hasSave() {
        return localStorage.getItem(this.saveKey) !== null;
    }

    // 删除存档
    deleteSave() {
        localStorage.removeItem(this.saveKey);
        localStorage.removeItem('qianzai_permanent_save');
    }

    // 获取存档信息
    getSaveInfo() {
        const savedData = localStorage.getItem(this.saveKey);
        if (!savedData) return null;

        try {
            const data = JSON.parse(savedData);
            return {
                version: data.version,
                timestamp: new Date(data.timestamp),
                funds: new BigNumber(data.funds.mantissa, data.funds.exponent).toString(),
                prestigeLevel: data.prestigeLevel,
                prestigeCount: data.prestigeCount
            };
        } catch (e) {
            return null;
        }
    }

    // 保存永久数据（转生后保留）
    savePermanent() {
        const data = {
            prestigePoints: this.gameState.prestigePoints,
            prestigeCount: this.gameState.prestigeCount,
            prestigeLevel: this.gameState.prestigeLevel,
            totalNationalTreasures: this.gameState.totalNationalTreasures,
            discoveredArtifactIds: Array.from(this.gameState.discoveredArtifactIds),
            tutorialFlags: { ...this.gameState.tutorialFlags }
        };
        localStorage.setItem('qianzai_permanent_save', JSON.stringify(data));
    }

    // 加载永久数据
    loadPermanent() {
        const saved = localStorage.getItem('qianzai_permanent_save');
        if (!saved) return false;

        try {
            const data = JSON.parse(saved);
            this.gameState.prestigePoints = data.prestigePoints || 0;
            this.gameState.prestigeCount = data.prestigeCount || 0;
            this.gameState.prestigeLevel = data.prestigeLevel || 0;
            this.gameState.totalNationalTreasures = data.totalNationalTreasures || 0;
            this.gameState.discoveredArtifactIds = new Set(data.discoveredArtifactIds || []);
            if (data.tutorialFlags) {
                Object.assign(this.gameState.tutorialFlags, data.tutorialFlags);
            }
            return true;
        } catch (e) {
            return false;
        }
    }
}

window.SaveManager = SaveManager;
