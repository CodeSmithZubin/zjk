/**
 * 加密工具类 - 提供MD5加密和机器码生成功能
 */
const CryptoUtils = {
    /**
     * MD5加密实现
     * @param {string} str - 需要加密的字符串
     * @returns {string} MD5加密结果
     */
    md5: function(str) {
        // 简化的MD5实现，实际项目中可替换为更完善的实现
        const crypto = {
            md5: function(s) {
                function L(k, d) { return (k << d) | (k >>> (32 - d)); }
                function K(k, d) { return k + d & 4294967295; }
                function I(k, d) { return k >>> d; }
                function H(k, d, c) { return k & d | ~k & c; }
                function G(k, d, c) { return k & c | d & ~c; }
                function F(k, d, c) { return k ^ d ^ c; }
                function E(k, d, c) { return d ^ (k | ~c); }
                function D(k, d, c, e, a, b, f) {
                    k = K(k, H(d, c, e));
                    return K(L(k, a), b) ^ K(I(k, f), k);
                }
                function C(k, d, c, e, a, b, f) {
                    k = K(k, G(d, c, e));
                    return K(L(k, a), b) ^ K(I(k, f), k);
                }
                function B(k, d, c, e, a, b, f) {
                    k = K(k, F(d, c, e));
                    return K(L(k, a), b) ^ K(I(k, f), k);
                }
                function A(k, d, c, e, a, b, f) {
                    k = K(k, E(d, c, e));
                    return K(L(k, a), b) ^ K(I(k, f), k);
                }
                function q(k) {
                    let d = "", c = 0;
                    for (; 3 >= c; c++)
                        d += String.fromCharCode(k >>> 8 * c & 255);
                    return d;
                }
                function r(k) {
                    let d = 0, c = 0;
                    for (; c < k.length; c++)
                        d = K(d << 8, k.charCodeAt(c) & 255);
                    return d;
                }
                let u = [], v = [], t = 1732584193, w = 4023233417,
                    x = 2562383102, y = 271733878;
                s = unescape(encodeURI(s));
                for (let z = 0; z < s.length; z++)
                    u[z >> 2] |= s.charCodeAt(z) << 8 * (z % 4);
                u[s.length >> 2] |= 128 << 8 * (s.length % 4);
                u[14 + (s.length + 8 >> 6)] = 8 * s.length;
                for (z = 0; z < u.length; z += 16) {
                    let la = t, lb = w, lc = x, ld = y;
                    t = D(t, w, x, y, u[z + 0], 7, 3614090360);
                    y = D(y, t, w, x, u[z + 1], 12, 3905402710);
                    x = D(x, y, t, w, u[z + 2], 17, 606105819);
                    w = D(w, x, y, t, u[z + 3], 22, 3250441966);
                    t = D(t, w, x, y, u[z + 4], 7, 4118548399);
                    y = D(y, t, w, x, u[z + 5], 12, 1200080426);
                    x = D(x, y, t, w, u[z + 6], 17, 2821735955);
                    w = D(w, x, y, t, u[z + 7], 22, 425623219);
                    t = D(t, w, x, y, u[z + 8], 7, 1770035416);
                    y = D(y, t, w, x, u[z + 9], 12, 2336552879);
                    x = D(x, y, t, w, u[z + 10], 17, 4294925233);
                    w = D(w, x, y, t, u[z + 11], 22, 2304563134);
                    t = D(t, w, x, y, u[z + 12], 7, 1804603682);
                    y = D(y, t, w, x, u[z + 13], 12, 4254626195);
                    x = D(x, y, t, w, u[z + 14], 17, 2792965006);
                    w = D(w, x, y, t, u[z + 15], 22, 1236535329);
                    t = C(t, w, x, y, u[z + 1], 5, 4129170786);
                    y = C(y, t, w, x, u[z + 6], 9, 3225465664);
                    x = C(x, y, t, w, u[z + 11], 14, 643717713);
                    w = C(w, x, y, t, u[z + 0], 20, 3921069994);
                    t = C(t, w, x, y, u[z + 5], 5, 3593408605);
                    y = C(y, t, w, x, u[z + 10], 9, 38016083);
                    x = C(x, y, t, w, u[z + 15], 14, 3634488961);
                    w = C(w, x, y, t, u[z + 4], 20, 3889429448);
                    t = C(t, w, x, y, u[z + 9], 5, 568446438);
                    y = C(y, t, w, x, u[z + 14], 9, 3275163606);
                    x = C(x, y, t, w, u[z + 3], 14, 4107603335);
                    w = C(w, x, y, t, u[z + 8], 20, 1163531501);
                    t = C(t, w, x, y, u[z + 13], 5, 2850285829);
                    y = C(y, t, w, x, u[z + 2], 9, 4243563512);
                    x = C(x, y, t, w, u[z + 7], 14, 1735328473);
                    w = C(w, x, y, t, u[z + 12], 20, 2368359562);
                    t = B(t, w, x, y, u[z + 5], 4, 4294588738);
                    y = B(y, t, w, x, u[z + 8], 11, 2272392833);
                    x = B(x, y, t, w, u[z + 11], 11, 1839030562);
                    w = B(w, x, y, t, u[z + 14], 16, 4259657740);
                    t = B(t, w, x, y, u[z + 1], 23, 2763975236);
                    y = B(y, t, w, x, u[z + 4], 4, 1272893353);
                    x = B(x, y, t, w, u[z + 7], 11, 4139469664);
                    w = B(w, x, y, t, u[z + 10], 11, 3200236656);
                    t = B(t, w, x, y, u[z + 13], 16, 681279174);
                    y = B(y, t, w, x, u[z + 0], 23, 3936430074);
                    x = B(x, y, t, w, u[z + 3], 4, 3572445317);
                    w = B(w, x, y, t, u[z + 6], 11, 76029189);
                    t = B(t, w, x, y, u[z + 9], 16, 3654602809);
                    y = B(y, t, w, x, u[z + 12], 23, 3873151461);
                    t = A(t, w, x, y, u[z + 0], 6, 530742520);
                    y = A(y, t, w, x, u[z + 7], 10, 4245155468);
                    x = A(x, y, t, w, u[z + 14], 15, 1718768411);
                    w = A(w, x, y, t, u[z + 5], 21, 2456288799);
                    t = A(t, w, x, y, u[z + 12], 6, 4293915773);
                    y = A(y, t, w, x, u[z + 3], 10, 2272705578);
                    x = A(x, y, t, w, u[z + 10], 15, 1839903658);
                    w = A(w, x, y, t, u[z + 1], 21, 4259657740);
                    t = A(t, w, x, y, u[z + 8], 6, 2763975236);
                    y = A(y, t, w, x, u[z + 15], 10, 1272893353);
                    x = A(x, y, t, w, u[z + 6], 15, 4139469664);
                    w = A(w, x, y, t, u[z + 13], 21, 3200236656);
                    t = A(t, w, x, y, u[z + 4], 6, 681279174);
                    y = A(y, t, w, x, u[z + 11], 10, 3936430074);
                    x = A(x, y, t, w, u[z + 2], 15, 3572445317);
                    w = A(w, x, y, t, u[z + 9], 21, 76029189);
                    t = K(t, la);
                    w = K(w, lb);
                    x = K(x, lc);
                    y = K(y, ld);
                }
                return q(t) + q(w) + q(x) + q(y);
            }
        };

        // 修复MD5输出为标准32位十六进制字符串
        let hash = crypto.md5(str);
        let hex = '';
        for (let i = 0; i < hash.length; i++) {
            let charCode = hash.charCodeAt(i);
            let hexVal = charCode.toString(16);
            // 确保每个字符转换为2位十六进制
            hex += hexVal.length === 1 ? '0' + hexVal : hexVal;
        }
        return hex;
    },

    /**
     * 生成机器码
     * 根据硬件信息生成8位长度的机器码
     * @returns {string} 8位机器码
     */
    generateMachineCode: function() {
        // 收集设备硬件相关信息作为指纹
        const fingerprint = [
            navigator.userAgent,
            screen.width,
            screen.height,
            screen.colorDepth,
            navigator.language || navigator.userLanguage,
            navigator.hardwareConcurrency || '',
            navigator.deviceMemory || '',
            // 添加更多硬件相关信息
            navigator.platform,
            navigator.maxTouchPoints || ''
        ].join('|');
        
        // 生成MD5哈希
        const md5Hash = this.md5(fingerprint);
        
        // 截取前8位并转为大写
        return md5Hash.substring(0, 8).toUpperCase();
    },

    /**
     * 生成授权验证码
     * @param {string} machineCode - 机器码
     * @param {string} authUser - 授权用户
     * @param {string} generationDate - 生成日期 (YYYY-MM-DD)
     * @returns {string} 授权验证码
     */
    generateAuthVerificationCode: function(machineCode, authUser, generationDate) {
        const data = machineCode + authUser + generationDate;
        return this.md5(data);
    }
};

// 挂载到window对象供全局使用
window.CryptoUtils = CryptoUtils;