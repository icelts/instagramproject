const speakeasy = require('speakeasy');
const fs = require('fs');

console.log('🔍 验证账号配置...');

try {
  const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
  const account = config.accounts[0];
  
  console.log('用户名:', account.username);
  console.log('密码长度:', account.password.length);
  console.log('TOTP密钥:', account.totpSecret);
  
  // 测试TOTP生成
  const token = speakeasy.totp({
    secret: account.totpSecret,
    encoding: 'base32',
    time: Math.floor(Date.now() / 1000)
  });
  console.log('✅ TOTP验证码生成成功:', token);
  
  // 验证TOTP
  const verified = speakeasy.totp.verify({
    secret: account.totpSecret,
    encoding: 'base32',
    token: token,
    time: Math.floor(Date.now() / 1000),
    window: 2
  });
  console.log('✅ TOTP验证结果:', verified ? '有效' : '无效');
  
} catch (error) {
  console.error('❌ TOTP测试失败:', error.message);
}
