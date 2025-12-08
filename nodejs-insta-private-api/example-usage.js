const { Auto2FALogin, BatchLoginManager } = require('./auto-2fa-login');

/**
 * 单账号登录示例
 */
async function singleAccountExample() {
  console.log('=== 单账号登录示例 ===');
  
  // 从配置文件读取账号信息
  const fs = require('fs');
  const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
  const accountConfig = config.accounts[0];
  
  try {
    const login = new Auto2FALogin();
    const ig = await login.loginWithConfig(accountConfig);
    
    console.log('🎉 登录成功！现在可以使用Instagram API了');
    
    // 验证登录状态
    const isLoggedIn = await login.isLoggedIn();
    console.log('登录状态:', isLoggedIn ? '✅ 已登录' : '❌ 未登录');
    
    // 获取当前用户信息
    const currentUser = await ig.account.currentUser();
    console.log('当前用户:', currentUser.user.username);
    console.log('粉丝数:', currentUser.user.follower_count);
    console.log('关注数:', currentUser.user.following_count);
    
    // 示例：获取用户信息
    // const userInfo = await ig.user.infoByUsername('instagram');
    // console.log('用户信息:', userInfo.user);
    
    return ig;
    
  } catch (error) {
    console.error('❌ 登录失败:', error.message);
    throw error;
  }
}

/**
 * 批量账号登录示例
 */
async function batchLoginExample() {
  console.log('\n=== 批量账号登录示例 ===');
  
  try {
    const batchManager = new BatchLoginManager();
    const results = await batchManager.loginAll();
    
    console.log('\n=== 登录结果 ===');
    results.forEach(result => {
      if (result.client) {
        console.log(`✅ ${result.username} (${result.description}) - 登录成功`);
      } else {
        console.log(`❌ ${result.username} (${result.description}) - 登录失败: ${result.error}`);
      }
    });
    
    // 返回成功登录的客户端
    return results.filter(r => r.client).map(r => r.client);
    
  } catch (error) {
    console.error('❌ 批量登录失败:', error.message);
    throw error;
  }
}

/**
 * 用户信息采集示例
 */
async function userDataCollectionExample(ig) {
  console.log('\n=== 用户信息采集示例 ===');
  
  try {
    // 1. 获取当前用户信息
    const currentUser = await ig.account.currentUser();
    console.log('\n📋 当前用户信息:');
    console.log('用户名:', currentUser.user.username);
    console.log('全名:', currentUser.user.full_name);
    console.log('简介:', currentUser.user.biography);
    console.log('头像URL:', currentUser.user.profile_pic_url);
    console.log('粉丝数:', currentUser.user.follower_count);
    console.log('关注数:', currentUser.user.following_count);
    console.log('帖子数:', currentUser.user.media_count);
    console.log('是否验证:', currentUser.user.is_verified);
    console.log('是否私人账户:', currentUser.user.is_private);
    
    // 2. 获取用户动态
    console.log('\n📱 获取用户动态...');
    const userFeed = ig.feed.user(currentUser.user.pk);
    const posts = [];
    
    // 获取前10条帖子
    for (let i = 0; i < 2; i++) {
      const feedItems = await userFeed.items();
      if (feedItems.length === 0) break;
      
      feedItems.forEach(item => {
        posts.push({
          id: item.id,
          type: item.media_type === 1 ? '图片' : item.media_type === 2 ? '视频' : '轮播',
          caption: item.caption ? item.caption.text : '无描述',
          likeCount: item.like_count,
          commentCount: item.comment_count,
          url: item.image_versions2?.candidates?.[0]?.url || '无图片URL'
        });
      });
    }
    
    console.log(`\n📸 获取到 ${posts.length} 条帖子:`);
    posts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.type} - ${post.likeCount} 赞, ${post.commentCount} 评论`);
      console.log(`   描述: ${post.caption.substring(0, 50)}...`);
      console.log(`   URL: ${post.url}`);
    });
    
    // 3. 获取关注者（示例：只获取前10个）
    console.log('\n👥 获取关注者...');
    const followersFeed = ig.feed.accountFollowers(currentUser.user.pk);
    const followers = await followersFeed.items();
    
    console.log(`\n关注者列表 (前10个):`);
    followers.slice(0, 10).forEach((follower, index) => {
      console.log(`${index + 1}. ${follower.username} - ${follower.full_name}`);
    });
    
    // 4. 获取关注的人（示例：只获取前10个）
    console.log('\n👤 获取关注的人...');
    const followingFeed = ig.feed.accountFollowing(currentUser.user.pk);
    const following = await followingFeed.items();
    
    console.log(`\n关注列表 (前10个):`);
    following.slice(0, 10).forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} - ${user.full_name}`);
    });
    
    return {
      user: currentUser.user,
      posts,
      followers: followers.slice(0, 10),
      following: following.slice(0, 10)
    };
    
  } catch (error) {
    console.error('❌ 数据采集失败:', error.message);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 Instagram 2FA自动登录演示\n');
  
  try {
    // 方式1：单账号登录
    const ig = await singleAccountExample();
    
    // 方式2：批量登录（注释掉，避免重复登录）
    // const clients = await batchLoginExample();
    // const ig = clients[0]; // 使用第一个成功登录的客户端
    
    // 数据采集示例
    const userData = await userDataCollectionExample(ig);
    
    console.log('\n🎉 所有操作完成！');
    console.log('采集到的数据可以用于进一步分析或存储');
    
  } catch (error) {
    console.error('\n💥 程序执行失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此文件，则执行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  singleAccountExample,
  batchLoginExample,
  userDataCollectionExample,
  main
};
