// 文物数据配置
const ArtifactData = {
    // 稀有度定义 — 暴富感：高稀有度=巨大回报
    rarity: {
        common: { name: '普通', color: '#888888', multiplier: 1 },
        uncommon: { name: '少见', color: '#2ecc71', multiplier: 5 },
        rare: { name: '罕见', color: '#3498db', multiplier: 15 },
        epic: { name: '珍品', color: '#9b59b6', multiplier: 50 },
        legendary: { name: '国宝', color: '#f39c12', multiplier: 200 },
        mythic: { name: '传说', color: '#e74c3c', multiplier: 1000 }
    },

    // 品相等级
    condition: {
        ruined: { name: '完全损毁', valueMult: 0.1 },
        fragmentary: { name: '残片', valueMult: 0.5 },
        damaged: { name: '有损', valueMult: 0.8 },
        complete: { name: '完整', valueMult: 1.0 },
        excellent: { name: '精美', valueMult: 2.0 },
        pristine: { name: '完美', valueMult: 5.0 }
    },

    // 文物类型
    types: ['pottery', 'jade', 'bone', 'stone', 'bronze', 'jade_bi', 'oracle_bone',
            'terracotta', 'lacquer', 'silk', 'porcelain', 'gold', 'silver', 'ceramic',
            'painting', 'enamel', 'cloisonne', 'jade_suit', 'bamboo', 'bronze_chariot'],

    // ═══════════ 新石器时代文物 ═══════════
    neolithic: [
        {
            id: 'neolithic_pottery_bowl',
            name: '人面鱼纹彩陶盆',
            era: 'neolithic', type: 'pottery', rarity: 'rare',
            baseValue: 5000, authenticity: 0.8, hasFragments: false,
            description: '仰韶文化代表器物，盆内绘有人面鱼纹，象征生死轮回',
            funFact: '这种人面鱼纹可能是巫师的面具，用于祈求丰收'
        },
        {
            id: 'neolithic_jade_axe', name: '玉琮',
            era: 'neolithic', type: 'jade', rarity: 'epic',
            baseValue: 50000, authenticity: 0.6, hasFragments: true,
            description: '良渚文化玉器之冠，内圆外方，象征天圆地方',
            funFact: '玉琮是良渚先民沟通天地的礼器'
        },
        {
            id: 'neolithic_pottery_zun', name: '鹳鱼石斧图陶缸',
            era: 'neolithic', type: 'pottery', rarity: 'legendary',
            baseValue: 500000, authenticity: 0.4, hasFragments: true,
            isNationalTreasure: true,
            description: '中国现存最早的绘画作品之一，描绘鹳鸟衔鱼和石斧图案',
            funFact: '陶缸上的图案被认为是中国绘画艺术的源头',
            handOverReward: 400
        },
        {
            id: 'neolithic_bone_needle', name: '骨针',
            era: 'neolithic', type: 'bone', rarity: 'common',
            baseValue: 100, authenticity: 0.95, hasFragments: false,
            description: '缝制衣物的重要工具，骨针的出现标志着纺织业的萌芽'
        },
        {
            id: 'neolithic_stone_knife', name: '石刀',
            era: 'neolithic', type: 'stone', rarity: 'common',
            baseValue: 200, authenticity: 0.9, hasFragments: false,
            description: '新石器时代常见工具，用于收割农作物'
        },
        {
            id: 'neolithic_jade_bi', name: '玉璧',
            era: 'neolithic', type: 'jade_bi', rarity: 'uncommon',
            baseValue: 2000, authenticity: 0.7, hasFragments: true,
            description: '天圆地方的宇宙观象征，多用于祭祀'
        },
        {
            id: 'neolithic_pottery_jug', name: '小口尖底瓶',
            era: 'neolithic', type: 'pottery', rarity: 'uncommon',
            baseValue: 1500, authenticity: 0.85, hasFragments: false,
            description: '汲水工具，设计巧妙，可自动立起'
        },
        {
            id: 'neolithic_stone_roller', name: '石磨盘',
            era: 'neolithic', type: 'stone', rarity: 'common',
            baseValue: 300, authenticity: 0.9, hasFragments: false,
            description: '加工粮食的重要工具，原始农业的见证'
        },
        {
            id: 'neolithic_jadeCong', name: '神人兽面纹玉琮',
            era: 'neolithic', type: 'jade', rarity: 'mythic',
            baseValue: 5000000, authenticity: 0.3, hasFragments: true,
            isNationalTreasure: true, isMythic: true,
            description: '良渚玉器最高典范，凝聚五千年前的神秘信仰',
            funFact: '每件神人兽面纹玉琮都是独一无二的',
            handOverReward: 1200
        },
        {
            id: 'neolithic_pottery_wave', name: '波浪纹陶罐',
            era: 'neolithic', type: 'pottery', rarity: 'uncommon',
            baseValue: 1800, authenticity: 0.8, hasFragments: false,
            description: '马家窑文化代表，线条流畅如水波'
        }
    ],

    // ═══════════ 商周时代文物 ═══════════
    shangzhou: [
        {
            id: 'shangzhou_bronze_ding', name: '后母戊鼎',
            era: 'shangzhou', type: 'bronze', rarity: 'legendary',
            baseValue: 5000000, authenticity: 0.5, hasFragments: true,
            isNationalTreasure: true,
            description: '商代青铜器之王，重达832公斤，是世界最大的青铜器',
            funFact: '后母戊鼎需要数百名工匠同时协作才能铸造',
            handOverReward: 2000
        },
        {
            id: 'shangzhou_oracle_bone', name: '甲骨文',
            era: 'shangzhou', type: 'oracle_bone', rarity: 'epic',
            baseValue: 100000, authenticity: 0.6, hasFragments: true,
            description: '中国已知最早的成熟文字，记录商代历史',
            funFact: '甲骨文是汉字的源头'
        },
        {
            id: 'shangzhou_bronze_zun', name: '青铜尊',
            era: 'shangzhou', type: 'bronze', rarity: 'rare',
            baseValue: 30000, authenticity: 0.7, hasFragments: true,
            description: '商代酒器，造型庄重，纹饰精美'
        },
        {
            id: 'shangzhou_jade_bi', name: '龙纹玉璧',
            era: 'shangzhou', type: 'jade_bi', rarity: 'rare',
            baseValue: 20000, authenticity: 0.65, hasFragments: false,
            description: '西周礼器，饰以盘龙纹'
        },
        {
            id: 'shangzhou_bronze_ge', name: '青铜戈',
            era: 'shangzhou', type: 'bronze', rarity: 'common',
            baseValue: 500, authenticity: 0.85, hasFragments: false,
            description: '商周时期常见兵器'
        },
        {
            id: 'shangzhou_pottery_li', name: '印纹硬陶罐',
            era: 'shangzhou', type: 'pottery', rarity: 'uncommon',
            baseValue: 3000, authenticity: 0.75, hasFragments: false,
            description: '商代日常生活用器'
        },
        {
            id: 'shangzhou_jade_huang', name: '玉璜',
            era: 'shangzhou', type: 'jade', rarity: 'uncommon',
            baseValue: 4000, authenticity: 0.7, hasFragments: false,
            description: '祭祀用玉器，形如半璧'
        },
        {
            id: 'shangzhou_bronze_jue', name: '青铜斝',
            era: 'shangzhou', type: 'bronze', rarity: 'rare',
            baseValue: 25000, authenticity: 0.6, hasFragments: true,
            description: '商代温酒器，造型独特'
        },
        {
            id: 'shangzhou_taotie_mask', name: '饕餮纹青铜方鼎',
            era: 'shangzhou', type: 'bronze', rarity: 'legendary',
            baseValue: 3000000, authenticity: 0.45, hasFragments: true,
            isNationalTreasure: true,
            description: '饕餮纹是商代青铜器的标志性纹饰',
            funFact: '饕餮是传说中贪婪的怪兽',
            handOverReward: 1600
        },
        {
            id: 'shangzhou_jade_dragon', name: '玉龙',
            era: 'shangzhou', type: 'jade', rarity: 'epic',
            baseValue: 80000, authenticity: 0.55, hasFragments: false,
            description: '红山文化玉龙，是中华龙图腾的源头',
            funFact: '这条玉龙被称为"中华第一龙"'
        }
    ],

    // ═══════════ 秦汉文物 (10件) ═══════════
    qinhan: [
        {
            id: 'qinhan_terracotta_general', name: '兵马俑将军俑',
            era: 'qinhan', type: 'terracotta', rarity: 'legendary',
            baseValue: 8000000, authenticity: 0.5, hasFragments: true,
            isNationalTreasure: true,
            description: '秦始皇陵出土的高级军官俑，铠甲精细，神情威严',
            funFact: '每尊兵马俑的面部表情都独一无二，千人千面',
            handOverReward: 2400
        },
        {
            id: 'qinhan_bamboo_slips', name: '睡虎地秦简',
            era: 'qinhan', type: 'bamboo', rarity: 'epic',
            baseValue: 200000, authenticity: 0.6, hasFragments: true,
            description: '秦代法律文书竹简，记录了大秦律法的细节',
            funFact: '秦简上的墨迹两千多年后依然清晰可辨'
        },
        {
            id: 'qinhan_bronze_chariot', name: '铜车马',
            era: 'qinhan', type: 'bronze_chariot', rarity: 'mythic',
            baseValue: 50000000, authenticity: 0.35, hasFragments: true,
            isNationalTreasure: true, isMythic: true,
            description: '秦始皇陵陪葬青铜马车，由三千多个零件组成',
            funFact: '铜车马按真实车马的二分之一比例铸造',
            handOverReward: 3500
        },
        {
            id: 'qinhan_jade_suit', name: '金缕玉衣',
            era: 'qinhan', type: 'jade_suit', rarity: 'mythic',
            baseValue: 30000000, authenticity: 0.3, hasFragments: true,
            isNationalTreasure: true, isMythic: true,
            description: '汉代王侯的殓服，用金丝串缀数千玉片制成',
            funFact: '古人相信玉能防腐，使尸身不朽',
            handOverReward: 3000
        },
        {
            id: 'qinhan_lacquer_box', name: '彩绘漆奁',
            era: 'qinhan', type: 'lacquer', rarity: 'rare',
            baseValue: 50000, authenticity: 0.65, hasFragments: false,
            description: '汉代贵族化妆盒，朱黑相间，云气纹环绕',
            funFact: '汉代漆器的制作周期可长达一年'
        },
        {
            id: 'qinhan_bronze_mirror', name: '日光铜镜',
            era: 'qinhan', type: 'bronze', rarity: 'uncommon',
            baseValue: 8000, authenticity: 0.75, hasFragments: false,
            description: '汉代日常用品，镜背铭文"见日之光，天下大明"'
        },
        {
            id: 'qinhan_terracotta_horse', name: '陶马俑',
            era: 'qinhan', type: 'terracotta', rarity: 'epic',
            baseValue: 300000, authenticity: 0.55, hasFragments: true,
            description: '与兵马俑同出的战马陶俑，体态雄健',
            funFact: '陶马高度与真马相当，重达两百多公斤'
        },
        {
            id: 'qinhan_half_liang', name: '秦半两钱',
            era: 'qinhan', type: 'bronze', rarity: 'common',
            baseValue: 2000, authenticity: 0.9, hasFragments: false,
            description: '秦始皇统一货币的见证，外圆内方'
        },
        {
            id: 'qinhan_silk_painting', name: '马王堆帛画',
            era: 'qinhan', type: 'silk', rarity: 'legendary',
            baseValue: 6000000, authenticity: 0.4, hasFragments: true,
            isNationalTreasure: true,
            description: '汉代T形帛画，描绘天上人间地下的宇宙图景',
            funFact: '帛画历经两千年仍色彩鲜艳，堪称奇迹',
            handOverReward: 2000
        },
        {
            id: 'qinhan_bird_seal', name: '封泥印章',
            era: 'qinhan', type: 'bronze', rarity: 'uncommon',
            baseValue: 6000, authenticity: 0.8, hasFragments: false,
            description: '古代文书封印之物，印面刻有官署名',
            funFact: '封泥是古代"快递"的防拆封条'
        }
    ],

    // ═══════════ 盛唐文物 (10件) ═══════════
    tang: [
        {
            id: 'tang_sancai_camel', name: '唐三彩载乐骆驼俑',
            era: 'tang', type: 'ceramic', rarity: 'legendary',
            baseValue: 10000000, authenticity: 0.45, hasFragments: true,
            isNationalTreasure: true,
            description: '骆驼背载八人乐舞队，展现了丝绸之路的繁华',
            funFact: '唐三彩并非只有三种颜色，"三"在古代是多数的意思',
            handOverReward: 2800
        },
        {
            id: 'tang_gold_bowl', name: '鎏金舞马衔杯银壶',
            era: 'tang', type: 'gold', rarity: 'mythic',
            baseValue: 60000000, authenticity: 0.3, hasFragments: true,
            isNationalTreasure: true, isMythic: true,
            description: '唐代金银器巅峰之作，壶身錾刻舞马纹',
            funFact: '唐代宫廷有专门训练马匹跳舞的机构',
            handOverReward: 4200
        },
        {
            id: 'tang_mural_dancer', name: '敦煌飞天壁画残片',
            era: 'tang', type: 'silk', rarity: 'epic',
            baseValue: 500000, authenticity: 0.5, hasFragments: true,
            description: '莫高窟唐代壁画碎片，飞天衣袂飘飘',
            funFact: '敦煌壁画使用了大量进口颜料，如阿富汗的青金石'
        },
        {
            id: 'tang_silver_bowl', name: '鸳鸯莲瓣纹金碗',
            era: 'tang', type: 'gold', rarity: 'epic',
            baseValue: 800000, authenticity: 0.5, hasFragments: false,
            description: '唐代皇室用器，碗壁锤揲出双层莲瓣'
        },
        {
            id: 'tang_bronze_mirror', name: '海兽葡萄镜',
            era: 'tang', type: 'bronze', rarity: 'rare',
            baseValue: 80000, authenticity: 0.6, hasFragments: false,
            description: '镜背饰有海兽和葡萄纹样，唐代铜镜的代表',
            funFact: '葡萄纹样是唐代从西域引入的新装饰元素'
        },
        {
            id: 'tang_sancai_horse', name: '唐三彩马',
            era: 'tang', type: 'ceramic', rarity: 'rare',
            baseValue: 120000, authenticity: 0.6, hasFragments: true,
            description: '唐代三彩釉陶马，膘肥体壮，是西域良马的写照'
        },
        {
            id: 'tang_silk_robe', name: '联珠对兽纹锦',
            era: 'tang', type: 'silk', rarity: 'rare',
            baseValue: 60000, authenticity: 0.55, hasFragments: false,
            description: '唐代丝织品，波斯风格联珠纹，见证丝绸之路贸易'
        },
        {
            id: 'tang_gold_hairpin', name: '金凤钗',
            era: 'tang', type: 'gold', rarity: 'uncommon',
            baseValue: 30000, authenticity: 0.7, hasFragments: false,
            description: '唐代贵妇头饰，凤形展翅，工艺精湛'
        },
        {
            id: 'tang_porcelain_bowl', name: '邢窑白瓷碗',
            era: 'tang', type: 'porcelain', rarity: 'uncommon',
            baseValue: 20000, authenticity: 0.75, hasFragments: false,
            description: '唐代"南青北白"中白瓷的代表，胎质细腻',
            funFact: '唐代白瓷的出现为后世青花瓷奠定了基础'
        },
        {
            id: 'tang_kaiyuan_coin', name: '开元通宝',
            era: 'tang', type: 'bronze', rarity: 'common',
            baseValue: 3000, authenticity: 0.88, hasFragments: false,
            description: '唐代标准货币，流通近三百年',
            funFact: '"开元通宝"四字由书法家欧阳询题写'
        }
    ],

    // ═══════════ 宋元文物 (10件) ═══════════
    songyuan: [
        {
            id: 'song_ru_ware', name: '汝窑天青釉盘',
            era: 'songyuan', type: 'porcelain', rarity: 'mythic',
            baseValue: 100000000, authenticity: 0.25, hasFragments: true,
            isNationalTreasure: true, isMythic: true,
            description: '北宋汝窑存世不足百件，天青釉如"雨过天晴云破处"',
            funFact: '全球现存汝窑完整器不超过70件，件件价值连城',
            handOverReward: 5600
        },
        {
            id: 'song_guan_ware', name: '官窑粉青贯耳瓶',
            era: 'songyuan', type: 'porcelain', rarity: 'legendary',
            baseValue: 30000000, authenticity: 0.35, hasFragments: true,
            isNationalTreasure: true,
            description: '南宋官窑代表作，紫口铁足，金丝铁线',
            funFact: '官窑的釉料配方至今仍是未解之谜',
            handOverReward: 3500
        },
        {
            id: 'song_ge_ware', name: '哥窑冰裂纹洗',
            era: 'songyuan', type: 'porcelain', rarity: 'epic',
            baseValue: 800000, authenticity: 0.5, hasFragments: true,
            description: '宋代五大名窑之一，开片如冰裂，自然天成'
        },
        {
            id: 'song_landscape', name: '溪山行旅图残卷',
            era: 'songyuan', type: 'painting', rarity: 'legendary',
            baseValue: 15000000, authenticity: 0.35, hasFragments: true,
            isNationalTreasure: true,
            description: '范宽代表作，气势磅礴的北宋山水',
            funFact: '范宽在画中树林里藏了自己的签名，直到千年后才被发现',
            handOverReward: 2800
        },
        {
            id: 'yuan_blue_white', name: '元青花鬼谷子下山罐',
            era: 'songyuan', type: 'porcelain', rarity: 'mythic',
            baseValue: 80000000, authenticity: 0.3, hasFragments: true,
            isNationalTreasure: true, isMythic: true,
            description: '元代青花瓷巅峰，描绘鬼谷子下山救孙膑的故事',
            funFact: '元青花使用的钴料"苏麻离青"来自波斯',
            handOverReward: 4900
        },
        {
            id: 'song_jun_ware', name: '钧窑玫瑰紫花盆',
            era: 'songyuan', type: 'porcelain', rarity: 'rare',
            baseValue: 200000, authenticity: 0.55, hasFragments: false,
            description: '宋代钧窑窑变釉，紫红相间如晚霞'
        },
        {
            id: 'song_jiaozi', name: '交子印版',
            era: 'songyuan', type: 'bronze', rarity: 'epic',
            baseValue: 1000000, authenticity: 0.4, hasFragments: true,
            description: '世界上最早的纸币印刷版，宋代成都商人所创',
            funFact: '交子比欧洲最早的纸币早出现了600多年'
        },
        {
            id: 'song_ding_ware', name: '定窑刻花碗',
            era: 'songyuan', type: 'porcelain', rarity: 'uncommon',
            baseValue: 40000, authenticity: 0.7, hasFragments: false,
            description: '宋代白瓷之冠，刻花流畅如行云流水'
        },
        {
            id: 'yuan_silver_cup', name: '银鎏金高足杯',
            era: 'songyuan', type: 'silver', rarity: 'rare',
            baseValue: 60000, authenticity: 0.6, hasFragments: false,
            description: '元代蒙古风格器物，高足造型便于马上饮用'
        },
        {
            id: 'song_compass', name: '指南鱼',
            era: 'songyuan', type: 'bronze', rarity: 'uncommon',
            baseValue: 15000, authenticity: 0.75, hasFragments: false,
            description: '宋代人工磁化指南工具，是世界最早的指南针实物之一',
            funFact: '宋代人将铁片摩擦磁石后制成鱼形，浮于水面即可指南'
        }
    ],

    // ═══════════ 明清文物 (10件) ═══════════
    mingqing: [
        {
            id: 'ming_cloisonne', name: '景泰蓝龙纹大瓶',
            era: 'mingqing', type: 'cloisonne', rarity: 'legendary',
            baseValue: 20000000, authenticity: 0.4, hasFragments: true,
            isNationalTreasure: true,
            description: '明代景泰年间珐琅器巅峰，铜胎掐丝，五色珐琅',
            funFact: '景泰蓝的名字来源于明代宗年号"景泰"',
            handOverReward: 3200
        },
        {
            id: 'qing_enamel_vase', name: '珐琅彩百花不露地瓶',
            era: 'mingqing', type: 'enamel', rarity: 'mythic',
            baseValue: 120000000, authenticity: 0.28, hasFragments: true,
            isNationalTreasure: true, isMythic: true,
            description: '清宫珐琅彩极品，满绘百花，密不透地',
            funFact: '珐琅彩瓷器是清代宫廷专属，民间不得仿造',
            handOverReward: 6300
        },
        {
            id: 'ming_blue_white', name: '永乐青花压手杯',
            era: 'mingqing', type: 'porcelain', rarity: 'epic',
            baseValue: 2000000, authenticity: 0.45, hasFragments: false,
            description: '明代永乐官窑经典器型，胎体厚重，手握有沉坠感',
            funFact: '压手杯因握在手中恰好压住虎口而得名'
        },
        {
            id: 'ming_zisha', name: '供春紫砂壶',
            era: 'mingqing', type: 'ceramic', rarity: 'epic',
            baseValue: 1500000, authenticity: 0.45, hasFragments: false,
            description: '紫砂壶鼻祖供春所制，造型古朴，如树瘿自然',
            funFact: '供春是明代书童，偶然看到老僧制壶而开创紫砂工艺'
        },
        {
            id: 'qing_imperial_seal', name: '和田青白玉玺',
            era: 'mingqing', type: 'jade', rarity: 'legendary',
            baseValue: 25000000, authenticity: 0.38, hasFragments: false,
            isNationalTreasure: true,
            description: '清代皇帝御玺，取材和田优质青白玉',
            funFact: '清代皇帝共刻有二十五方御玺，象征二十五朝',
            handOverReward: 3800
        },
        {
            id: 'ming_folding_fan', name: '文徵明书画折扇',
            era: 'mingqing', type: 'painting', rarity: 'rare',
            baseValue: 300000, authenticity: 0.5, hasFragments: false,
            description: '明四家文徵明的书法折扇，清雅脱俗'
        },
        {
            id: 'qing_peking_glass', name: '套料雕花鼻烟壶',
            era: 'mingqing', type: 'enamel', rarity: 'rare',
            baseValue: 150000, authenticity: 0.55, hasFragments: false,
            description: '清代内画鼻烟壶，方寸之间绘山水人物',
            funFact: '最好的鼻烟壶画师用特制弯头笔从壶口伸入内壁作画'
        },
        {
            id: 'ming_copper_coin', name: '洪武通宝',
            era: 'mingqing', type: 'bronze', rarity: 'common',
            baseValue: 5000, authenticity: 0.85, hasFragments: false,
            description: '明太祖朱元璋铸造的开国钱币'
        },
        {
            id: 'qing_embroidered', name: '苏绣双面猫蝶图',
            era: 'mingqing', type: 'silk', rarity: 'epic',
            baseValue: 600000, authenticity: 0.5, hasFragments: false,
            description: '清代苏绣极品，双面图案完全相同，猫蝶谐音"耄耋"',
            funFact: '猫蝶图寓意长寿，"猫"谐音"耄"，"蝶"谐音"耋"'
        },
        {
            id: 'ming_chenghua_cup', name: '成化斗彩鸡缸杯',
            era: 'mingqing', type: 'porcelain', rarity: 'mythic',
            baseValue: 150000000, authenticity: 0.25, hasFragments: true,
            isNationalTreasure: true, isMythic: true,
            description: '明代成化斗彩瓷器之冠，子母鸡图纹，存世极少',
            funFact: '2014年一只成化斗彩鸡缸杯以2.8亿港元成交',
            handOverReward: 7000
        }
    ],

    // 获取特定时代的文物
    getArtifactsForEra: function(era) {
        const artifacts = this[era];
        if (!artifacts) return [];
        return artifacts;
    },

    // 从特定层位随机获取文物
    getRandomArtifactForSite: function(era, siteRisk) {
        const artifacts = this.getArtifactsForEra(era);
        if (!artifacts || artifacts.length === 0) return null;

        const weights = {
            common: 60,
            uncommon: 25,
            rare: 10,
            epic: 3,
            legendary: 1.5,
            mythic: 0.5
        };

        if (siteRisk > 0.2) {
            weights.rare = 15;
            weights.epic = 5;
            weights.legendary = 3;
        }
        if (siteRisk > 0.3) {
            weights.legendary = 5;
            weights.mythic = 1;
        }

        const totalWeight = artifacts.reduce((sum, a) => sum + (weights[a.rarity] || 1), 0);
        let random = Math.random() * totalWeight;

        for (const artifact of artifacts) {
            random -= weights[artifact.rarity];
            if (random <= 0) {
                return artifact;
            }
        }

        return artifacts[0];
    }
};

window.ArtifactData = ArtifactData;
