// 游戏全局配置
const GameConfig = {
    // 画布尺寸
    width: 1200,
    height: 800,

    // 缩放模式（会在 game.js 中设置）

    // 背景颜色
    backgroundColor: '#1a0f0a',

    // 发掘区域尺寸
    excavation: {
        width: 500,
        height: 400,
        x: 350,
        y: 155
    },

    // 颜色主题
    colors: {
        primary: '#d4a574',      // 主色调（土金色）
        secondary: '#8b7355',     // 次要色
        accent: '#f4d03f',        // 强调色（金色）
        danger: '#c0392b',        // 危险/赝品
        success: '#27ae60',       // 成功/真品
        panel: '#2c1810',         // 面板背景
        panelLight: '#3d2817',    // 面板高亮
        text: '#f5e6d3',         // 文字颜色
        textDim: '#a08060'        // 次要文字
    },

    // 朝代配色
    eraColors: {
        neolithic: '#c4784a',     // 新石器（赭红）
        shangzhou: '#5a7a5a',    // 商周（青铜绿）
        qinhan: '#6b5b4f',       // 秦汉（黑灰）
        tang: '#c9a227',         // 唐（金色）
        song: '#7fb3d5',          // 宋（青白）
        mingqing: '#8e44ad'       // 明清（紫）
    },

    // 音效配置
    audio: {
        enabled: true,
        volume: 0.5
    },

    // 字体排版
    typography: {
        fontFamily: 'KaiTi',          // 楷体，Win/Mac 自带，书法质感
        mysteryFont: 'serif',         // 发掘中问号?用的装饰字体
        size: {
            micro:   '11px',
            tiny:    '12px',
            caption: '13px',
            small:   '14px',
            body:    '15px',
            bodyMd:  '16px',
            subhead: '17px',
            title:   '20px',
            h3:      '22px',
            h2sm:    '24px',
            h2:      '26px',
            h1sm:    '28px',
            h1:      '30px',
            display: '34px',
            hero:    '38px',
            giant:   '52px'
        }
    },

    // 调试模式
    debug: true
};

/**
 * 快捷文字样式工厂 — 所有场景统一入口
 * @param {string} sizeKey  字号键名（如 'body' 'subhead' 'h2'）
 * @param {object} overrides  覆盖属性（color, fontStyle, align 等）
 * @returns {object} 可直接传入 add.text() 的样式对象
 */
GameConfig.ts = function(sizeKey, overrides) {
    var base = GameConfig.typography;
    var style = { fontFamily: base.fontFamily, fontSize: base.size[sizeKey] || '14px' };
    if (overrides) {
        var keys = Object.keys(overrides);
        for (var i = 0; i < keys.length; i++) {
            style[keys[i]] = overrides[keys[i]];
        }
    }
    return style;
};

// 导出到全局
window.GameConfig = GameConfig;
