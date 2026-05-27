/**
 * 异常行为检测器 — AI IOA 安全体系·行为分析层
 * 监控游戏行为，识别异常/作弊模式
 */
class AnomalyDetector {
    constructor(gameState) {
        this.gameState = gameState;
        this.validator = new DataValidator();

        // 快照历史（用于趋势分析）
        this.snapshots = [];
        this.maxSnapshots = 30;

        // 事件计数器（用于频率检测）
        this.eventCounts = {};
        this.eventWindows = {};
        this.rateLimits = {
            excavate: { max: 10, windowMs: 1000 },   // 每秒最多 10 次发掘
            sell: { max: 20, windowMs: 1000 },        // 每秒最多 20 次出售
            upgrade: { max: 5, windowMs: 1000 },      // 每秒最多 5 次升级
            prestige: { max: 1, windowMs: 5000 },     // 5 秒内最多 1 次声望提升
            repair: { max: 3, windowMs: 1000 }        // 每秒最多 3 次修复
        };

        // 异常事件记录
        this.anomalies = [];
        this.maxAnomalies = 50;

        // 上次资金快照
        this.lastFundsSnapshot = null;

        this._init();
    }

    _init() {
        this._takeSnapshot();
    }

    /**
     * 记录游戏快照
     */
    _takeSnapshot() {
        if (!this.gameState || !this.gameState.funds) return;
        this.snapshots.push({
            time: Date.now(),
            funds: {
                mantissa: this.gameState.funds.mantissa,
                exponent: this.gameState.funds.exponent
            },
            prestigePoints: this.gameState.prestigePoints,
            totalExcavations: this.gameState.totalExcavations,
            totalArtifactsFound: this.gameState.totalArtifactsFound,
            prestigeLevel: this.gameState.prestigeLevel
        });
        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots.shift();
        }
    }

    /**
     * 记录事件并检测频率异常
     * @returns {{ allowed: boolean, reason?: string }}
     */
    traceEvent(eventType) {
        const now = Date.now();
        const limit = this.rateLimits[eventType];

        if (!limit) {
            // 未知事件类型，允许通过
            this.eventCounts[eventType] = (this.eventCounts[eventType] || 0) + 1;
            return { allowed: true };
        }

        // 初始化或清理过期窗口
        if (!this.eventWindows[eventType] || (now - this.eventWindows[eventType].start) > limit.windowMs) {
            this.eventWindows[eventType] = { start: now, count: 1 };
            return { allowed: true };
        }

        this.eventWindows[eventType].count++;

        if (this.eventWindows[eventType].count > limit.max) {
            this._logAnomaly('RATE_LIMIT', `${eventType} 操作频率过高: ${this.eventWindows[eventType].count}次/${limit.windowMs}ms`);
            return {
                allowed: false,
                reason: '操作过于频繁，请稍后再试'
            };
        }

        this.eventCounts[eventType] = (this.eventCounts[eventType] || 0) + 1;
        return { allowed: true };
    }

    /**
     * 检查资金变化是否异常
     * 资金不应该在短时间内出现不可能的增长
     */
    checkFundsIntegrity() {
        if (!this.gameState || !this.gameState.funds) return { ok: true };

        const current = {
            mantissa: this.gameState.funds.mantissa,
            exponent: this.gameState.funds.exponent
        };

        if (this.lastFundsSnapshot) {
            const prevValue = this.lastFundsSnapshot.mantissa * Math.pow(10, this.lastFundsSnapshot.exponent);
            const currValue = current.mantissa * Math.pow(10, current.exponent);
            const diff = currValue - prevValue;
            const timeDiff = Date.now() - this.lastFundsSnapshot.time;

            // 如果 1 秒内资金增长超过 100 倍，标记异常
            if (timeDiff < 1000 && prevValue > 0 && diff > prevValue * 100) {
                this._logAnomaly('FUNDS_SPIKE',
                    `资金异常增长: ${this._fmt(prevValue)} → ${this._fmt(currValue)} (${timeDiff}ms)`);
                return { ok: false, reason: '资金异常增长，已记录' };
            }
        }

        this.lastFundsSnapshot = { ...current, time: Date.now() };
        return { ok: true };
    }

    /**
     * 检查声望积分变化是否合理
     */
    checkPrestigeIntegrity(pointsAdded) {
        // 单次 JP 增益不能超过 1000（含转生加成）
        if (pointsAdded > 1000) {
            this._logAnomaly('JP_SPIKE', `单次 JP 增益异常: +${pointsAdded}`);
            return { ok: false, reason: 'JP 增益异常' };
        }
        return { ok: true };
    }

    /**
     * 全面完整性扫描（存档加载后调用）
     */
    fullScan() {
        const issues = [];
        const gs = this.gameState;
        if (!gs) return issues;

        // 资金不能为负
        if (gs.funds && gs.funds.mantissa < 0) {
            issues.push('资金为负数');
        }

        // 声望等级范围
        if (gs.prestigeLevel < 0 || gs.prestigeLevel > 5) {
            issues.push(`声望等级越界: ${gs.prestigeLevel}`);
        }

        // 统计数据一致性
        if (gs.totalAuthenticFound + gs.totalFakesFound > gs.totalArtifactsFound) {
            issues.push('真品+赝品数 > 总发现数');
        }

        // 升级等级范围
        const maxUp = 50;
        for (const [k, v] of Object.entries(gs.upgrades || {})) {
            if (v < 0 || v > maxUp) {
                issues.push(`升级 ${k} 越界: ${v}`);
            }
        }

        // 国宝数不应超过总发现数
        if (gs.totalNationalTreasures > gs.totalArtifactsFound) {
            issues.push(`国宝数(${gs.totalNationalTreasures}) > 总发现数(${gs.totalArtifactsFound})`);
        }

        // 发现文物 ID 集合大小不应超过总文物数
        if (gs.discoveredArtifactIds && gs.discoveredArtifactIds.size > gs.totalArtifactsFound * 2) {
            issues.push(`文物 ID 集合异常膨胀: ${gs.discoveredArtifactIds.size}`);
        }

        issues.forEach(issue => this._logAnomaly('FULL_SCAN', issue));
        return issues;
    }

    /**
     * 记录异常事件
     */
    _logAnomaly(type, detail) {
        const entry = { type, detail, timestamp: Date.now() };
        this.anomalies.push(entry);
        if (this.anomalies.length > this.maxAnomalies) {
            this.anomalies.shift();
        }
        this.validator.logAlert(type, detail);
    }

    /**
     * 获取异常报告
     */
    getReport() {
        return {
            totalAnomalies: this.anomalies.length,
            recentAnomalies: this.anomalies.slice(-10),
            eventStats: { ...this.eventCounts },
            alertReport: this.validator.getReport()
        };
    }

    /**
     * 格式化数字
     */
    _fmt(n) {
        if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
        if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
        if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
        if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
        return n.toFixed(1);
    }
}

window.AnomalyDetector = AnomalyDetector;
