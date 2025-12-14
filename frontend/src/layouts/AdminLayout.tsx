import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Button } from '../components/ui/Button';
import { adminLogout } from '../store/slices/adminSlice';
import { AppDispatch } from '../store';

const AdminLayout: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(adminLogout());
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="font-semibold text-lg">管理员控制台</Link>
          <nav className="flex items-center gap-3 text-sm text-gray-600">
            <Link to="/admin">配额管理</Link>
          </nav>
        </div>
        <Button size="sm" variant="outline" onClick={handleLogout}>退出</Button>
      </header>
      <main className="max-w-6xl mx-auto py-6 px-4">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
