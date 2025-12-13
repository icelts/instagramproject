// @ts-nocheck
/**
 * 前端路由系统
 */

import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Spinner } from '@/components/ui';

// 懒加载页面组件
const LoginPage = React.lazy(() => import('@/pages/LoginPage'));
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'));
const InstagramAccountsPage = React.lazy(() => import('@/pages/InstagramAccountsPage'));
const ProxyConfigPage = React.lazy(() => import('@/pages/ProxyConfigPage'));
const SchedulePage = React.lazy(() => import('@/pages/SchedulePage'));
const SearchTaskPage = React.lazy(() => import('@/pages/SearchTaskPage'));
const MonitoringPage = React.lazy(() => import('@/pages/MonitoringPage'));
const AutoReplyPage = React.lazy(() => import('@/pages/AutoReplyPage'));
const DataExportPage = React.lazy(() => import('@/pages/DataExportPage'));
const ConversationPage = React.lazy(() => import('@/pages/ConversationPage'));
const RealTimeMessagesPage = React.lazy(() => import('@/pages/RealTimeMessagesPage'));
const AutoReplyEnginePage = React.lazy(() => import('@/pages/AutoReplyEnginePage'));
const SettingsPage = React.lazy(() => import('@/pages/SettingsPage'));
const BatchOperationsPage = React.lazy(() => import('@/pages/BatchOperationsPage'));
const DataVisualizationPage = React.lazy(() => import('@/pages/DataVisualizationPage'));
const AdvancedSearchPage = React.lazy(() => import('@/pages/AdvancedSearchPage'));
const AdminLoginPage = React.lazy(() => import('@/pages/admin/AdminLoginPage'));
const AdminUserListPage = React.lazy(() => import('@/pages/admin/AdminUserListPage'));

// 布局组件
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import AdminLayout from '@/layouts/AdminLayout';

// 加载组件
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spinner className="h-8 w-8" />
  </div>
);

// 需要认证的路由守卫
const ProtectedRoute = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.is_active) return <Navigate to="/login?error=account_disabled" replace />;
  return <Outlet />;
};

// 管理员路由守卫（复用用户登录态，基于 role）
const AdminRoute = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const allowedRoles = ['admin', 'super_admin'];
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || !allowedRoles.includes(user.role || 'user')) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

// 公共路由
const PublicRoute = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

// 路由配置（优先 admin，再公共，再受保护）
const router = createBrowserRouter([
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <AdminUserListPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <LoginPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <DashboardPage />
          </Suspense>
        ),
        meta: { title: '仪表盘', icon: 'Dashboard', requireAuth: true },
      },
      {
        path: 'instagram/accounts',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <InstagramAccountsPage />
          </Suspense>
        ),
        meta: { title: 'Instagram账号', icon: 'Users', requireAuth: true },
      },
      {
        path: 'proxy',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <ProxyConfigPage />
          </Suspense>
        ),
        meta: { title: '代理配置', icon: 'Shield', requireAuth: true },
      },
      {
        path: 'scheduler',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <SchedulePage />
          </Suspense>
        ),
        meta: { title: '定时任务', icon: 'Calendar', requireAuth: true },
      },
      {
        path: 'search',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <SearchTaskPage />
          </Suspense>
        ),
        meta: { title: '搜索任务', icon: 'Search', requireAuth: true },
      },
      {
        path: 'monitoring',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <MonitoringPage />
          </Suspense>
        ),
        meta: { title: '实时监控', icon: 'Activity', requireAuth: true },
      },
      {
        path: 'auto-reply',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <AutoReplyPage />
          </Suspense>
        ),
        meta: { title: '自动回复', icon: 'MessageSquare', requireAuth: true },
      },
      {
        path: 'auto-reply/engine',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <AutoReplyEnginePage />
          </Suspense>
        ),
        meta: { title: '自动回复引擎', icon: 'Bot', requireAuth: true, parent: '/auto-reply' },
      },
      {
        path: 'conversations',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <ConversationPage />
          </Suspense>
        ),
        meta: { title: '会话管理', icon: 'MessageCircle', requireAuth: true },
      },
      {
        path: 'realtime-messages',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <RealTimeMessagesPage />
          </Suspense>
        ),
        meta: { title: '实时消息', icon: 'Zap', requireAuth: true },
      },
      {
        path: 'export',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <DataExportPage />
          </Suspense>
        ),
        meta: { title: '数据导出', icon: 'Download', requireAuth: true },
      },
      {
        path: 'visualization',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <DataVisualizationPage />
          </Suspense>
        ),
        meta: { title: '数据可视化', icon: 'BarChart', requireAuth: true },
      },
      {
        path: 'batch-operations',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <BatchOperationsPage />
          </Suspense>
        ),
        meta: { title: '批量操作', icon: 'Layers', requireAuth: true },
      },
      {
        path: 'advanced-search',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <AdvancedSearchPage />
          </Suspense>
        ),
        meta: { title: '高级搜索', icon: 'Filter', requireAuth: true },
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <SettingsPage />
          </Suspense>
        ),
        meta: { title: '系统设置', icon: 'Settings', requireAuth: true },
      },
    ],
  },
  {
    path: '*',
    element: (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-muted-foreground mb-4">页面未找到</p>
          <button onClick={() => window.history.back()} className="text-primary hover:underline">
            返回上一页
          </button>
        </div>
      </div>
    ),
  },
]);

