/**
 * 经济系统管理器
 */
class EconomyManager {
    constructor(gameState) {
        this.gameState = gameState;
    }

    // ── 声望 JP 阶梯表（按时代×稀有度）──
    static JP_TABLE = {
        neolithic:  { rare: 20,  epic: 100 },
        shangzhou:  { rare: 35,  epic: 150 },
        qinhan:     { rare: 50,  epic: 250 },
        tang:       { rare: 80,  epic: 400 },
        songyuan:   { rare: 120, epic: 600 },
        mingqing:   { rare: 180, epic: 900 }
    };

    // ── 出售倍数 ──
    static SELL_MULTIPLIER = { rare: 2, epic: 3, legendary: 5, mythic: 5 };

    // ── 稀有度中文标签 ──
    static RARITY_LABEL = {
        rare: '罕见文物', epic: '珍品', legendary: '🏛️ 国宝', mythic: '🏛️ 传说'
    };

    // 计算稀有度的 JP 奖励
    getJpReward(artifact, era) {
        // legendary/mythic 优先用文物自定义 handOverReward
        if (artifact.handOverReward) return artifact.handOverReward;
        const table = EconomyManager.JP_TABLE[era];
        if (!table) return 20;
        if (artifact.rarity === 'rare') return table.rare;
        if (artifact.rarity === 'epic') return table.epic;
        return 20;
    }

    // 花费经费
    spendFunds(amount) {
        const amountBN = amount instanceof BigNumber ? amount : new BigNumber(amount);
        if (this.gameState.funds.greaterThan(amountBN) || this.gameState.funds.equals(amountBN)) {
            this.gameState.funds = this.gameState.funds.subtract(amountBN);
            return true;
        }
        return false;
    }

    // 获得经费
    addFunds(amount) {
        const amountBN = amount instanceof BigNumber ? amount : new BigNumber(amount);
        this.gameState.funds = this.gameState.funds.add(amountBN);
        this.gameState.earningsThisRun += amountBN.toNumber();
    }

    // 添加基金点（本局累积，需通过提升声望/转生存入永久池）
    addPrestigePoints(points) {
        this.gameState.jackpotPointsThisRun += points;
    }

    // 是否可以支付
    canAfford(amount) {
        const amountBN = amount instanceof BigNumber ? amount : new BigNumber(amount);
        return this.gameState.funds.greaterThan(amountBN) ||
               this.gameState.funds.equals(amountBN);
    }

    // 获得文物后处理 — digCost 用于计算赝品"血亏"退费
    processArtifact(artifact, authenticity, condition, digCost = 0) {
        if (authenticity) {
            // 真品
            const value = this.gameState.calculateArtifactValue(
                artifact.baseValue,
                artifact.rarity,
                condition
            );
            this.addFunds(value);
            this.gameState.totalAuthenticFound++;

            // rare 及以上触发声望选择
            const prestigeRarities = ['rare', 'epic', 'legendary', 'mythic'];
            if (prestigeRarities.includes(artifact.rarity)) {
                if (artifact.isNationalTreasure) {
                    this.gameState.totalNationalTreasures++;
                }
                const jpReward = this.getJpReward(artifact, artifact.era);
                const sellMult = EconomyManager.SELL_MULTIPLIER[artifact.rarity] || 2;
                const label = EconomyManager.RARITY_LABEL[artifact.rarity] || '珍贵文物';
                return {
                    type: 'national_treasure',
                    value: value,
                    artifact: artifact,
                    jpReward: jpReward,
                    sellMultiplier: sellMult,
                    rarityLabel: label
                };
            }

            return { type: 'authentic', value: value, artifact: artifact, condition: condition };
        } else {
            // 赝品 — 血亏！只返还探方成本的 0.5%~2%
            this.gameState.totalFakesFound++;
            const ratio = 0.005 + Math.random() * 0.015;
            const consolation = new BigNumber(Math.max(1, Math.floor(digCost * ratio)));
            this.addFunds(consolation);
            return { type: 'fake', value: consolation, artifact: artifact };
        }
    }

    // 计算本局可以获得的基金点
    calculateJackpotPoints() {
        const basePoints = Math.floor(this.gameState.totalAuthenticFound * 0.25);
        const nationalBonus = this.gameState.totalNationalTreasures * 5;
        return basePoints + nationalBonus;
    }
}

window.EconomyManager = EconomyManager;
