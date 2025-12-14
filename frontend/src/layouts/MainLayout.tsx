// @ts-nocheck
import React from 'react';
import { Outlet } from 'react-router-dom';

const MainLayout: React.FC = () => {
  console.log('=== MainLayout Simple Render ===');
  
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 简单的侧边栏 */}
      <div style={{
        width: '240px',
        backgroundColor: '#fff',
        borderRight: '1px solid #ddd',
        padding: '20px'
      }}>
        <h3>Instagram 管理</h3>
        <nav>
          <div style={{ padding: '10px 0', cursor: 'pointer' }}>仪表盘</div>
          <div style={{ padding: '10px 0', cursor: 'pointer' }}>账号管理</div>
          <div style={{ padding: '10px 0', cursor: 'pointer' }}>代理配置</div>
          <div style={{ padding: '10px 0', cursor: 'pointer' }}>定时任务</div>
          <div style={{ padding: '10px 0', cursor: 'pointer' }}>搜索任务</div>
          <div style={{ padding: '10px 0', cursor: 'pointer' }}>实时监控</div>
          <div style={{ padding: '10px 0', cursor: 'pointer' }}>自动回复</div>
          <div style={{ padding: '10px 0', cursor: 'pointer' }}>数据导出</div>
          <div style={{ padding: '10px 0', cursor: 'pointer' }}>管理员</div>
        </nav>
      </div>
      
      {/* 主内容区域 */}
      <div style={{ flex: 1, padding: '20px', backgroundColor: '#f5f5f5' }}>
        <h1>主内容区域</h1>
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
