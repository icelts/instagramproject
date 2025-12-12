import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AppDispatch, RootState } from '@/store';
import { fetchUsers, fetchLimits, updateLimits, selectUser, fetchUsage } from '@/store/slices/adminSlice';

const AdminUserListPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isAuthenticated, users, limits, usage, loading, error, selectedUserId } = useSelector((state: RootState) => state.admin);
  const [form, setForm] = useState({ max_accounts: 1, max_collect_per_day: 100, max_api_calls_per_day: 1000 });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login', { replace: true });
      return;
    }
    dispatch(fetchUsers());
  }, [dispatch, isAuthenticated, navigate]);

  const currentLimits = useMemo(() => {
    if (selectedUserId && limits[selectedUserId]) {
      return limits[selectedUserId];
    }
    return null;
  }, [limits, selectedUserId]);

  useEffect(() => {
    if (selectedUserId) {
      if (!limits[selectedUserId]) {
        dispatch(fetchLimits(selectedUserId));
        setForm({ max_accounts: 1, max_collect_per_day: 100, max_api_calls_per_day: 1000 });
      } else {
        setForm(limits[selectedUserId]);
      }
      dispatch(fetchUsage(selectedUserId));
    }
  }, [dispatch, limits, selectedUserId]);

  const handleSelectUser = (userId: number) => {
    dispatch(selectUser(userId));
  };

  const handleSave = () => {
    if (!selectedUserId) return;
    dispatch(updateLimits({ userId: selectedUserId, payload: form }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">配额管理</h1>
          <p className="text-sm text-gray-500">查看并调整用户的账号/采集/API 调用上限</p>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">加载中...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 border rounded-lg bg-white shadow-sm">
          <div className="p-4 border-b">
            <h2 className="font-semibold">用户列表</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">用户名</th>
                  <th className="px-4 py-2 text-left">邮箱</th>
                  <th className="px-4 py-2 text-left">今日 API</th>
                  <th className="px-4 py-2 text-left">今日采集</th>
                  <th className="px-4 py-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-4 py-2">{u.id}</td>
                    <td className="px-4 py-2">{u.username}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{usage[u.id]?.api_calls_today ?? '-'}</td>
                    <td className="px-4 py-2">{usage[u.id]?.collect_today ?? '-'}</td>
                    <td className="px-4 py-2">
                      <Button size="sm" variant={selectedUserId === u.id ? 'secondary' : 'outline'} onClick={() => handleSelectUser(u.id)}>
                        编辑配额
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border rounded-lg bg-white shadow-sm p-4">
          <h2 className="font-semibold mb-3">配额设置</h2>
          {selectedUserId ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-2">当前用户 ID：{selectedUserId}</p>
              <label className="text-sm text-gray-600">账号上限</label>
              <Input
                type="number"
                min={1}
                value={form.max_accounts}
                onChange={(e) => setForm({ ...form, max_accounts: Number(e.target.value) })}
              />
              <label className="text-sm text-gray-600">每日采集上限</label>
              <Input
                type="number"
                min={0}
                value={form.max_collect_per_day}
                onChange={(e) => setForm({ ...form, max_collect_per_day: Number(e.target.value) })}
              />
              <label className="text-sm text-gray-600">每日 API 上限</label>
              <Input
                type="number"
                min={1}
                value={form.max_api_calls_per_day}
                onChange={(e) => setForm({ ...form, max_api_calls_per_day: Number(e.target.value) })}
              />
              <Button className="w-full" onClick={handleSave} disabled={loading}>
                {loading ? '保存中...' : '保存'}
              </Button>
              {currentLimits && (
                <p className="text-xs text-gray-500">
                  当前：账号 {currentLimits.max_accounts} / 采集 {currentLimits.max_collect_per_day} / API {currentLimits.max_api_calls_per_day}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">请选择左侧用户查看/编辑配额</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserListPage;
