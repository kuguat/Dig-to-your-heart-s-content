// 朝代/时代数据
const EraData = {
    // 新石器时代
    neolithic: {
        id: 'neolithic',
        name: '新石器时代',
        nameEn: 'Neolithic',
        unlockCost: 0, // 初始解锁
        color: '#c4784a',
        bgm: null,
        description: '人类开始制造陶器，彩陶文化绽放光芒',
        // 发掘层位
        sites: [
            {
                id: 'surface',
                name: '地表采集',
                cost: 500,
                risk: 0.05,
                baseReward: 1000,
                description: '陶片、骨器碎片，稳扎稳打'
            },
            {
                id: 'ash_pit',
                name: '灰坑探方',
                cost: 5000,
                risk: 0.1,
                baseReward: 10000,
                description: '完整陶器、石器'
            },
            {
                id: 'burial',
                name: '墓葬发掘',
                cost: 50000,
                risk: 0.15,
                baseReward: 100000,
                description: '珍贵玉器、完整彩陶，可能遇到盗洞'
            },
            {
                id: 'ritual_pit',
                name: '祭祀坑',
                cost: 500000,
                risk: 0.25,
                baseReward: 1000000,
                description: '大型礼器、祭祀用器，可能出土"神器"'
            },
            {
                id: 'deep_sacred',
                name: '神庙遗址',
                cost: 5000000,
                risk: 0.4,
                baseReward: 10000000,
                description: '国之重器，超级头奖级发现'
            }
        ]
    },

    // 商周时代
    shangzhou: {
        id: 'shangzhou',
        name: '夏商周',
        nameEn: 'Shang & Zhou',
        unlockCost: 100, // 需要声望等级
        unlockLevel: 1,
        color: '#5a7a5a',
        bgm: null,
        description: '青铜文明鼎盛，甲骨文记载千古之谜',
        sites: [
            {
                id: 'surface',
                name: '田野采集',
                cost: 5000,
                risk: 0.05,
                baseReward: 10000,
                description: '陶片、青铜碎片'
            },
            {
                id: 'ash_pit',
                name: '手工业作坊',
                cost: 50000,
                risk: 0.1,
                baseReward: 100000,
                description: '青铜兵器、工具'
            },
            {
                id: 'burial',
                name: '贵族墓葬',
                cost: 500000,
                risk: 0.15,
                baseReward: 1000000,
                description: '青铜礼器、玉器'
            },
            {
                id: 'ritual_pit',
                name: '祭祀窖藏',
                cost: 5000000,
                risk: 0.25,
                baseReward: 10000000,
                description: '大型青铜鼎、甲骨卜辞'
            },
            {
                id: 'royal_tomb',
                name: '王陵遗迹',
                cost: 50000000,
                risk: 0.4,
                baseReward: 100000000,
                description: '成套青铜器，可能触发"诅咒"'
            }
        ]
    },

    // 秦汉（简化版）
    qinhan: {
        id: 'qinhan',
        name: '秦汉',
        nameEn: 'Qin & Han',
        unlockCost: 500,
        unlockLevel: 2,
        color: '#6b5b4f',
        description: '大一统帝国，威加海内',
        sites: [
            { id: 'surface', name: '边陲烽燧', cost: 50000, risk: 0.05, baseReward: 100000 },
            { id: 'ash_pit', name: '官署遗址', cost: 500000, risk: 0.1, baseReward: 1000000 },
            { id: 'burial', name: '贵族墓葬', cost: 5000000, risk: 0.15, baseReward: 10000000 }
        ]
    },

    // 唐（简化版）
    tang: {
        id: 'tang',
        name: '盛唐',
        nameEn: 'Tang Dynasty',
        unlockCost: 2000,
        unlockLevel: 3,
        color: '#c9a227',
        description: '盛世华章，万国来朝',
        sites: [
            { id: 'surface', name: '丝绸之路驿站', cost: 500000, risk: 0.05, baseReward: 1000000 },
            { id: 'ash_pit', name: '陶瓷作坊', cost: 5000000, risk: 0.1, baseReward: 10000000 },
            { id: 'burial', name: '贵族墓葬', cost: 50000000, risk: 0.15, baseReward: 100000000 }
        ]
    },

    // 宋元（简化版）
    songyuan: {
        id: 'songyuan',
        name: '宋元',
        nameEn: 'Song & Yuan',
        unlockCost: 10000,
        unlockLevel: 4,
        color: '#7fb3d5',
        description: '文人雅士，瓷器巅峰',
        sites: [
            { id: 'surface', name: '古镇遗址', cost: 5000000, risk: 0.05, baseReward: 10000000 },
            { id: 'ash_pit', name: '瓷窑遗址', cost: 50000000, risk: 0.1, baseReward: 100000000 },
            { id: 'burial', name: '士大夫墓', cost: 500000000, risk: 0.15, baseReward: 1000000000 }
        ]
    },

    // 明清（简化版）
    mingqing: {
        id: 'mingqing',
        name: '明清',
        nameEn: 'Ming & Qing',
        unlockCost: 50000,
        unlockLevel: 5,
        color: '#8e44ad',
        description: '皇权极盛，工艺巅峰',
        sites: [
            { id: 'surface', name: '民居遗址', cost: 50000000, risk: 0.05, baseReward: 100000000 },
            { id: 'ash_pit', name: '官窑遗址', cost: 500000000, risk: 0.1, baseReward: 1000000000 },
            { id: 'burial', name: '王公墓葬', cost: 5000000000, risk: 0.15, baseReward: 10000000000 }
        ]
    }
};

// 获取所有解锁的朝代
function getUnlockedEras(prestigeLevel) {
    const unlocked = [];
    for (const key in EraData) {
        const era = EraData[key];
        if (era.unlockLevel !== undefined) {
            if (prestigeLevel >= era.unlockLevel) {
                unlocked.push(era);
            }
        } else {
            unlocked.push(era); // 初始解锁
        }
    }
    return unlocked;
}

window.EraData = EraData;
window.getUnlockedEras = getUnlockedEras;
