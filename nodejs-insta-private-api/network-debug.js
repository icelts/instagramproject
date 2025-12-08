const { IgApiClient } = require('nodejs-insta-private-api');
const fs = require('fs');

async function networkDebug() {
  console.log('🌐 网络连接调试模式\n');
  
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
    
    // 检查网络连接
    console.log('\n🌍 检查网络连接...');
    
    // 尝试简单的网络请求
    const https = require('https');
    
    function checkConnection(url) {
      return new Promise((resolve, reject) => {
        const request = https.get(url, (response) => {
          console.log(`✅ ${url} - 状态码: ${response.statusCode}`);
          resolve(response.statusCode);
        });
        
        request.on('error', (error) => {
          console.log(`❌ ${url} - 错误: ${error.message}`);
          reject(error);
        });
        
        request.setTimeout(10000, () => {
          request.destroy();
          reject(new Error('请求超时'));
        });
      });
    }
    
    try {
      await checkConnection('https://www.instagram.com');
      await checkConnection('https://i.instagram.com');
      await checkConnection('https://api.instagram.com');
    } catch (networkError) {
      console.log('❌ 网络连接检查失败:', networkError.message);
      return;
    }
    
    // 检查代理设置
    console.log('\n🔍 检查代理设置...');
    console.log('HTTP_PROXY:', process.env.HTTP_PROXY || '未设置');
    console.log('HTTPS_PROXY:', process.env.HTTPS_PROXY || '未设置');
    console.log('NO_PROXY:', process.env.NO_PROXY || '未设置');
    
    // 尝试获取Instagram的登录页面
    console.log('\n📄 尝试获取Instagram登录页面...');
    
    try {
      const axios = require('axios');
      const response = await axios.get('https://www.instagram.com/accounts/login/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });
      
      console.log('✅ Instagram页面访问成功');
      console.log('状态码:', response.status);
      console.log('响应长度:', response.data.length);
      
      // 检查是否包含登录表单
      if (response.data.includes('login')) {
        console.log('✅ 页面包含登录表单');
      } else {
        console.log('⚠️ 页面可能被重定向或阻止');
      }
      
    } catch (pageError) {
      console.log('❌ 获取Instagram页面失败:', pageError.message);
    }
    
    // 尝试Instagram API登录
    console.log('\n🔐 尝试Instagram API登录...');
    
    try {
      // 设置更详细的请求配置
      ig.request.defaults({
        timeout: 30000,
        headers: {
          'User-Agent': 'Instagram 123.0.0.21.114 (iPhone; iOS 14_0; en_US; iPhone14,3; scale=3.00; 2048x2732; 455439355; nw_wifi)',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept': '*/*',
          'Connection': 'keep-alive'
        }
      });
      
      console.log('发送登录请求...');
      
      const loginResult = await ig.login({
        username: accountConfig.username,
        password: accountConfig.password
      });
      
      console.log('🎉 登录成功！');
      
    } catch (loginError) {
      console.log('\n❌ 登录失败详情:');
      console.log('错误名称:', loginError.name);
      console.log('错误消息:', loginError.message);
      
      // 检查是否有响应信息
      if (loginError.response) {
        console.log('响应状态:', loginError.response.status);
        console.log('响应头:', JSON.stringify(loginError.response.headers, null, 2));
      }
      
      // 检查是否有请求信息
      if (loginError.request) {
        console.log('请求信息:', loginError.request);
      }
      
      // 检查特定错误类型
      if (loginError.message.includes('challenge')) {
        console.log('\n⚠️ 检测到挑战/验证要求');
        console.log('需要通过官方App或网页验证账号');
      }
      
      if (loginError.message.includes('checkpoint')) {
        console.log('\n⚠️ 检测到检查点');
        console.log('账号可能被标记，需要验证');
      }
      
      if (loginError.message.includes('rate limit')) {
        console.log('\n⚠️ 请求频率限制');
        console.log('请稍后重试');
      }
    }
    
    console.log('\n🔧 建议的解决方案:');
    console.log('1. 检查网络连接是否正常');
    console.log('2. 确认没有使用代理或VPN');
    console.log('3. 尝试通过官方App验证账号');
    console.log('4. 检查账号是否被临时限制');
    console.log('5. 确认Instagram服务是否正常');
    
  } catch (error) {
    console.error('💥 网络调试失败:', error.message);
  }
}

// 运行网络调试
networkDebug();
