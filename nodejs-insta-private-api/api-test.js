const { IgApiClient } = require('nodejs-insta-private-api');

async function testAPI() {
  console.log('🧪 Instagram API库基础测试\n');
  
  try {
    // 检查API库版本
    const packageInfo = require('nodejs-insta-private-api/package.json');
    console.log('📦 API库版本:', packageInfo.version);
    
    // 创建客户端实例
    console.log('🏗️ 创建Instagram客户端...');
    const ig = new IgApiClient();
    console.log('✅ 客户端创建成功');
    
    // 检查可用的方法
    console.log('\n🔍 检查可用方法...');
    console.log('login方法存在:', typeof ig.login === 'function');
    console.log('account属性存在:', !!ig.account);
    console.log('feed属性存在:', !!ig.feed);
    console.log('state属性存在:', !!ig.state);
    
    // 设置设备信息
    console.log('\n📱 设置设备信息...');
    ig.state.generateDevice('testuser');
    console.log('✅ 设备信息设置完成');
    
    // 检查设备信息
    console.log('设备信息:', ig.state.device);
    console.log('设备ID:', ig.state.deviceId || ig.state.device?.id);
    console.log('用户代理:', ig.state.userAgent || ig.state.device?.userAgent);
    
    // 尝试获取公共信息（不需要登录）
    console.log('\n🌐 测试公共API访问...');
    
    try {
      // 尝试获取一个公开用户的信息
      const userInfo = await ig.user.searchExact('instagram');
      console.log('✅ 公共API访问成功');
      console.log('搜索结果:', userInfo ? '找到用户' : '未找到用户');
    } catch (publicError) {
      console.log('❌ 公共API访问失败:', publicError.message);
      console.log('错误类型:', publicError.name);
    }
    
    // 检查网络配置
    console.log('\n🌍 检查网络配置...');
    console.log('请求对象存在:', !!ig.request);
    console.log('请求对象类型:', typeof ig.request);
    
    // 尝试简单的网络请求
    console.log('\n🔗 测试网络连接...');
    
    try {
      // 这里我们只是检查请求对象是否可用
      console.log('请求方法:', Object.getOwnPropertyNames(ig.request.__proto__));
    } catch (requestError) {
      console.log('❌ 请求对象检查失败:', requestError.message);
    }
    
    console.log('\n🎯 API库基础测试完成');
    
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行API测试
testAPI();