// 路由配置导出（用于侧边栏等）
export const routeConfig = [
  { path: '/dashboard', title: '仪表盘', icon: 'Dashboard', roles: ['user', 'admin'] },
  { path: '/instagram/accounts', title: 'Instagram账号', icon: 'Users', roles: ['user', 'admin'] },
  { path: '/proxy', title: '代理配置', icon: 'Shield', roles: ['user', 'admin'] },
  { path: '/scheduler', title: '定时任务', icon: 'Calendar', roles: ['user', 'admin'] },
  { path: '/search', title: '搜索任务', icon: 'Search', roles: ['user', 'admin'] },
  { path: '/monitoring', title: '实时监控', icon: 'Activity', roles: ['user', 'admin'] },
  {
    path: '/auto-reply',
    title: '自动回复',
    icon: 'MessageSquare',
    roles: ['user', 'admin'],
    children: [{ path: '/auto-reply/engine', title: '自动回复引擎', icon: 'Bot' }],
  },
  { path: '/conversations', title: '会话管理', icon: 'MessageCircle', roles: ['user', 'admin'] },
  { path: '/realtime-messages', title: '实时消息', icon: 'Zap', roles: ['user', 'admin'] },
  { path: '/export', title: '数据导出', icon: 'Download', roles: ['user', 'admin'] },
  { path: '/visualization', title: '数据可视化', icon: 'BarChart', roles: ['user', 'admin'] },
  { path: '/batch-operations', title: '批量操作', icon: 'Layers', roles: ['user', 'admin'] },
  { path: '/advanced-search', title: '高级搜索', icon: 'Filter', roles: ['user', 'admin'] },
  { path: '/settings', title: '系统设置', icon: 'Settings', roles: ['user', 'admin'] },
  { path: '/admin', title: '管理员', icon: 'Shield', roles: ['admin', 'super_admin'] },
];

export const getAccessibleRoutes = (userRole: string) => routeConfig.filter((route) => route.roles.includes(userRole));

export const getRouteTitle = (pathname: string): string => {
  const route = routeConfig.find((r) => r.path === pathname);
  return route?.title || '未知页面';
};

export const checkRoutePermission = (pathname: string, userRole: string): boolean => {
  const route = routeConfig.find((r) => r.path === pathname);
  return route ? route.roles.includes(userRole) : false;
};

const AppRouter: React.FC = () => <RouterProvider router={router} />;
export default AppRouter;
