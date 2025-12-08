const { IgApiClient } = require('nodejs-insta-private-api');
const fs = require('fs');

async function correctLoginTest() {
  console.log('🎯 基于实际API结构的登录测试\n');
  
  try {
    // 读取配置
    const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    const accountConfig = config.accounts[0];
    
    console.log('📋 账号信息:', accountConfig.username);
    
    // 创建Instagram客户端
    const ig = new IgApiClient();
    
    // 设置设备信息
    console.log('📱 设置设备信息...');
    ig.state.generateDevice(accountConfig.username);
    console.log('✅ 设备信息设置完成');
    console.log('设备ID:', ig.state.deviceId);
    
    // 检查登录前的状态
    console.log('\n🔍 检查登录前状态...');
    console.log('会话有效:', await ig.isSessionValid().catch(() => false));
    
    // 尝试登录
    console.log('\n🔐 开始登录...');
    
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
      
      if (isLoggedIn) {
        // 获取用户信息
        console.log('\n👤 获取用户信息...');
        try {
          const currentUser = await ig.account.currentUser();
          console.log('✅ 用户信息获取成功');
          console.log('用户名:', currentUser.user.username);
          console.log('用户ID:', currentUser.user.pk);
          console.log('粉丝数:', currentUser.user.follower_count);
          console.log('关注数:', currentUser.user.following_count);
          console.log('帖子数:', currentUser.user.media_count);
          console.log('简介:', currentUser.user.biography || '无简介');
          
          // 测试数据采集功能
          console.log('\n📊 测试数据采集功能...');
          
          // 获取用户动态
          console.log('获取用户动态...');
          try {
            const feed = ig.feed.user(currentUser.user.pk);
            const posts = await feed.items();
            console.log(`✅ 获取到 ${posts.length} 条动态`);
            
            if (posts.length > 0) {
              const firstPost = posts[0];
              console.log('第一条动态:');
              console.log('- 类型:', firstPost.media_type === 1 ? '图片' : firstPost.media_type === 2 ? '视频' : '其他');
              console.log('- 点赞数:', firstPost.like_count || 0);
              console.log('- 评论数:', firstPost.comment_count || 0);
              console.log('- 描述:', firstPost.caption?.text?.substring(0, 100) + '...' || '无描述');
            }
          } catch (feedError) {
            console.log('❌ 获取动态失败:', feedError.message);
          }
          
          console.log('\n🎉 所有功能测试完成！');
          
        } catch (userError) {
          console.log('❌ 获取用户信息失败:', userError.message);
        }
      }
      
    } catch (loginError) {
      console.log('\n❌ 登录失败详情:');
      console.log('错误名称:', loginError.name);
      console.log('错误消息:', loginError.message);
      
      // 检查特定错误类型
      if (loginError.name === 'IgLoginTwoFactorRequiredError') {
        console.log('\n🔐 检测到2FA要求！');
        console.log('2FA信息:', JSON.stringify(loginError.two_factor_info, null, 2));
        
        const speakeasy = require('speakeasy');
        const totpToken = speakeasy.totp({
          secret: accountConfig.totpSecret,
          encoding: 'base32',
          time: Math.floor(Date.now() / 1000)
        });
        
        console.log('生成的TOTP验证码:', totpToken);
        
        console.log('\n🔄 尝试2FA验证...');
        try {
          await ig.login({
            username: accountConfig.username,
            password: accountConfig.password,
            twoFactorIdentifier: loginError.two_factor_info.two_factor_identifier,
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
        }
        
      } else if (loginError.message.includes('challenge') || loginError.message.includes('checkpoint')) {
        console.log('\n⚠️ 检测到挑战/检查点');
        console.log('账号需要通过官方App或网页验证');
        
      } else if (loginError.message.includes('rate limit') || loginError.message.includes('too many')) {
        console.log('\n⚠️ 请求频率限制');
        
      } else if (loginError.message.includes('password')) {
        console.log('\n⚠️ 密码相关错误');
        
      } else {
        console.log('\n⚠️ 其他错误');
        console.log('错误名称:', loginError.name);
        console.log('错误消息:', loginError.message);
        if (loginError.response) {
          console.log('响应状态:', loginError.response.statusCode);
          console.log('响应头:', loginError.response.headers);
        }
        if (loginError.request) {
          console.log('请求URL:', loginError.request.url || loginError.request.path);
        }
      }
    }
    
  } catch (error) {
    console.error('💥 测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行正确的登录测试
correctLoginTest();
