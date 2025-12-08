const speakeasy = require('speakeasy');

/**
 * 测试TOTP验证码生成功能
 */
function testTOTPGeneration() {
  console.log('=== TOTP验证码生成测试 ===');
  
  // 测试密钥（这是一个示例密钥）
  const testSecret = 'JBSWY3DPEHPK3PXP';
  
  try {
    // 生成验证码
    const token = speakeasy.totp({
      secret: testSecret,
      encoding: 'base32',
      time: Math.floor(Date.now() / 1000)
    });
    
    console.log(`✅ TOTP密钥: ${testSecret}`);
    console.log(`✅ 生成的验证码: ${token}`);
    console.log(`✅ 验证码长度: ${token.length}`);
    
    // 验证生成的验证码
    const verified = speakeasy.totp.verify({
      secret: testSecret,
      encoding: 'base32',
      token: token,
      time: Math.floor(Date.now() / 1000),
      window: 2
    });
    
    console.log(`✅ 验证码验证结果: ${verified ? '有效' : '无效'}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ TOTP生成失败:', error.message);
    return false;
  }
}

/**
 * 测试配置文件加载
 */
function testConfigLoading() {
  console.log('\n=== 配置文件加载测试 ===');
  
  try {
    const fs = require('fs');
    const configData = fs.readFileSync('config.json', 'utf8');
    const config = JSON.parse(configData);
    
    console.log('✅ 配置文件加载成功');
    console.log(`✅ 账号数量: ${config.accounts.length}`);
    console.log(`✅ 自动重试: ${config.settings.autoRetry}`);
    console.log(`✅ 最大重试次数: ${config.settings.maxRetries}`);
    
    // 验证配置结构
    const requiredFields = ['username', 'password', 'totpSecret', 'sessionFile'];
    const account = config.accounts[0];
    
    for (const field of requiredFields) {
      if (!account[field]) {
        console.error(`❌ 缺少必需字段: ${field}`);
        return false;
      }
    }
    
    console.log('✅ 配置文件结构验证通过');
    return true;
    
  } catch (error) {
    console.error('❌ 配置文件加载失败:', error.message);
    return false;
  }
}

/**
 * 测试Auto2FALogin类加载
 */
function testClassLoading() {
  console.log('\n=== 类加载测试 ===');
  
  try {
    const { Auto2FALogin, BatchLoginManager } = require('./auto-2fa-login');
    
    console.log('✅ Auto2FALogin类加载成功');
    console.log('✅ BatchLoginManager类加载成功');
    
    // 测试实例化
    const login = new Auto2FALogin();
    const batchManager = new BatchLoginManager();
    
    console.log('✅ Auto2FALogin实例化成功');
    console.log('✅ BatchLoginManager实例化成功');
    
    return true;
    
  } catch (error) {
    console.error('❌ 类加载失败:', error.message);
    return false;
  }
}

/**
 * 模拟登录测试（不实际连接Instagram）
 */
async function testLoginFlow() {
  console.log('\n=== 登录流程测试 ===');
  
  try {
    const { Auto2FALogin } = require('./auto-2fa-login');
    
    // 创建测试配置
    const testConfig = {
      username: 'test_user',
      password: 'test_password',
      totpSecret: 'JBSWY3DPEHPK3PXP',
      sessionFile: 'test_session.json'
    };
    
    const login = new Auto2FALogin();
    
    // 测试TOTP生成
    const token = login.generateTOTP(testConfig.totpSecret);
    console.log(`✅ TOTP生成测试通过: ${token}`);
    
    // 测试会话文件路径
    console.log(`✅ 会话文件路径: ${testConfig.sessionFile}`);
    
    // 测试选项配置
    console.log(`✅ 自动重试: ${login.options.autoRetry}`);
    console.log(`✅ 最大重试次数: ${login.options.maxRetries}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ 登录流程测试失败:', error.message);
    return false;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🧪 Instagram 2FA自动登录脚本测试\n');
  
  const tests = [
    { name: 'TOTP验证码生成', fn: testTOTPGeneration },
    { name: '配置文件加载', fn: testConfigLoading },
    { name: '类加载', fn: testClassLoading },
    { name: '登录流程', fn: testLoginFlow }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
        console.log(`✅ ${test.name} - 通过`);
      } else {
        console.log(`❌ ${test.name} - 失败`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - 异常: ${error.message}`);
    }
  }
  
  console.log(`\n📊 测试结果: ${passedTests}/${totalTests} 通过`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！脚本已准备就绪。');
    console.log('\n📝 下一步:');
    console.log('1. 编辑 config.json 填入真实的账号信息');
    console.log('2. 运行 npm start 开始使用');
  } else {
    console.log('⚠️ 部分测试失败，请检查配置和依赖。');
  }
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testTOTPGeneration,
  testConfigLoading,
  testClassLoading,
  testLoginFlow,
  runTests
};
