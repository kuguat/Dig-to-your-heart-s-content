/**
 * AudioManager - 程序化音效系统 (Web Audio API)
 * 无需任何外部音频文件，所有音效纯代码生成
 */
class AudioManager {
    constructor() {
        this.enabled = GameConfig.audio.enabled;
        this.masterVolume = GameConfig.audio.volume;
        this.ctx = null;
        this.sounds = {};
        this._initialized = false;
    }

    init() {
        if (this._initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this._initialized = true;
            console.log('AudioManager: Web Audio 已初始化');
        } catch (e) {
            console.warn('AudioManager: Web Audio 不可用', e);
            this.enabled = false;
        }
    }

    setEnabled(val) {
        this.enabled = val;
        GameConfig.audio.enabled = val;
        if (val && !this._initialized) this.init();
    }

    setVolume(v) {
        this.masterVolume = Phaser.Math.Clamp(v, 0, 1);
        GameConfig.audio.volume = this.masterVolume;
    }

    /** 确保 AudioContext 已启动，返回 Promise */
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            return this.ctx.resume().then(() => {
                console.log('AudioManager: AudioContext 已恢复, state=' + this.ctx.state);
            }).catch(e => {
                console.warn('AudioManager: AudioContext 恢复失败', e);
            });
        }
        return Promise.resolve();
    }

    // ── 工具方法 ──

    _gain(value = 1) {
        const g = this.ctx.createGain();
        g.gain.value = value * this.masterVolume;
        g.connect(this.ctx.destination);
        return g;
    }

    _osc(type, freq, gainNode, detune = 0) {
        const o = this.ctx.createOscillator();
        o.type = type;
        o.frequency.value = freq;
        o.detune.value = detune;
        o.connect(gainNode);
        return o;
    }

    _noise(duration, gainNode, bandHz = null) {
        const bufSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

        const src = this.ctx.createBufferSource();
        src.buffer = buffer;

        if (bandHz) {
            const bp = this.ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.value = bandHz;
            bp.Q.value = 0.5;
            src.connect(bp);
            bp.connect(gainNode);
        } else {
            src.connect(gainNode);
        }
        return src;
    }

    _playTone(freq, duration, type = 'sine', gainVal = 0.3, rampDown = 0.1) {
        const g = this._gain(gainVal);
        const o = this._osc(type, freq, g);
        g.gain.setValueAtTime(gainVal * this.masterVolume, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        o.start(this.ctx.currentTime);
        o.stop(this.ctx.currentTime + duration + rampDown);
        return { gain: g, osc: o };
    }

    // ── 音效 ──

    /** 挖掘刮土声 */
    dig() {
        if (!this.enabled || !this._initialized) return;
        this.resume();
        const g = this._gain(0.25);
        g.gain.setValueAtTime(0.25 * this.masterVolume, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

        const noise = this._noise(0.08, g, 800);
        noise.playbackRate.value = 0.5 + Math.random() * 0.5;
        noise.start(this.ctx.currentTime);
        noise.stop(this.ctx.currentTime + 0.1);

        // 轻微的打击感
        const o = this._osc('sine', 200 + Math.random() * 100, g);
        o.start(this.ctx.currentTime);
        o.stop(this.ctx.currentTime + 0.05);
    }

    /** 地层突破 */
    layerBreak() {
        if (!this.enabled || !this._initialized) return;
        this.resume();
        const now = this.ctx.currentTime;
        const g = this._gain(0.35);

        // 低频鼓点
        const o1 = this._osc('triangle', 60, g);
        const g1 = this.ctx.createGain();
        g1.gain.setValueAtTime(0.5 * this.masterVolume, now);
        g1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        o1.connect(g1); g1.connect(this.ctx.destination);
        o1.start(now); o1.stop(now + 0.3);

        // 碎石声
        const noise = this._noise(0.15, g, 2000);
        noise.start(now);
        noise.stop(now + 0.2);
    }

    /** 小发现叮咚 */
    smallFind() {
        if (!this.enabled || !this._initialized) return;
        this.resume();
        const g = this._gain(0.25);
        const freqs = [523, 659, 784]; // C5 E5 G5
        freqs.forEach((f, i) => {
            const o = this._osc('sine', f, g);
            const t = this.ctx.currentTime + i * 0.08;
            o.start(t); o.stop(t + 0.15);
        });
    }

    /** 文物出土 - 普通/少见 */
    discover(rarity = 'common') {
        if (!this.enabled || !this._initialized) return;
        this.resume();
        const now = this.ctx.currentTime;
        const g = this._gain(0.3);

        // 上升琶音
        const baseFreq = rarity === 'epic' || rarity === 'legendary' ? 440 : 330;
        const notes = [0, 4, 7, 12]; // 大三和弦+八度
        notes.forEach((semi, i) => {
            const o = this._osc('triangle', baseFreq * Math.pow(2, semi / 12), g);
            const t = now + i * 0.1;
            const localG = this.ctx.createGain();
            localG.gain.setValueAtTime(0.2 * this.masterVolume, t);
            localG.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            o.connect(localG); localG.connect(this.ctx.destination);
            o.start(t); o.stop(t + 0.35);
        });
    }

    /** 国宝出土 - 隆重 */
    nationalTreasure() {
        if (!this.enabled || !this._initialized) return;
        this.resume();
        const now = this.ctx.currentTime;
        const g = this._gain(0.4);

        // 铜铃合奏 - 多八度大三和弦
        const notes = [
            { f: 523, t: 0 }, { f: 659, t: 0.05 }, { f: 784, t: 0.1 },
            { f: 1046, t: 0.15 }, { f: 1318, t: 0.2 }, { f: 1568, t: 0.25 }
        ];
        notes.forEach(n => {
            const o = this._osc('triangle', n.f, g);
            const t = now + n.t;
            o.start(t); o.stop(t + 0.6);
        });

        // 低频鼓
        const bassG = this.ctx.createGain();
        bassG.gain.setValueAtTime(0.4 * this.masterVolume, now);
        bassG.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        bassG.connect(this.ctx.destination);
        const bass = this._osc('sine', 55, bassG);
        bass.start(now); bass.stop(now + 0.8);
    }

    /** 传说出土 - 更宏大 */
    mythic() {
        if (!this.enabled || !this._initialized) return;
        this.resume();
        const now = this.ctx.currentTime;
        const g = this._gain(0.45);

        // 全和弦
        [0, 4, 7, 12, 16, 19, 24].forEach((semi, i) => {
            const o = this._osc('triangle', 440 * Math.pow(2, semi / 12), g);
            const t = now + i * 0.07;
            o.start(t); o.stop(t + 0.8);
        });
        // 低音
        const bassG = this.ctx.createGain();
        bassG.gain.setValueAtTime(0.5 * this.masterVolume, now);
        bassG.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        bassG.connect(this.ctx.destination);
        const bass = this._osc('sine', 44, bassG);
        bass.start(now); bass.stop(now + 1.0);
    }

    /** UI 点击 */
    click() {
        if (!this.enabled || !this._initialized) return;
        this.resume();
        this._playTone(800, 0.05, 'square', 0.08);
    }

    /** UI 悬停 */
    hover() {
        if (!this.enabled || !this._initialized) return;
        this.resume();
        this._playTone(1200, 0.03, 'sine', 0.04);
    }

    /** 升级成功 */
    upgrade() {
        if (!this.enabled || !this._initialized) return;
        this.resume();
        const g = this._gain(0.25);
        [523, 659, 784, 1046].forEach((f, i) => {
            const o = this._osc('square', f, g);
            const t = this.ctx.currentTime + i * 0.06;
            o.start(t); o.stop(t + 0.12);
        });
    }

    /** 转生 */
    prestige() {
        if (!this.enabled || !this._initialized) return;
        this.resume();
        const now = this.ctx.currentTime;
        const g = this._gain(0.5);

        // 缓慢上升的和弦
        [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => {
            const o = this._osc('triangle', f, g);
            const t = now + i * 0.15;
            o.start(t); o.stop(t + 1.5 - i * 0.1);
        });

        // 持续低频
        const bassG = this.ctx.createGain();
        bassG.gain.setValueAtTime(0.3 * this.masterVolume, now);
        bassG.gain.linearRampToValueAtTime(0.5 * this.masterVolume, now + 0.5);
        bassG.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
        bassG.connect(this.ctx.destination);
        const bass = this._osc('sawtooth', 55, bassG);
        bass.start(now); bass.stop(now + 2.0);
    }

    /** 金币入账 */
    coin() {
        if (!this.enabled || !this._initialized) return;
        this.resume();
        this._playTone(1400, 0.08, 'sine', 0.15);
        setTimeout(() => {
            if (this._initialized) this._playTone(1760, 0.06, 'sine', 0.12);
        }, 50);
    }

    /** 鉴定结果 - 真品 */
    authentic() {
        if (!this.enabled || !this._initialized) return;
        this.resume();
        const g = this._gain(0.3);
        [523, 659, 784, 1046].forEach((f, i) => {
            const o = this._osc('triangle', f, g);
            const t = this.ctx.currentTime + i * 0.1;
            o.start(t); o.stop(t + 0.25);
        });
    }

    /** 鉴定结果 - 赝品 */
    fake() {
        if (!this.enabled || !this._initialized) return;
        this.resume();
        this._playTone(200, 0.3, 'sawtooth', 0.15);
        setTimeout(() => {
            if (this._initialized) this._playTone(150, 0.3, 'sawtooth', 0.12);
        }, 150);
    }

    /** 任务完成（清理探方/修复陶片） */
    jobComplete() {
        if (!this.enabled || !this._initialized) return;
        this.resume();
        const g = this._gain(0.25);
        // C-E-G-C 和弦
        [523, 659, 784, 1046].forEach((f, i) => {
            const o = this._osc('sine', f, g);
            const t = this.ctx.currentTime + i * 0.12;
            o.start(t); o.stop(t + 0.35);
        });
    }

    /** 购买/花钱 */
    purchase() {
        if (!this.enabled || !this._initialized) return;
        this.resume();
        this._playTone(600, 0.06, 'triangle', 0.2);
        setTimeout(() => this._playTone(500, 0.06, 'triangle', 0.15), 40);
    }

    /** 情报获取 */
    info() {
        if (!this.enabled || !this._initialized) return;
        this.resume();
        this._playTone(660, 0.15, 'sine', 0.18);
    }

    // BGM 已移除，用户准备自行提供 BGM 文件
}

// 公开到全局
window.AudioManager = AudioManager;
