/**
 * HaS-Anonymizer — 数据脱敏模块
 * 保护游戏信息交互，不对外发布敏感信息
 * 
 * 功能：
 * - 玩家数据脱敏（屏蔽精确数值）
 * - 存档导出脱敏
 * - 日志/调试信息过滤
 * - 排行榜/分享数据脱敏
 */
class HaSAnonymizer {
    constructor() {
        this.config = {
            // 脱敏策略
            fundsMasking: 'range',    // 'range'|'blur'|'hide'
            statsMasking: 'blur',     // 'exact'|'blur'|'hide'
            jpMasking: 'blur',        // 'exact'|'blur'|'hide'
            // 版本号屏蔽
            anonymizeVersion: true
        };
    }

    /**
     * 对玩家游戏数据进行脱敏
     * @param {Object} rawData - 原始游戏数据
     * @returns {Object} 脱敏后的数据
     */
    anonymize(rawData) {
        if (!rawData) return rawData;

        const safe = {};

        // 资金脱敏 → 只显示数量级
        if (rawData.funds) {
            if (this.config.fundsMasking === 'hide') {
                safe.funds = '***';
            } else if (this.config.fundsMasking === 'range') {
                safe.funds = this._maskFunds(rawData.funds);
            } else {
                safe.funds = this._blurFunds(rawData.funds);
            }
        }

        // JP 脱敏
        if (rawData.prestigePoints !== undefined) {
            if (this.config.jpMasking === 'hide') {
                safe.prestigePoints = '***';
            } else if (this.config.jpMasking === 'blur') {
                safe.prestigePoints = this._blurNumber(rawData.prestigePoints);
            } else {
                safe.prestigePoints = rawData.prestigePoints;
            }
        }

        // 统计数据脱敏
        if (this.config.statsMasking === 'hide') {
            safe.totalExcavations = '***';
            safe.totalArtifactsFound = '***';
            safe.totalNationalTreasures = '***';
        } else if (this.config.statsMasking === 'blur') {
            safe.totalExcavations = this._blurNumber(rawData.totalExcavations || 0);
            safe.totalArtifactsFound = this._blurNumber(rawData.totalArtifactsFound || 0);
            safe.totalNationalTreasures = this._blurNumber(rawData.totalNationalTreasures || 0);
        } else {
            safe.totalExcavations = rawData.totalExcavations;
            safe.totalArtifactsFound = rawData.totalArtifactsFound;
            safe.totalNationalTreasures = rawData.totalNationalTreasures;
        }

        // 公开信息（不脱敏）
        safe.prestigeLevel = rawData.prestigeLevel;
        safe.prestigeCount = rawData.prestigeCount;
        safe.currentEra = rawData.currentEra;
        safe.version = rawData.version;

        // 脱敏时间戳
        safe._anonymizedAt = Date.now();

        return safe;
    }

    /**
     * 对外分享/排行榜显示用的脱敏数据
     * 比内部分析更严格
     */
    anonymizeForSharing(rawData) {
        const safe = this.anonymize(rawData);
        
        // 隐藏 ID 集合等敏感信息
        delete safe.discoveredArtifactIds;
        delete safe.tutorialFlags;
        delete safe.upgrades;

        // 资金完全模糊
        if (rawData.funds) {
            const value = rawData.funds.mantissa * Math.pow(10, rawData.funds.exponent);
            safe.wealth = this._blurToRange(value);
        }

        return safe;
    }

    /**
     * 存档导出脱敏（用于分享存档/调试）
     */
    anonymizeSaveData(saveData) {
        if (!saveData) return saveData;
        const safe = this.anonymize(saveData);

        // 移除敏感字段
        delete safe._hash;
        delete safe._sealedAt;
        delete safe._validatorVersion;
        
        // 模糊升级数据
        if (saveData.upgrades) {
            safe.upgrades = {};
            for (const [k, v] of Object.entries(saveData.upgrades)) {
                safe.upgrades[k] = this._blurNumber(v);
            }
        }

        // 只保留文物 ID 数量，不暴露具体 ID
        if (saveData.discoveredArtifactIds) {
            safe.collectionSize = Array.isArray(saveData.discoveredArtifactIds)
                ? saveData.discoveredArtifactIds.length
                : 'unknown';
        }
        delete safe.discoveredArtifactIds;

        return safe;
    }

    /**
     * 日志信息脱敏（过滤 console 输出）
     */
    sanitizeLog(message) {
        if (typeof message !== 'string') return message;
        
        // 移除精确数值
        let safe = message
            .replace(/¥[\d,.]+[KMBT]?/g, '¥***')
            .replace(/funds:[\s]*[\d.e+-]+/gi, 'funds:***')
            .replace(/prestigePoints:[\s]*\d+/gi, 'prestigePoints:***');

        return safe;
    }

    // === 内部脱敏工具 ===

    /**
     * 资金 → 档位描述
     * < 1K → "小额", < 10K → "千级", < 1M → "万级", < 100M → "百万级", etc.
     */
    _maskFunds(funds) {
        const value = (funds.mantissa || 1) * Math.pow(10, funds.exponent || 0);
        return this._blurToRange(value);
    }

    /**
     * 数值 → 范围描述
     */
    _blurToRange(value) {
        if (value < 1000) return '<¥1K';
        if (value < 10000) return '~¥1K';
        if (value < 100000) return '~¥1万';
        if (value < 1000000) return '~¥10万';
        if (value < 10000000) return '~¥100万';
        if (value < 100000000) return '~¥1000万';
        if (value < 1e9) return '~¥1亿';
        if (value < 1e12) return '~¥10亿+';
        return '天文数字';
    }

    /**
     * 模糊资金（加随机噪声）
     */
    _blurFunds(funds) {
        const value = (funds.mantissa || 1) * Math.pow(10, funds.exponent || 0);
        const noise = value * (Math.random() * 0.2 - 0.1); // ±10%
        return this._fmt(value + noise);
    }

    /**
     * 模糊数值（取整数数量级）
     */
    _blurNumber(n) {
        if (n === 0) return 0;
        if (n < 10) return '<10';
        if (n < 50) return Math.round(n / 10) * 10;
        if (n < 500) return Math.round(n / 50) * 50;
        if (n < 5000) return Math.round(n / 100) * 100;
        return Math.round(n / 1000) * 1000;
    }

    /**
     * 格式化数字
     */
    _fmt(n) {
        if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
        if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
        if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
        if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
        return n.toFixed(0);
    }
}

window.HaSAnonymizer = HaSAnonymizer;
