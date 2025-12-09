// @ts-nocheck
import React from 'react';
import { Outlet } from 'react-router-dom';

const MainLayout: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Outlet />
    </div>
  );
};

export default MainLayout;
