/**
 * 专家库业务登录与注册许可证校验授权码升级接口的“Argon2（集成yinaje密钥增强版）”的密码与验证码验证脚本
 *1、许可证生成中的授权校验码的升级加密算法；
 *2、登录系统的备用介入算法，升级待调用接口获取的api支持的调用脚本
 *基于 JavaScript 的密码及校验码验证系统，集成Argon2算法与混合yinaje的key值密钥，并提供完整的哈希生成、验证和解析功能，调整并重新封装算法与解析脚本
  集成 yinaje 密钥：
    自定义密钥 YINAJE_KEY 增强安全性
    实现了 _mixWithKey 方法将密钥与密码混合
    密钥嵌入到密码中间位置，增加破解难度
  安全增强：
    使用 Argon2id 算法（抗 GPU 和时序攻击）
    采用高内存成本（64MB）和合理迭代次数
    自动生成随机盐并存储在哈希字符串中;
  完整功能：
    哈希生成：hashPassword
    密码验证：verifyPassword
    哈希解析：parseHash  
 密码验证系统：
    使用 Argon2id 算法进行密码哈希
    集成 yinaje 密钥增强安全性
    自动生成随机盐并存储在哈希中
    提供完整的哈希生成、验证和解析功能
  验证码系统：
    生成带时间戳的随机验证码
    使用 HMAC-SHA256 签名确保完整性
    支持有效期验证（默认 5 分钟）
    不区分大小写的验证码验证
  环境兼容性：
    自动检测浏览器环境
    分别加载对应的加密库
    使用WebCryptoAPI提供一致的加密功能
 */
class PasswordVerificationSystem {
  // 密码哈希参数配置
  static ARGON2_TYPE = "argon2id";
  static MEMORY_COST = 65536;
  static TIME_COST = 3;
  static PARALLELISM = 4;
  static HASH_LENGTH = 32;
  static SALT_LENGTH = 16;
  
  // 验证码参数配置
  static CAPTCHA_LENGTH = 6;    // 验证码长度
  static CAPTCHA_EXPIRE = 300;  // 有效期（秒）
  
  // yinaje 自定义key值密钥
  static YINAJE_KEY = "@yinaje-secure-key-2025";

  /**
   * 初始化环境
   */
  static async init() {
    if (typeof window !== 'undefined' && window.crypto) {
      // 浏览器环境
      this.isBrowser = true;
      if (!window.argon2) {
        await import('argon2.min.js');//引用本地离线的Argon2脚本库
      }
      if (!window.crypto.subtle) {
        throw new Error('浏览器不支持加密 API');
      }
    } else {
      // Node.js 环境
      this.isBrowser = false;
      if (!this.argon2) {
        const { default: argon2 } = await import('argon2');
        this.argon2 = argon2;
      }
      if (!this.crypto) {
        const { webcrypto } = await import('crypto');
        this.crypto = webcrypto;
      }
    }
  }

  /****************************
   * 密码哈希与验证相关方法
   ****************************/
  
  /**
   * 生成密码哈希
   */
  static async hashPassword(password) {
    await this.init();
    const enhancedPassword = this._mixWithKey(password);
    
    if (this.isBrowser) {
      const salt = window.crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
      const result = await window.argon2.hash({
        pass: enhancedPassword,
        salt,
        type: window.argon2.ArgonType.Argon2id,
        mem: this.MEMORY_COST,
        time: this.TIME_COST,
        parallelism: this.PARALLELISM,
        hashLen: this.HASH_LENGTH,
        raw: false
      });
      return result.hash;
    } else {
      return this.argon2.hash(enhancedPassword, {
        type: this.argon2.argon2id,
        memoryCost: this.MEMORY_COST,
        timeCost: this.TIME_COST,
        parallelism: this.PARALLELISM,
        hashLength: this.HASH_LENGTH
      });
    }
  }

  /**
   * 验证密码
   */
  static async verifyPassword(hash, password) {
    await this.init();
    const enhancedPassword = this._mixWithKey(password);
    
    try {
      if (this.isBrowser) {
        const result = await window.argon2.verify({
          pass: enhancedPassword,
          hash
        });
        return result.verified;
      } else {
        return await this.argon2.verify(hash, enhancedPassword);
      }
    } catch (error) {
      console.error("密码验证失败:", error);
      return false;
    }
  }

  /**
   * 解析哈希字符串
   */
  static parseHash(hash) {
    const parts = hash.split('$');
    if (parts.length !== 6 || parts[0] !== '') {
      throw new Error('无效的 Argon2 哈希格式');
    }
    
    return {
      algorithm: parts[1],
      version: parseInt(parts[2].replace('v=', '')),
      memoryCost: parseInt(parts[3].match(/m=(\d+)/)[1]),
      timeCost: parseInt(parts[3].match(/t=(\d+)/)[1]),
      parallelism: parseInt(parts[3].match(/p=(\d+)/)[1]),
      salt: parts[4],
      hash: parts[5]
    };
  }

