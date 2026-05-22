/**
 * 大数类 - 支持 $1 ~ $10^60 范围
 * 使用科学计数法显示
 */
class BigNumber {
    constructor(mantissa = 0, exponent = 0) {
        if (typeof mantissa === 'string') {
            this.parseString(mantissa);
        } else {
            this.mantissa = mantissa;
            this.exponent = exponent;
            this.normalize();
        }
    }

    // 从字符串解析
    parseString(str) {
        str = str.toString().replace(/,/g, '');
        const num = parseFloat(str);
        if (isNaN(num) || num === 0) {
            this.mantissa = 0;
            this.exponent = 0;
        } else {
            this.exponent = Math.floor(Math.log10(Math.abs(num)));
            this.mantissa = num / Math.pow(10, this.exponent);
        }
    }

    // 归一化 (mantissa ∈ [1, 10), exponent = log10 整数部分)
    normalize() {
        if (this.mantissa === 0) {
            this.exponent = 0;
            return;
        }
        while (Math.abs(this.mantissa) >= 10) {
            this.mantissa /= 10;
            this.exponent++;
        }
        while (Math.abs(this.mantissa) < 1 && this.mantissa !== 0) {
            this.mantissa *= 10;
            this.exponent--;
        }
    }

    // 转为数字（可能丢失精度）
    toNumber() {
        return this.mantissa * Math.pow(10, this.exponent);
    }

    // 格式化显示
    toString() {
        if (this.mantissa === 0) return '0';

        const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

        if (this.exponent < 3) {
            return Math.floor(this.toNumber()).toLocaleString();
        }

        const suffixIndex = Math.floor(this.exponent / 3);
        if (suffixIndex < suffixes.length) {
            const displayValue = this.mantissa * Math.pow(10, this.exponent % 3);
            if (displayValue >= 100) {
                return Math.floor(displayValue) + suffixes[suffixIndex];
            } else if (displayValue >= 10) {
                return displayValue.toFixed(1) + suffixes[suffixIndex];
            } else {
                return displayValue.toFixed(2) + suffixes[suffixIndex];
            }
        }

        return this.mantissa.toFixed(2) + 'e' + this.exponent;
    }

    // 中文格式化
    toChineseString() {
        if (this.mantissa === 0) return '零';

        const chineseSuffixes = ['', '万', '亿', '兆', '京'];
        const num = this.toNumber();

        if (num < 10000) {
            return Math.floor(num).toLocaleString();
        }

        // 简化显示
        if (this.exponent < 4) {
            return (num / 10000).toFixed(1) + '万';
        } else if (this.exponent < 8) {
            return (num / 100000000).toFixed(1) + '亿';
        } else {
            return this.toString();
        }
    }

    // 加法
    add(other) {
        const a = this.toNumber();
        const b = other instanceof BigNumber ? other.toNumber() : other;
        return new BigNumber(a + b);
    }

    // 减法
    subtract(other) {
        const a = this.toNumber();
        const b = other instanceof BigNumber ? other.toNumber() : other;
        return new BigNumber(Math.max(0, a - b));
    }

    // 乘法
    multiply(other) {
        const a = this.toNumber();
        const b = other instanceof BigNumber ? other.toNumber() : other;
        return new BigNumber(a * b);
    }

    // 除法
    divide(other) {
        const a = this.toNumber();
        const b = other instanceof BigNumber ? other.toNumber() : other;
        if (b === 0) return new BigNumber(0);
        return new BigNumber(a / b);
    }

    // 比较
    compare(other) {
        const a = this.toNumber();
        const b = other instanceof BigNumber ? other.toNumber() : other;
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
    }

    // 是否大于
    greaterThan(other) {
        return this.compare(other) > 0;
    }

    // 是否小于
    lessThan(other) {
        return this.compare(other) < 0;
    }

    // 是否等于
    equals(other) {
        return this.compare(other) === 0;
    }

    // 静态方法
    static get Zero() { return new BigNumber(0); }
    static get One() { return new BigNumber(1); }
    static fromNumber(n) { return new BigNumber(n); }
}

// 导出
window.BigNumber = BigNumber;
