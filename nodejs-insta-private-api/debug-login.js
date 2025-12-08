const { Auto2FALogin } = require('./auto-2fa-login');
const fs = require('fs');

async function debugLogin() {
  console.log('🔍 调试登录流程...\n');
  
  try {
    // 读取配置
    const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    const accountConfig = config.accounts[0];
    
    console.log('📋 账号配置:');
    console.log('用户名:', accountConfig.username);
    console.log('密码:', accountConfig.password);
    console.log('TOTP密钥:', accountConfig.totpSecret);
    console.log('会话文件:', accountConfig.sessionFile);
    
    // 创建登录实例
    const login = new Auto2FALogin();
    
    // 生成当前TOTP验证码
    const currentToken = login.generateTOTP(accountConfig.totpSecret);
    console.log('\n🔢 当前TOTP验证码:', currentToken);
    
    console.log('\n🚀 开始登录测试...');
    
    // 尝试登录
    const ig = await login.loginWithConfig(accountConfig);
    
    console.log('🎉 登录成功！');
    
    // 验证登录状态
    const isLoggedIn = await login.isLoggedIn();
    console.log('登录状态验证:', isLoggedIn ? '✅ 已登录' : '❌ 未登录');
    
    return ig;
    
  } catch (error) {
    console.error('\n❌ 登录失败详情:');
    console.error('错误类型:', error.name);
    console.error('错误消息:', error.message);
    
    if (error.name === 'IgLoginTwoFactorRequiredError') {
      console.error('需要2FA验证');
      console.error('2FA信息:', error.two_factor_info);
    }
    
    throw error;
  }
}

// 运行调试
debugLogin().catch(console.error);