  /****************************
   * 验证码相关方法
   ****************************/
  
  /**
   * 生成验证码
   */
  static generateCaptcha() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let captcha = '';
    
    for (let i = 0; i < this.CAPTCHA_LENGTH; i++) {
      const randomIndex = this._getRandomInt(0, chars.length - 1);
      captcha += chars.charAt(randomIndex);
    }
    
    // 创建带时间戳的验证码
    const timestamp = Date.now();
    const signedCaptcha = `${captcha}|${timestamp}`;
    
    // 使用 HMAC 签名确保完整性
    return this._signData(signedCaptcha);
  }

  /**
   * 验证验证码
   */
  static verifyCaptcha(signedCaptcha, userInput) {
    // 验证签名
    const isValid = this._verifySignature(signedCaptcha);
    if (!isValid) return false;
    
    // 解析验证码和时间戳
    const [captcha, timestamp] = signedCaptcha.split('|')[0].split(':');
    const now = Date.now();
    
    // 检查有效期
    if ((now - parseInt(timestamp)) / 1000 > this.CAPTCHA_EXPIRE) {
      return false;
    }
    
    // 检查验证码是否匹配（不区分大小写）
    return captcha.toLowerCase() === userInput.toLowerCase();
  }

  /****************************
   * 辅助方法
   ****************************/
  
  /**
   * 将密码与 yinaje 密钥混合
   */
  static _mixWithKey(password) {
    const midpoint = Math.floor(password.length / 2);
    return password.substring(0, midpoint) + 
           this.YINAJE_KEY + 
           password.substring(midpoint);
  }

  /**
   * 生成随机整数
   */
  static _getRandomInt(min, max) {
    if (this.isBrowser) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      return min + (array[0] % (max - min + 1));
    } else {
      const array = new Uint32Array(1);
      this.crypto.getRandomValues(array);
      return min + (array[0] % (max - min + 1));
    }
  }

  /**
   * 签名数据（用于验证码）
   */
  static _signData(data) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.YINAJE_KEY);
    const dataBuffer = encoder.encode(data);
    
    return new Promise(async (resolve, reject) => {
      try {
        if (this.isBrowser) {
          const key = await window.crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
          );
          
          const signature = await window.crypto.subtle.sign(
            "HMAC",
            key,
            dataBuffer
          );
          
          const sigArray = Array.from(new Uint8Array(signature));
          const sigHex = sigArray.map(b => b.toString(16).padStart(2, '0')).join('');
          resolve(`${data}:${sigHex}`);
        } else {
          const key = await this.crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
          );
          
          const signature = await this.crypto.subtle.sign(
            "HMAC",
            key,
            dataBuffer
          );
          
          const sigArray = Array.from(new Uint8Array(signature));
          const sigHex = sigArray.map(b => b.toString(16).padStart(2, '0')).join('');
          resolve(`${data}:${sigHex}`);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 验证签名
   */
  static _verifySignature(signedData) {
    const [data, signature] = signedData.split(':');
    const originalData = signedData.substring(0, signedData.lastIndexOf(':'));
    
    return new Promise(async (resolve, reject) => {
      try {
        if (this.isBrowser) {
          const encoder = new TextEncoder();
          const keyData = encoder.encode(this.YINAJE_KEY);
          const dataBuffer = encoder.encode(originalData);
          const sigBuffer = new Uint8Array(signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
          
          const key = await window.crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
          );
          
          const isValid = await window.crypto.subtle.verify(
            "HMAC",
            key,
            sigBuffer,
            dataBuffer
          );
          
          resolve(isValid);
        } else {
          const encoder = new TextEncoder();
          const keyData = encoder.encode(this.YINAJE_KEY);
          const dataBuffer = encoder.encode(originalData);
          const sigBuffer = new Uint8Array(signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
          
          const key = await this.crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
          );
          
          const isValid = await this.crypto.subtle.verify(
            "HMAC",
            key,
            sigBuffer,
            dataBuffer
          );
          
          resolve(isValid);
        }
      } catch (error) {
        reject(error);
      }
    });
  }
}

// yinajekey-argon2api接口调用升级脚本
(async () => {
  try {
    // 密码验证示例
    const password = "MySecurePasswordyinajiekey";
    const hash = await PasswordVerificationSystem.hashPassword(password);
    console.log("密码哈希:", hash);
    
    const isPasswordValid = await PasswordVerificationSystem.verifyPassword(hash, password);
    console.log("密码验证结果:", isPasswordValid);
    
    // 验证码示例
    const captcha = await PasswordVerificationSystem.generateCaptcha();
    console.log("生成的验证码:", captcha);
    
    const userInput = captcha.split('|')[0].split(':')[0]; 
    const isCaptchaValid = await PasswordVerificationSystem.verifyCaptcha(captcha, userInput);
    console.log("验证码验证结果:", isCaptchaValid);
  } catch (error) {
    console.error("操作失败:", error);
  }
})();    