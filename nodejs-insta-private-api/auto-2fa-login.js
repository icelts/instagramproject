const speakeasy = require('speakeasy');
const fs = require('fs');
const path = require('path');
const { IgApiClient } = require('nodejs-insta-private-api');

/**
 * Instagram 2FA自动登录管理器
 * 支持TOTP自动验证码生成和会话管理
 */
class Auto2FALogin {
  constructor(options = {}) {
    this.ig = new IgApiClient();
    this.options = {
      autoRetry: true,
      maxRetries: 3,
      retryDelay: 2000,
      saveSession: true,
      validateSession: true,
      ...options
    };
  }

  /**
   * 使用账号配置进行登录
   * @param {Object} accountConfig - 账号配置
   * @param {string} accountConfig.username - 用户名
   * @param {string} accountConfig.password - 密码
   * @param {string} accountConfig.totpSecret - TOTP密钥
   * @param {string} accountConfig.sessionFile - 会话文件路径
   * @returns {Promise<IgApiClient>} 登录成功的客户端实例
   */
  async loginWithConfig(accountConfig) {
    const { username, password, totpSecret, sessionFile } = accountConfig;
    
    console.log(`🔐 开始登录账号: ${username}`);
    
    // 尝试加载已有会话
    if (sessionFile && this.options.saveSession) {
      const sessionLoaded = await this.tryLoadSession(sessionFile);
      if (sessionLoaded) {
        console.log(`✅ 账号 ${username} 使用已保存会话登录成功`);
        return this.ig;
      }
    }
    
    // 执行登录流程
    return await this.performLogin(username, password, totpSecret, sessionFile);
  }

  /**
   * 尝试加载已保存的会话
   * @param {string} sessionFile - 会话文件路径
   * @returns {Promise<boolean>} 是否成功加载会话
   */
  async tryLoadSession(sessionFile) {
    if (!fs.existsSync(sessionFile)) {
      return false;
    }

    try {
      const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
      await this.ig.loadSession(session);
      
      // 验证会话是否有效
      if (this.options.validateSession) {
        const isValid = await this.ig.isSessionValid();
        if (!isValid) {
          console.log('⚠️ 已保存的会话已过期，需要重新登录');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.log('⚠️ 加载会话失败:', error.message);
      return false;
    }
  }

  /**
   * 执行登录流程
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @param {string} totpSecret - TOTP密钥
   * @param {string} sessionFile - 会话文件路径
   * @returns {Promise<IgApiClient>} 登录成功的客户端实例
   */
  async performLogin(username, password, totpSecret, sessionFile) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        console.log(`📝 登录尝试 ${attempt}/${this.options.maxRetries}`);
        
        // 第一步：尝试登录
        await this.ig.login({ username, password });
        console.log(`✅ 账号 ${username} 登录成功（无需2FA）`);
        
        // 保存会话
        if (sessionFile && this.options.saveSession) {
          await this.saveSession(sessionFile);
        }
        
        return this.ig;
        
      } catch (error) {
        lastError = error;
        
        if (error.name === 'IgLoginTwoFactorRequiredError') {
          console.log('🔐 检测到2FA要求，自动处理中...');
          
          try {
            // 自动生成TOTP验证码
            const verificationCode = this.generateTOTP(totpSecret);
            
            // 使用生成的验证码完成登录
            await this.ig.login({
              username,
              password,
              twoFactorIdentifier: error.two_factor_info.two_factor_identifier,
              verificationCode: verificationCode,
              verificationMethod: 'totp'
            });
            
            console.log(`✅ 账号 ${username} 2FA自动验证成功！`);
            
            // 保存会话
            if (sessionFile && this.options.saveSession) {
              await this.saveSession(sessionFile);
            }
            
            return this.ig;
            
          } catch (twoFactorError) {
            console.error(`❌ 2FA验证失败: ${twoFactorError.message}`);
            lastError = twoFactorError;
          }
        } else {
          console.error(`❌ 登录失败: ${error.message}`);
        }
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.options.maxRetries && this.options.autoRetry) {
          console.log(`⏳ ${this.options.retryDelay}ms 后重试...`);
          await this.sleep(this.options.retryDelay);
        }
      }
    }
    
    // 所有尝试都失败了
    throw new Error(`账号 ${username} 登录失败: ${lastError.message}`);
  }

  /**
   * 生成TOTP验证码
   * @param {string} secret - TOTP密钥
   * @returns {string} 6位验证码
   */
  generateTOTP(secret) {
    const token = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      time: Math.floor(Date.now() / 1000)
    });
    
    console.log(`🔢 生成的2FA验证码: ${token}`);
    return token;
  }

  /**
   * 保存会话到文件
   * @param {string} sessionFile - 会话文件路径
   */
  async saveSession(sessionFile) {
    try {
      const session = await this.ig.saveSession();
      const sessionJson = JSON.stringify(session, null, 2);
      fs.writeFileSync(sessionFile, sessionJson, 'utf8');
      console.log(`💾 会话已保存到: ${sessionFile}`);
    } catch (error) {
      console.error('⚠️ 保存会话失败:', error.message);
    }
  }

  /**
   * 获取当前客户端实例
   * @returns {IgApiClient} Instagram API客户端
   */
  getClient() {
    return this.ig;
  }

  /**
   * 验证登录状态
   * @returns {Promise<boolean>} 是否已登录
   */
  async isLoggedIn() {
    try {
      return await this.ig.isSessionValid();
    } catch {
      return false;
    }
  }

  /**
   * 登出并清理会话
   * @param {string} sessionFile - 会话文件路径
   */
  async logout(sessionFile) {
    try {
      await this.ig.logout();
      console.log('👋 已登出');
      
      if (sessionFile && fs.existsSync(sessionFile)) {
        fs.unlinkSync(sessionFile);
        console.log('🗑️ 已删除会话文件');
      }
    } catch (error) {
      console.error('⚠️ 登出失败:', error.message);
    }
  }

  /**
   * 睡眠函数
   * @param {number} ms - 毫秒数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 批量登录管理器
 */
class BatchLoginManager {
  constructor(configPath = 'config.json') {
    this.configPath = configPath;
    this.config = this.loadConfig();
    this.logins = [];
  }

  /**
   * 加载配置文件
   * @returns {Object} 配置对象
   */
  loadConfig() {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      throw new Error(`加载配置文件失败: ${error.message}`);
    }
  }

  /**
   * 批量登录所有账号
   * @returns {Promise<Array>} 登录成功的客户端数组
   */
  async loginAll() {
    const results = [];
    
    for (const accountConfig of this.config.accounts) {
      try {
        const login = new Auto2FALogin(this.config.settings);
        const ig = await login.loginWithConfig(accountConfig);
        
        results.push({
          username: accountConfig.username,
          description: accountConfig.description,
          client: ig,
          login: login
        });
        
        console.log(`✅ 账号 ${accountConfig.username} 登录成功`);
        
        // 账号间延迟，避免触发限制
        if (this.config.settings.retryDelay > 0) {
          await this.sleep(this.config.settings.retryDelay);
        }
        
      } catch (error) {
        console.error(`❌ 账号 ${accountConfig.username} 登录失败:`, error.message);
        results.push({
          username: accountConfig.username,
          description: accountConfig.description,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * 睡眠函数
   * @param {number} ms - 毫秒数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = {
  Auto2FALogin,
  BatchLoginManager
};
