const { Auto2FALogin } = require('./auto-2fa-login');
const fs = require('fs');

async function verboseLogin() {
  console.log('🔍 详细登录调试模式\n');
  
  try {
    // 读取配置
    const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    const accountConfig = config.accounts[0];
    
    console.log('📋 账号配置详情:');
    console.log('用户名:', accountConfig.username);
    console.log('密码:', accountConfig.password);
    console.log('密码长度:', accountConfig.password.length);
    console.log('TOTP密钥:', accountConfig.totpSecret);
    console.log('TOTP密钥长度:', accountConfig.totpSecret.length);
    console.log('会话文件:', accountConfig.sessionFile);
    
    // 创建登录实例
    const login = new Auto2FALogin();
    console.log('\n🏗️ 创建登录实例成功');
    console.log('设置:', JSON.stringify(login.options, null, 2));
    
    // 生成当前TOTP验证码
    const currentToken = login.generateTOTP(accountConfig.totpSecret);
    console.log('\n🔢 当前TOTP验证码:', currentToken);
    
    // 检查会话文件
    console.log('\n💾 检查会话文件...');
    if (fs.existsSync(accountConfig.sessionFile)) {
      console.log('会话文件存在，尝试加载...');
      try {
        const sessionData = fs.readFileSync(accountConfig.sessionFile, 'utf8');
        const session = JSON.parse(sessionData);
        console.log('会话数据加载成功');
        console.log('会话键数量:', Object.keys(session).length);
      } catch (sessionError) {
        console.log('会话文件损坏:', sessionError.message);
      }
    } else {
      console.log('会话文件不存在，将进行新登录');
    }
    
    console.log('\n🚀 开始详细登录流程...');
    
    // 手动执行登录步骤以便调试
    const ig = login.ig;
    
    // 设置设备信息
    console.log('📱 设置设备信息...');
    ig.state.generateDevice(accountConfig.username);
    console.log('设备信息设置完成');
    
    // 尝试登录
    console.log('\n🔐 尝试登录...');
    console.log('发送登录请求...');
    
    try {
      const loginResult = await ig.login({
        username: accountConfig.username,
        password: accountConfig.password
      });
      
      console.log('🎉 登录成功！');
      console.log('登录结果:', typeof loginResult);
      
      // 验证登录状态
      console.log('\n✅ 验证登录状态...');
      const isLoggedIn = await ig.isSessionValid();
      console.log('会话有效性:', isLoggedIn);
      
      // 获取用户信息
      console.log('\n👤 获取用户信息...');
      const currentUser = await ig.account.currentUser();
      console.log('当前用户:', currentUser.user.username);
      console.log('用户ID:', currentUser.user.pk);
      console.log('粉丝数:', currentUser.user.follower_count);
      console.log('关注数:', currentUser.user.following_count);
      
    } catch (error) {
      console.log('\n❌ 登录失败，详细错误信息:');
      console.log('错误名称:', error.name);
      console.log('错误消息:', error.message);
      console.log('错误堆栈:', error.stack);
      
      // 检查特定错误类型
      if (error.name === 'IgLoginTwoFactorRequiredError') {
        console.log('\n🔐 检测到2FA要求！');
        console.log('2FA信息:', JSON.stringify(error.two_factor_info, null, 2));
        
        const twoFactorIdentifier = error.two_factor_info.two_factor_identifier;
        console.log('2FA标识符:', twoFactorIdentifier);
        
        // 生成新的TOTP验证码
        const totpToken = login.generateTOTP(accountConfig.totpSecret);
        console.log('生成的TOTP验证码:', totpToken);
        
        console.log('\n🔄 尝试2FA验证...');
        try {
          await ig.login({
            username: accountConfig.username,
            password: accountConfig.password,
            twoFactorIdentifier: twoFactorIdentifier,
            verificationCode: totpToken,
            verificationMethod: 'totp'
          });
          
          console.log('🎉 2FA验证成功！');
          
          // 验证登录状态
          const isLoggedIn = await ig.isSessionValid();
          console.log('2FA后登录状态:', isLoggedIn);
          
        } catch (twoFactorError) {
          console.log('❌ 2FA验证失败:');
          console.log('2FA错误名称:', twoFactorError.name);
          console.log('2FA错误消息:', twoFactorError.message);
          console.log('2FA错误堆栈:', twoFactorError.stack);
        }
        
      } else if (error.message.includes('password')) {
        console.log('\n⚠️ 密码相关错误');
        console.log('可能原因:');
        console.log('1. 密码不正确');
        console.log('2. 账号被临时限制');
        console.log('3. 需要通过官方App验证');
        
      } else if (error.message.includes('challenge') || error.message.includes('checkpoint')) {
        console.log('\n⚠️ 检查点/挑战错误');
        console.log('需要通过Instagram官方App或网页版验证');
        
      } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
        console.log('\n⚠️ 请求频率限制');
        console.log('请稍后重试');
        
      } else {
        console.log('\n⚠️ 其他错误类型');
        console.log('请检查网络连接和账号状态');
      }
      
      throw error;
    }
    
  } catch (error) {
    console.error('\n💥 调试过程中发生错误:', error.message);
  }
}

// 运行详细调试
verboseLogin();
