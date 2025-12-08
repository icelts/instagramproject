# Instagram 2FA自动登录脚本使用指南

## 🎯 快速开始

### 1. 准备工作
确保你已经：
- 安装了 Node.js (版本 14 或更高)
- 有一个Instagram账号
- 启用了2FA双因素认证
- 安装了认证应用（Google Authenticator、Authy等）

### 2. 获取TOTP密钥

#### Google Authenticator
1. 打开Google Authenticator应用
2. 找到你的Instagram账号
3. 点击账号条目
4. 选择"显示密钥"或"导出密钥"
5. 复制显示的密钥（类似：JBSWY3DPEHPK3PXP）

#### Authy
1. 打开Authy应用
2. 找到Instagram账号
3. 点击设置图标
4. 选择"显示密钥"
5. 复制密钥

#### 1Password
1. 打开1Password
2. 找到Instagram的TOTP项目
3. 点击"高级"
4. 选择"显示密钥"
5. 复制密钥

### 3. 配置账号信息

编辑 `config.json` 文件：

```json
{
  "accounts": [
    {
      "username": "你的Instagram用户名",
      "password": "你的Instagram密码",
      "totpSecret": "你刚才复制的TOTP密钥",
      "sessionFile": "session.json",
      "description": "主账号"
    }
  ],
  "settings": {
    "autoRetry": true,
    "maxRetries": 3,
    "retryDelay": 2000,
    "saveSession": true,
    "validateSession": true
  }
}
```

### 4. 运行脚本

```bash
# 安装依赖（如果还没安装）
npm install

# 运行测试（验证功能）
node test-2fa.js

# 运行示例
npm start
```

## 📊 数据采集示例

登录成功后，你可以进行各种数据采集：

### 获取用户基本信息
```javascript
const userInfo = await ig.user.infoByUsername('目标用户名');
console.log('用户信息:', {
  用户名: userInfo.user.username,
  全名: userInfo.user.full_name,
  简介: userInfo.user.biography,
  粉丝数: userInfo.user.follower_count,
  关注数: userInfo.user.following_count,
  帖子数: userInfo.user.media_count,
  头像: userInfo.user.profile_pic_url,
  是否验证: userInfo.user.is_verified,
  是否私人: userInfo.user.is_private
});
```

### 获取用户动态
```javascript
const userFeed = ig.feed.user(userId);
const posts = await userFeed.items();

posts.forEach(post => {
  console.log({
    帖子ID: post.id,
    类型: post.media_type === 1 ? '图片' : '视频',
    描述: post.caption?.text || '无描述',
    点赞数: post.like_count,
    评论数: post.comment_count,
    图片URL: post.image_versions2?.candidates?.[0]?.url,
    发布时间: new Date(post.device_timestamp * 1000)
  });
});
```

### 获取关注者
```javascript
const followersFeed = ig.feed.accountFollowers(userId);
const followers = await followersFeed.items();

console.log('关注者列表:');
followers.slice(0, 20).forEach((follower, index) => {
  console.log(`${index + 1}. ${follower.username} - ${follower.full_name}`);
});
```

### 获取关注的人
```javascript
const followingFeed = ig.feed.accountFollowing(userId);
const following = await followingFeed.items();

console.log('关注列表:');
following.slice(0, 20).forEach((user, index) => {
  console.log(`${index + 1}. ${user.username} - ${user.full_name}`);
});
```

### 获取帖子详情和互动数据
```javascript
// 获取点赞用户
const likers = await ig.media.likers(mediaId);
console.log('点赞用户:', likers.users.map(u => u.username));

// 获取评论
const comments = await ig.media.comments(mediaId);
console.log('评论:', comments.map(c => ({
  用户: c.user.username,
  内容: c.text,
  时间: new Date(c.created_at * 1000)
})));
```

## 🔧 高级用法

### 批量账号管理
```javascript
const { BatchLoginManager } = require('./auto-2fa-login');

// 配置多个账号
const config = {
  "accounts": [
    {
      "username": "account1",
      "password": "password1",
      "totpSecret": "secret1",
      "sessionFile": "session1.json",
      "description": "账号1"
    },
    {
      "username": "account2", 
      "password": "password2",
      "totpSecret": "secret2",
      "sessionFile": "session2.json",
      "description": "账号2"
    }
  ]
};

// 批量登录
const batchManager = new BatchLoginManager();
const results = await batchManager.loginAll();

// 使用登录成功的账号
results.forEach(result => {
  if (result.client) {
    console.log(`账号 ${result.username} 登录成功，可以开始采集数据`);
  }
});
```

### 自定义采集脚本
```javascript
const { Auto2FALogin } = require('./auto-2fa-login');

async function customDataCollection() {
  // 登录
  const login = new Auto2FALogin();
  const ig = await login.loginWithConfig({
    username: 'your_username',
    password: 'your_password',
    totpSecret: 'your_totp_secret',
    sessionFile: 'session.json'
  });
  
  // 自定义采集逻辑
  const targetUsername = 'target_user';
  const userInfo = await ig.user.infoByUsername(targetUsername);
  
  console.log(`开始采集用户 ${targetUsername} 的数据...`);
  
  // 采集用户信息
  const userData = {
    基本信息: {
      用户名: userInfo.user.username,
      全名: userInfo.user.full_name,
      简介: userInfo.user.biography,
      粉丝数: userInfo.user.follower_count,
      关注数: userInfo.user.following_count,
      帖子数: userInfo.user.media_count
    }
  };
  
  // 采集最近帖子
  const userFeed = ig.feed.user(userInfo.user.pk);
  const posts = await userFeed.items();
  
  userData.最近帖子 = posts.slice(0, 10).map(post => ({
    ID: post.id,
    类型: post.media_type === 1 ? '图片' : '视频',
    描述: post.caption?.text || '无描述',
    点赞数: post.like_count,
    评论数: post.comment_count,
    URL: post.image_versions2?.candidates?.[0]?.url
  }));
  
  // 保存数据
  const fs = require('fs');
  fs.writeFileSync(`${targetUsername}_data.json`, JSON.stringify(userData, null, 2));
  
  console.log(`数据采集完成，已保存到 ${targetUsername}_data.json`);
}

customDataCollection().catch(console.error);
```

## ⚠️ 注意事项

### 安全建议
1. **保护配置文件** - 不要将包含真实密码的配置文件提交到Git
2. **使用环境变量** - 敏感信息可以使用环境变量
3. **定期更换密码** - 定期更新Instagram密码
4. **监控登录活动** - 关注Instagram的登录通知

### 使用限制
1. **请求频率** - 避免过于频繁的API调用
2. **数据量** - 大量数据采集可能触发限制
3. **合规性** - 遵守Instagram的使用条款
4. **隐私保护** - 尊重用户隐私，不要滥用采集的数据

### 常见问题解决

#### Q: TOTP验证码总是错误
A: 检查TOTP密钥是否正确，确保手机时间准确

#### Q: 登录失败提示检查点
A: 账号可能被标记，需要通过Instagram官方App验证

#### Q: 会话文件无效
A: 删除会话文件，重新登录

#### Q: API调用被限制
A: 降低请求频率，增加延迟时间

## 📞 支持

如果遇到问题：
1. 查看控制台错误信息
2. 检查配置文件格式
3. 确认网络连接正常
4. 验证账号信息正确性

## 🚀 进阶功能

脚本支持更多高级功能：
- 代理IP支持
- 数据库存储
- 定时任务
- Web界面
- API接口

需要这些功能可以进一步扩展脚本。
