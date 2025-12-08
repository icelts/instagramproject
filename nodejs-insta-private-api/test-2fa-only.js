const speakeasy = require('speakeasy');
const { IgApiClient } = require('nodejs-insta-private-api');

async function test2FAOnly() {
  console.log('🧪 测试2FA功能（不依赖正确密码）\n');
  
  try {
    // 读取配置
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    const accountConfig = config.accounts[0];
    
    console.log('📋 测试账号:', accountConfig.username);
    
    // 创建Instagram客户端
    const ig = new IgApiClient();
    
    // 设置用户代理（模拟真实浏览器）
    ig.state.generateDevice(accountConfig.username);
    
    console.log('🔐 尝试登录（预期会失败，但可能触发2FA）...');
    
    try {
      // 尝试登录 - 这里会失败，但可能触发2FA要求
      await ig.login({
        username: accountConfig.username,
        password: accountConfig.password
      });
      
      console.log('🎉 意外登录成功！');
      
    } catch (error) {
      console.log('❌ 登录失败（预期）:', error.message);
      
      // 检查是否触发了2FA要求
      if (error.name === 'IgLoginTwoFactorRequiredError') {
        console.log('✅ 成功触发2FA要求！');
        console.log('2FA信息:', JSON.stringify(error.two_factor_info, null, 2));
        
        // 生成TOTP验证码
        const token = speakeasy.totp({
          secret: accountConfig.totpSecret,
          encoding: 'base32',
          time: Math.floor(Date.now() / 1000)
        });
        
        console.log('🔢 生成的TOTP验证码:', token);
        
        // 尝试使用TOTP验证码
        try {
          await ig.login({
            username: accountConfig.username,
            password: accountConfig.password,
            twoFactorIdentifier: error.two_factor_info.two_factor_identifier,
            verificationCode: token,
            verificationMethod: 'totp'
          });
          
          console.log('🎉 2FA验证成功！');
          
        } catch (twoFactorError) {
          console.log('❌ 2FA验证失败:', twoFactorError.message);
          
          if (twoFactorError.message.includes('verification code')) {
            console.log('⚠️ 可能的原因：');
            console.log('1. TOTP密钥不正确');
            console.log('2. 时间同步问题');
            console.log('3. Instagram服务器时间差异');
          }
        }
        
      } else if (error.message.includes('password')) {
        console.log('⚠️ 密码错误，但没有触发2FA');
        console.log('这可能意味着：');
        console.log('1. 密码确实不正确');
        console.log('2. 账号没有启用2FA');
        console.log('3. 账号被临时限制');
      } else {
        console.log('⚠️ 其他登录错误:', error.name);
      }
    }
    
    // 测试TOTP生成功能
    console.log('\n🔢 测试TOTP生成功能...');
    for (let i = 0; i < 3; i++) {
      const token = speakeasy.totp({
        secret: accountConfig.totpSecret,
        encoding: 'base32',
        time: Math.floor(Date.now() / 1000) + i * 30
      });
      console.log(`第${i+1}个验证码: ${token}`);
    }
    
    console.log('\n✅ 2FA功能测试完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
test2FAOnly();
