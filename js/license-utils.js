/**
 * 许可证工具类 - 提供许可证解析、验证和状态管理功能
 */
const LicenseUtils = {
    /**
     * 存储许可证数据到本地
     * @param {Object} licenseData - 许可证数据对象
     */
    saveLicense: function(licenseData) {
        try {
            localStorage.setItem('licenseData', JSON.stringify(licenseData));
            localStorage.setItem('lastUpdateTime', new Date().toISOString());
        } catch (e) {
            console.error('保存许可证失败:', e);
            throw new Error('保存许可证失败，请检查本地存储权限');
        }
    },

    /**
     * 从本地获取许可证数据
     * @returns {Object|null} 许可证数据对象或null
     */
    getLicense: function() {
        try {
            const licenseStr = localStorage.getItem('licenseData');
            if (!licenseStr) return null;
            return JSON.parse(licenseStr);
        } catch (e) {
            console.error('解析许可证失败:', e);
            return null;
        }
    },

    /**
     * 清除本地许可证数据
     */
    clearLicense: function() {
        localStorage.removeItem('licenseData');
        localStorage.removeItem('lastUpdateTime');
    },

    /**
     * 检查许可证状态
     * @returns {Object} 包含状态信息的对象
     */
    checkLicenseStatus: function() {
        const license = this.getLicense();
        if (!license) {
            return {
                status: '未授权',
                isAuthorized: false,
                daysRemaining: 0
            };
        }

        // 检查是否为永久授权
        if (license.authType === '永久授权') {
            return {
                status: '已授权',
                isAuthorized: true,
                authType: license.authType,
                authUser: license.authUser,
                expireDate: '永久',
                daysRemaining: Infinity,
                authModules: license.authModules
            };
        }

        // 检查授权是否过期
        const today = new Date();
        const expireDate = new Date(license.expireDate);
        const timeDiff = expireDate - today;
        const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysRemaining <= 0) {
            return {
                status: '已过期',
                isAuthorized: false,
                daysRemaining: 0,
                expireDate: license.expireDate
            };
        }

        return {
            status: '已授权',
            isAuthorized: true,
            authType: license.authType,
            authUser: license.authUser,
            expireDate: license.expireDate,
            daysRemaining: daysRemaining,
            authModules: license.authModules
        };
    },

    /**
     * 验证许可证文件
     * @param {string} licenseContent - 许可证内容
     * @param {string} machineCode - 当前机器码
     * @returns {Object} 验证结果
     */
    validateLicense: function(licenseContent, machineCode) {
        try {
            const license = JSON.parse(licenseContent);

            // 检查机器码是否匹配
            if (license.machineCode !== machineCode) {
                return {
                    valid: false,
                    message: '授权机器码与当前机器码不一致，请联系管理员重新提供许可证！',
                    license: null
                };
            }

            // 验证授权验证码
            const verificationStr = machineCode + license.authUser + license.generationDate;
            const verificationCode = CryptoUtils.generateAuthVerificationCode(
                machineCode, license.authUser, license.generationDate
            );

            if (license.authVerificationCode !== verificationCode) {
                return {
                    valid: false,
                    message: '授权验证码错误，请联系管理员重新提供许可证！',
                    license: null
                };
            }

            // 验证日期格式
            if (license.authType !== '永久授权' && !this.isValidDate(license.expireDate)) {
                return {
                    valid: false,
                    message: '许可证过期日期格式无效',
                    license: null
                };
            }

            return {
                valid: true,
                message: '验证成功',
                license: license
            };
        } catch (e) {
            return {
                valid: false,
                message: '许可证格式错误: ' + e.message,
                license: null
            };
        }
    },

    /**
     * 验证日期格式是否有效
     * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)
     * @returns {boolean} 是否有效的日期
     */
    isValidDate: function(dateStr) {
        const date = new Date(dateStr);
        return !isNaN(date.getTime()) && dateStr === date.toISOString().split('T')[0];
    },

    /**
     * 解析LIC文件内容
     * @param {string} fileContent - 文件内容
     * @returns {Object|null} 解析后的许可证对象
     */
    parseLicenseFile: function(fileContent) {
        try {
            return JSON.parse(fileContent);
        } catch (e) {
            console.error('解析许可证文件失败:', e);
            return null;
        }
    }
};

// 挂载到window对象供全局使用
window.LicenseUtils = LicenseUtils;