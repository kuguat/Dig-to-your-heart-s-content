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
        y: 185
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

    // 调试模式
    debug: true
};

// 导出到全局
window.GameConfig = GameConfig;
