/**
 * 经济系统管理器
 */
class EconomyManager {
    constructor(gameState) {
        this.gameState = gameState;
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
    }

    // 添加基金点
    addPrestigePoints(points) {
        this.gameState.prestigePoints += points;
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
            // 真品 — 暴富！稀有度倍率已大幅提升
            const value = this.gameState.calculateArtifactValue(
                artifact.baseValue,
                artifact.rarity,
                condition
            );
            this.addFunds(value);
            this.gameState.totalAuthenticFound++;

            if (artifact.isNationalTreasure) {
                this.gameState.totalNationalTreasures++;
                return { type: 'national_treasure', value: value, artifact: artifact };
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
