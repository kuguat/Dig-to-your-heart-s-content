/**
 * 数据交互校验器 — AI IOA 安全体系·数据校验层
 * 对存档数据进行完整性校验，防止篡改和损坏
 */
class DataValidator {
    constructor() {
        this.saveVersion = '1.0.0';
        this.alerts = [];
    }

    /**
     * 生成存档数据的简易哈希校验码
     * 基于关键字段的确定性序列化，检测数据篡改
     */
    _generateHash(data) {
        // 只对核心可量化字段做校验，排除 timestamp 等自然变化量
        const payload = [
            data.funds?.mantissa ?? 0,
            data.funds?.exponent ?? 0,
            data.prestigePoints ?? 0,
            data.prestigeLevel ?? 0,
            data.prestigeCount ?? 0,
            data.totalExcavations ?? 0,
            data.totalArtifactsFound ?? 0,
            data.totalAuthenticFound ?? 0,
            data.totalFakesFound ?? 0,
            data.totalNationalTreasures ?? 0,
            data.currentEra ?? '',
            JSON.stringify(data.upgrades ?? {}),
            JSON.stringify(data.discoveredArtifactIds ?? []),
            JSON.stringify(data.tutorialFlags ?? {})
        ].join('|');

        // 简易哈希 (DJB2 算法)
        let hash = 5381;
        for (let i = 0; i < payload.length; i++) {
            hash = ((hash << 5) + hash) + payload.charCodeAt(i); /* hash * 33 + c */
            hash = hash & 0xFFFFFFFF; // 保持 32 位
        }
        return hash.toString(16);
    }

    /**
     * 为存档附加校验码
     */
    seal(saveData) {
        const data = { ...saveData };
        // 移除旧的哈希和校验时间戳
        delete data._hash;
        delete data._sealedAt;
        data._hash = this._generateHash(data);
        data._sealedAt = Date.now();
        data._validatorVersion = this.saveVersion;
        return data;
    }

    /**
     * 校验存档完整性
     * @returns {{ valid: boolean, reason?: string, tampered: boolean }}
     */
    validate(saveData) {
        // 1. 版本检查
        if (!saveData.version) {
            return { valid: false, reason: '存档缺少版本号', tampered: false };
        }

        // 2. 结构完整性检查
        const requiredFields = ['funds', 'prestigePoints', 'currentEra', 'totalExcavations',
            'totalArtifactsFound', 'upgrades', 'prestigeLevel', 'discoveredArtifactIds'];
        for (const field of requiredFields) {
            if (saveData[field] === undefined || saveData[field] === null) {
                return { valid: false, reason: `存档缺少必要字段: ${field}`, tampered: true };
            }
        }

        // 3. 资金数值合理性检查
        if (saveData.funds) {
            if (typeof saveData.funds.mantissa !== 'number' || typeof saveData.funds.exponent !== 'number') {
                return { valid: false, reason: '资金数据格式异常', tampered: true };
            }
            if (saveData.funds.mantissa < 0 || saveData.funds.exponent < 0) {
                return { valid: false, reason: '资金数据为负数', tampered: true };
            }
        }

        // 4. 声望等级越界检查 (Lv.0~5)
        if (typeof saveData.prestigeLevel !== 'number' || saveData.prestigeLevel < 0 || saveData.prestigeLevel > 5) {
            return { valid: false, reason: `声望等级越界: ${saveData.prestigeLevel}`, tampered: true };
        }

        // 5. 统计数据合理性
        if (saveData.totalExcavations < 0 || saveData.totalArtifactsFound < 0 ||
            saveData.totalAuthenticFound < 0 || saveData.totalFakesFound < 0) {
            return { valid: false, reason: '统计数据为负数', tampered: true };
        }

        // 6. 真品+赝品不能超过总发现数
        if ((saveData.totalAuthenticFound + saveData.totalFakesFound) > saveData.totalArtifactsFound) {
            return { valid: false, reason: '真品+赝品数超过总发现数', tampered: true };
        }

        // 7. 升级等级越界检查 (0~50)
        if (saveData.upgrades) {
            for (const [key, val] of Object.entries(saveData.upgrades)) {
                if (typeof val !== 'number' || val < 0 || val > 50) {
                    return { valid: false, reason: `升级等级异常: ${key}=${val}`, tampered: true };
                }
            }
        }

        // 8. 哈希校验（如果存档含哈希）
        if (saveData._hash) {
            const expectedHash = this._generateHash(saveData);
            if (saveData._hash !== expectedHash) {
                console.warn('[DataValidator] 存档哈希校验失败 — 可能被篡改');
                return { valid: true, reason: '哈希不匹配（忽略继续加载）', tampered: true };
            }
        }

        // 9. 时间合理性检查（不能来自未来）
        if (saveData.timestamp && saveData.timestamp > Date.now() + 86400000) {
            return { valid: false, reason: '存档时间戳来自未来', tampered: true };
        }

        return { valid: true, tampered: false };
    }

    /**
     * 清理受损字段，返回可安全使用的数据
     */
    sanitize(saveData) {
        const clean = { ...saveData };

        // 资金异常 → 重置为初始值
        if (!clean.funds || typeof clean.funds.mantissa !== 'number') {
            clean.funds = { mantissa: 1, exponent: 4 }; // ¥10,000
        }
        if (clean.funds.mantissa < 0) clean.funds.mantissa = 1;
        if (clean.funds.exponent < 0) clean.funds.exponent = 4;

        // 声望等级越界 → 重置
        if (typeof clean.prestigeLevel !== 'number' || clean.prestigeLevel < 0 || clean.prestigeLevel > 5) {
            clean.prestigeLevel = 0;
        }

        // 升级等级越界 → 修正
        const maxUpgrade = 50;
        if (clean.upgrades) {
            for (const key of Object.keys(clean.upgrades)) {
                if (typeof clean.upgrades[key] !== 'number' || clean.upgrades[key] < 0) {
                    clean.upgrades[key] = 0;
                }
                if (clean.upgrades[key] > maxUpgrade) {
                    clean.upgrades[key] = maxUpgrade;
                }
            }
        }

        // 修复真品+赝品 > 总发现的不一致
        if ((clean.totalAuthenticFound + clean.totalFakesFound) > clean.totalArtifactsFound) {
            clean.totalArtifactsFound = clean.totalAuthenticFound + clean.totalFakesFound;
        }

        return clean;
    }

    /**
     * 获取校验报告
     */
    getReport() {
        return {
            validatorVersion: this.saveVersion,
            alerts: [...this.alerts],
            alertCount: this.alerts.length
        };
    }

    /**
     * 记录安全警告
     */
    logAlert(type, message) {
        const alert = { type, message, timestamp: Date.now() };
        this.alerts.push(alert);
        if (this.alerts.length > 100) this.alerts.shift(); // 只保留最近 100 条
        console.warn(`[Security|${type}] ${message}`);
    }
}

window.DataValidator = DataValidator;
