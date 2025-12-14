import React, { useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import './App.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8800/api/v1';

type AuthHook = {
  token: string | null;
  username: string | null;
  role: string | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; role?: string | null }>;
  logout: () => void;
  clearError: () => void;
};

type Account = {
  id: number;
  username: string;
  login_status?: string;
  last_login?: string | null;
  is_active: boolean;
  proxy_id?: number | null;
  two_factor_secret?: string | null;
  followers?: number | null;
  posts?: number | null;
  followers_change?: number | null;
};

type ProxyConfig = {
  id: number;
  name: string;
  host: string;
  port: number;
  username?: string | null;
  proxy_type?: string;
  is_active?: boolean;
};

type AccountStat = {
  stat_date: string;
  followers_count: number;
  posts_count: number;
  followers_change?: number | null;
};

type AdminUser = {
  id: number;
  username: string;
  email: string;
  full_name?: string | null;
  is_active: boolean;
  role: string;
  created_at: string;
  updated_at?: string | null;
};

type UserLimits = {
  max_accounts?: number;
  max_collect_per_day?: number;
  max_api_calls_per_day?: number;
};

type LimitUsage = {
  api_calls_today?: number;
  collect_today?: number;
};

const parseError = async (res: Response) => {
  try {
    const data = await res.json();
    return (
      data?.detail ||
      data?.message ||
      (typeof data === 'string' ? data : '') ||
      res.statusText
    );
  } catch (_) {
    return res.statusText;
  }
};

function useAuth(prefix: string): AuthHook {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(`${prefix}.token`)
  );
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem(`${prefix}.username`)
  );
  const [role, setRole] = useState<string | null>(
    localStorage.getItem(`${prefix}.role`)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const login = async (u: string, p: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });
      if (!res.ok) {
        const msg = await parseError(res);
        throw new Error(msg || '登录失败');
      }
      const data = await res.json();
      const receivedRole = data?.user?.role || 'user';
      setToken(data.access_token);
      setUsername(data?.user?.username || u);
      setRole(receivedRole);
      localStorage.setItem(`${prefix}.token`, data.access_token);
      localStorage.setItem(`${prefix}.username`, data?.user?.username || u);
      localStorage.setItem(`${prefix}.role`, receivedRole);
      return { success: true, role: receivedRole };
    } catch (err: any) {
      setError(err?.message || '登录失败');
      return { success: false, role: null };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
    setRole(null);
    localStorage.removeItem(`${prefix}.token`);
    localStorage.removeItem(`${prefix}.username`);
    localStorage.removeItem(`${prefix}.role`);
  };

  return { token, username, role, loading, error, login, logout, clearError };
}

const AuthCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; admin?: boolean }> = ({
  title,
  subtitle,
  children,
  admin,
}) => (
  <div className="content">
    <div className={`auth-card ${admin ? 'admin' : ''}`}>
      <h2>{title}</h2>
      {subtitle ? <p className="muted">{subtitle}</p> : null}
      {children}
    </div>
  </div>
);

const UserLogin: React.FC<{ auth: AuthHook }> = ({ auth }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    auth.clearError();
  }, [auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await auth.login(username.trim(), password);
    if (result.success) {
      navigate('/user/dashboard', { replace: true });
    }
  };

  return (
    <AuthCard title="用户登录" subtitle="欢迎回来，请先登录账户">
      {auth.error ? <div className="error">{auth.error}</div> : null}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>用户名</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="请输入用户名"
        />
        <label>密码</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="请输入密码"
        />
        <button type="submit" disabled={auth.loading}>
          {auth.loading ? '正在登录…' : '登录'}
        </button>
        <div className="muted">
          管理员入口请前往 <a href="/admin/login">管理员登录</a>
        </div>
      </form>
    </AuthCard>
  );
};

const AdminLogin: React.FC<{ auth: AuthHook }> = ({ auth }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    auth.clearError();
    setRoleError(null);
  }, [auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await auth.login(username.trim(), password);
    if (!result.success) return;
    const currentRole = (result.role || auth.role || '').toLowerCase();
    if (!currentRole.includes('admin')) {
      setRoleError('该账号没有管理员权限');
      auth.logout();
      return;
    }
    navigate('/admin/dashboard', { replace: true });
  };

  return (
    <AuthCard
      title="管理员登录"
      subtitle="仅限管理员访问"
      admin
    >
      {auth.error ? <div className="error">{auth.error}</div> : null}
      {roleError ? <div className="error">{roleError}</div> : null}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>用户名</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="请输入管理员用户名"
        />
        <label>密码</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="请输入密码"
        />
        <button type="submit" disabled={auth.loading}>
          {auth.loading ? '正在登录…' : '登录'}
        </button>
        <div className="muted">
          普通用户请前往 <a href="/login">用户登录</a>
        </div>
      </form>
    </AuthCard>
  );
};

const StatusBanner: React.FC<{ message?: string | null; type?: 'info' | 'error' }> = ({
  message,
  type = 'info',
}) => {
  if (!message) return null;
  return (
    <div
      className="status-banner"
      style={type === 'error' ? { background: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' } : undefined}
    >
      {message}
    </div>
  );
};

const AccountsManager: React.FC<{ token: string }> = ({ token }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [proxies, setProxies] = useState<ProxyConfig[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    username: '',
    password: '',
    totp: '',
    proxyId: '',
    isActive: true,
  });

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    [token]
  );

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/instagram/accounts`, { headers: authHeaders });
      if (!res.ok) {
        throw new Error(await parseError(res));
      }
      const data: Account[] = await res.json();
      setAccounts(data);
    } catch (err: any) {
      setError(err?.message || '加载账号失败');
    } finally {
      setLoading(false);
    }
  };

  const loadProxies = async () => {
    try {
      const res = await fetch(`${API_BASE}/instagram/proxies`, { headers: authHeaders });
      if (!res.ok) throw new Error(await parseError(res));
      const data: ProxyConfig[] = await res.json();
      setProxies(data);
    } catch (err: any) {
      setError(err?.message || '加载代理失败');
    }
  };

  useEffect(() => {
    loadAccounts();
    loadProxies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const resetForm = () => {
    setForm({
      username: '',
      password: '',
      totp: '',
      proxyId: '',
      isActive: true,
    });
    setEditingId(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim()) {
      setError('请填写用户名');
      return;
    }
    if (!editingId && !form.password) {
      setError('新增账号需要填写密码');
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const payload: Record<string, any> = {
        username: form.username.trim(),
      };
      if (form.password) payload.password = form.password;
      if (form.totp) payload.two_factor_secret = form.totp.trim();
      if (form.proxyId === '0') {
        payload.proxy_id = 0;
      } else if (form.proxyId) {
        payload.proxy_id = Number(form.proxyId);
      }
      payload.is_active = form.isActive;

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${API_BASE}/instagram/accounts/${editingId}`
        : `${API_BASE}/instagram/accounts`;

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(await parseError(res));
      }

      await loadAccounts();
      setMessage(editingId ? '账号已更新' : '账号已添加');
      resetForm();
      setFormVisible(false);
    } catch (err: any) {
      setError(err?.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError(null);
    setMessage(null);
    const res = await fetch(`${API_BASE}/instagram/accounts/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (!res.ok) {
      setError(await parseError(res));
      return;
    }
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setSelectedIds((prev) => prev.filter((v) => v !== id));
    setMessage('账号已删除');
  };

  const handleBatchDelete = async () => {
    if (!selectedIds.length) return;
    setError(null);
    const res = await fetch(`${API_BASE}/instagram/accounts/bulk-delete`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ ids: selectedIds }),
    });
    if (!res.ok) {
      setError(await parseError(res));
      return;
    }
    setMessage('批量删除完成');
    setSelectedIds([]);
    loadAccounts();
  };

  const handleRefreshStats = async (id: number) => {
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/instagram/accounts/${id}/stats`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(await parseError(res));
      const stats: AccountStat[] = await res.json();
      const latest = stats[stats.length - 1];
      const prev = stats.length > 1 ? stats[stats.length - 2] : undefined;
      setAccounts((prevAccounts) =>
        prevAccounts.map((acc) =>
          acc.id === id
            ? {
                ...acc,
                followers: latest?.followers_count ?? acc.followers,
                posts: latest?.posts_count ?? acc.posts,
                followers_change:
                  latest && prev
                    ? latest.followers_count - prev.followers_count
                    : acc.followers_change,
              }
            : acc
        )
      );
      setMessage('已刷新最新数据');
    } catch (err: any) {
      setError(err?.message || '刷新失败');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const proxyLabel = (proxyId?: number | null) => {
    if (!proxyId) return '未绑定代理';
    const found = proxies.find((p) => p.id === proxyId);
    if (!found) return '代理已删除';
    return `${found.name} (${found.proxy_type || 'http'}://${found.host}:${found.port})`;
  };

  const startEdit = (acc: Account) => {
    setEditingId(acc.id);
    setForm({
      username: acc.username,
      password: '',
      totp: acc.two_factor_secret || '',
      proxyId: acc.proxy_id ? String(acc.proxy_id) : '',
      isActive: acc.is_active,
    });
    setFormVisible(true);
    setMessage(null);
    setError(null);
  };

  return (
    <div className="panel bright">
      <div className="panel-head spaced">
        <div>
          <p className="eyebrow">账号管理</p>
          <h2>Instagram 账号中心</h2>
        </div>
        <div className="actions">
          <button className="solid-btn" onClick={() => setFormVisible((v) => !v)}>
            {formVisible ? '收起表单' : '添加账号'}
          </button>
          <button className="ghost-btn" onClick={loadAccounts}>
            刷新列表
          </button>
          <button
            className="ghost-btn"
            onClick={handleBatchDelete}
            disabled={!selectedIds.length}
          >
            批量删除
          </button>
        </div>
      </div>

      {message ? <StatusBanner message={message} /> : null}
      {error ? <StatusBanner message={error} type="error" /> : null}

      {formVisible ? (
        <div className="panel" style={{ marginTop: 10 }}>
          <div className="panel-head">
            <div>
              <p className="eyebrow">{editingId ? '编辑账号' : '新增账号'}</p>
              <h3 style={{ margin: 0 }}>{editingId ? '更新账号信息' : '快速添加一个新账号'}</h3>
            </div>
          </div>
          <form className="form-grid" onSubmit={onSubmit}>
            <input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="用户名"
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={editingId ? '密码（留空则不修改）' : '密码'}
            />
            <input
              value={form.totp}
              onChange={(e) => setForm((f) => ({ ...f, totp: e.target.value }))}
              placeholder="2FA TOTP 密钥（可选）"
            />
            <select
              value={form.proxyId}
              onChange={(e) => setForm((f) => ({ ...f, proxyId: e.target.value }))}
            >
              <option value="">不使用代理</option>
              <option value="0">取消绑定代理</option>
              {proxies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.proxy_type || 'http'}://{p.host}:{p.port})
                </option>
              ))}
            </select>
            <div className="inline-buttons">
              <button className="solid-btn" type="submit" disabled={submitting}>
                {submitting ? '保存中…' : editingId ? '保存修改' : '添加账号'}
              </button>
              <button
                className="ghost-btn"
                type="button"
                onClick={() => {
                  resetForm();
                  setFormVisible(false);
                }}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="list">
        {loading ? (
          <div className="muted">正在加载账号…</div>
        ) : accounts.length === 0 ? (
          <div className="muted">还没有账号，点击右上角“添加账号”开始吧</div>
        ) : (
          accounts.map((acc) => (
            <div className="list-row" key={acc.id}>
              <input
                type="checkbox"
                checked={selectedIds.includes(acc.id)}
                onChange={() => toggleSelect(acc.id)}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong>{acc.username}</strong>
                  <span className="muted small">
                    状态：{acc.login_status || (acc.is_active ? '已激活' : '停用')}
                  </span>
                </div>
                <div className="muted small">
                  代理：{proxyLabel(acc.proxy_id)} | 上次登录：{acc.last_login || '暂无'}
                </div>
                <div className="muted small">
                  粉丝：{acc.followers ?? '-'} / 帖子：{acc.posts ?? '-'}
                  {typeof acc.followers_change === 'number'
                    ? `（粉丝变化 ${acc.followers_change >= 0 ? '+' : ''}${acc.followers_change}）`
                    : ''}
                </div>
              </div>
              <div className="actions">
                <button className="ghost-btn" onClick={() => startEdit(acc)}>
                  编辑
                </button>
                <button className="ghost-btn" onClick={() => handleRefreshStats(acc.id)}>
                  刷新数据
                </button>
                <button className="ghost-btn" onClick={() => handleDelete(acc.id)}>
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const ProxyManager: React.FC<{ token: string }> = ({ token }) => {
  const [proxies, setProxies] = useState<ProxyConfig[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    host: '',
    port: '',
    username: '',
    password: '',
    proxyType: 'http',
  });

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    [token]
  );

  const loadProxies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/instagram/proxies`, { headers: authHeaders });
      if (!res.ok) throw new Error(await parseError(res));
      const data: ProxyConfig[] = await res.json();
      setProxies(data);
    } catch (err: any) {
      setError(err?.message || '加载代理失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProxies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const submitProxy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.host.trim() || !form.port) {
      setError('请填写代理名称、地址和端口');
      return;
    }
    setError(null);
    setMessage(null);
    const payload = {
      name: form.name.trim(),
      host: form.host.trim(),
      port: Number(form.port),
      username: form.username.trim() || undefined,
      password: form.password,
      proxy_type: form.proxyType,
      is_active: true,
    };
    const res = await fetch(`${API_BASE}/instagram/proxies`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setError(await parseError(res));
      return;
    }
    setForm({
      name: '',
      host: '',
      port: '',
      username: '',
      password: '',
      proxyType: 'http',
    });
    setFormVisible(false);
    setMessage('代理已添加');
    loadProxies();
  };

  const verifyProxy = async (proxy: ProxyConfig) => {
    setError(null);
    setMessage(null);
    setVerifyingId(proxy.id);
    try {
      const res = await fetch(`${API_BASE}/instagram/proxies/test`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          host: proxy.host,
          port: proxy.port,
          username: proxy.username,
          password: '',
          proxy_type: proxy.proxy_type || 'http',
        }),
      });
      if (!res.ok) {
        throw new Error(await parseError(res));
      }
      const data = await res.json();
      setMessage(data?.message || '验证完成');
    } catch (err: any) {
      setError(err?.message || '验证失败');
    } finally {
      setVerifyingId(null);
    }
  };

  const deleteProxy = async (id: number) => {
    setError(null);
    setMessage(null);
    const res = await fetch(`${API_BASE}/instagram/proxies/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (!res.ok) {
      setError(await parseError(res));
      return;
    }
    setMessage('代理已删除');
    setProxies((prev) => prev.filter((p) => p.id !== id));
    setSelectedIds((prev) => prev.filter((v) => v !== id));
  };

  const batchDelete = async () => {
    if (!selectedIds.length) return;
    setError(null);
    const res = await fetch(`${API_BASE}/instagram/proxies/bulk-delete`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ ids: selectedIds }),
    });
    if (!res.ok) {
      setError(await parseError(res));
      return;
    }
    setMessage('批量删除完成');
    setSelectedIds([]);
    loadProxies();
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  return (
    <div className="panel bright">
      <div className="panel-head spaced">
        <div>
          <p className="eyebrow">代理管理</p>
          <h2>网络代理中心</h2>
        </div>
        <div className="actions">
          <button className="solid-btn" onClick={() => setFormVisible((v) => !v)}>
            {formVisible ? '收起表单' : '添加代理'}
          </button>
          <button className="ghost-btn" onClick={loadProxies}>
            刷新列表
          </button>
          <button
            className="ghost-btn"
            onClick={batchDelete}
            disabled={!selectedIds.length}
          >
            批量删除
          </button>
        </div>
      </div>

      {message ? <StatusBanner message={message} /> : null}
      {error ? <StatusBanner message={error} type="error" /> : null}

      {formVisible ? (
        <div className="panel" style={{ marginTop: 10 }}>
          <div className="panel-head">
            <div>
              <p className="eyebrow">新增代理</p>
              <h3 style={{ margin: 0 }}>绑定可用的 HTTP / SOCKS5 代理</h3>
            </div>
          </div>
          <form className="form-grid" onSubmit={submitProxy}>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="代理名称"
            />
            <input
              value={form.host}
              onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))}
              placeholder="主机/IP"
            />
            <input
              type="number"
              value={form.port}
              onChange={(e) => setForm((f) => ({ ...f, port: e.target.value }))}
              placeholder="端口"
            />
            <select
              value={form.proxyType}
              onChange={(e) => setForm((f) => ({ ...f, proxyType: e.target.value }))}
            >
              <option value="http">HTTP</option>
              <option value="socks5">SOCKS5</option>
            </select>
            <input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="代理用户名（可选）"
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="代理密码（可选）"
            />
            <div className="inline-buttons">
              <button className="solid-btn" type="submit">
                保存代理
              </button>
              <button
                className="ghost-btn"
                type="button"
                onClick={() => setFormVisible(false)}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="list">
        {loading ? (
          <div className="muted">正在加载代理…</div>
        ) : proxies.length === 0 ? (
          <div className="muted">暂未添加代理</div>
        ) : (
          proxies.map((prox) => (
            <div className="list-row" key={prox.id}>
              <input
                type="checkbox"
                checked={selectedIds.includes(prox.id)}
                onChange={() => toggleSelect(prox.id)}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong>{prox.name}</strong>
                  <span className="muted small">
                    {prox.proxy_type || 'http'}://{prox.host}:{prox.port}
                  </span>
                </div>
                <div className="muted small">
                  认证：{prox.username ? prox.username : '无'} | 状态：
                  {prox.is_active === false ? '停用' : '启用'}
                </div>
              </div>
              <div className="actions">
                <button
                  className="ghost-btn"
                  onClick={() => verifyProxy(prox)}
                  disabled={verifyingId === prox.id}
                >
                  {verifyingId === prox.id ? '验证中…' : '验证'}
                </button>
                <button className="ghost-btn" onClick={() => deleteProxy(prox.id)}>
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const TaskPanel: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="panel bright">
    <p className="eyebrow">{title}</p>
    <h2>{description}</h2>
    <div className="muted">后续可在这里接入具体任务逻辑、实时状态与操作按钮。</div>
  </div>
);

const UserWorkspace: React.FC<{ auth: AuthHook }> = ({ auth }) => {
  const [activeTab, setActiveTab] = useState<
    'accounts' | 'proxies' | 'collection' | 'dm' | 'post' | 'im'
  >('accounts');

  const tabContent = () => {
    switch (activeTab) {
      case 'accounts':
        return auth.token ? <AccountsManager token={auth.token} /> : null;
      case 'proxies':
        return auth.token ? <ProxyManager token={auth.token} /> : null;
      case 'collection':
        return <TaskPanel title="采集任务" description="采集任务" />;
      case 'dm':
        return <TaskPanel title="私信任务" description="私信任务" />;
      case 'post':
        return <TaskPanel title="发帖任务" description="发帖任务" />;
      case 'im':
        return <TaskPanel title="即时消息" description="即时消息" />;
      default:
        return null;
    }
  };

  const navItems = [
    { key: 'accounts', label: '账号管理' },
    { key: 'proxies', label: '代理管理' },
    { key: 'collection', label: '采集任务' },
    { key: 'dm', label: '私信任务' },
    { key: 'post', label: '发帖任务' },
    { key: 'im', label: '即时消息' },
  ] as const;

  return (
    <div className="content">
      <div className="workspace">
        <div className="sidebar bright">
          <div className="sidebar-head">
            <div className="brand">用户中心</div>
            <div className="muted small">欢迎，{auth.username || '用户'}</div>
          </div>
          <div className="sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => setActiveTab(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button className="ghost-btn full" onClick={auth.logout}>
            退出登录
          </button>
        </div>
        <div>{tabContent()}</div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC<{ auth: AuthHook }> = ({ auth }) => {
  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${auth.token}`,
      'Content-Type': 'application/json',
    }),
    [auth.token]
  );
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userForm, setUserForm] = useState({
    email: '',
    full_name: '',
    role: 'user',
    is_active: true,
  });
  const [limitForm, setLimitForm] = useState({
    max_accounts: '',
    max_collect_per_day: '',
    max_api_calls_per_day: '',
  });
  const [usage, setUsage] = useState<LimitUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingUser, setSavingUser] = useState(false);
  const [savingLimit, setSavingLimit] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/users`, { headers });
      if (!res.ok) throw new Error(await parseError(res));
      const data: AdminUser[] = await res.json();
      setUsers(data);
      if (data.length && !selectedUser) {
        handleSelect(data[0]);
      }
    } catch (err: any) {
      setError(err?.message || '加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.token) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.token]);

  const handleSelect = (user: AdminUser) => {
    setSelectedUser(user);
    setUserForm({
      email: user.email || '',
      full_name: user.full_name || '',
      role: user.role || 'user',
      is_active: user.is_active,
    });
    setMessage(null);
    setError(null);
    loadLimits(user.id);
    loadUsage(user.id);
  };

  const loadLimits = async (userId: number) => {
    try {
      const res = await fetch(`${API_BASE}/admin/limits/${userId}`, { headers });
      if (!res.ok) throw new Error(await parseError(res));
      const data: UserLimits = await res.json();
      setLimitForm({
        max_accounts: data.max_accounts !== undefined ? String(data.max_accounts) : '',
        max_collect_per_day: data.max_collect_per_day !== undefined ? String(data.max_collect_per_day) : '',
        max_api_calls_per_day: data.max_api_calls_per_day !== undefined ? String(data.max_api_calls_per_day) : '',
      });
    } catch (err: any) {
      setError(err?.message || '加载限额失败');
    }
  };

  const loadUsage = async (userId: number) => {
    try {
      const res = await fetch(`${API_BASE}/admin/limits/${userId}/usage`, { headers });
      if (!res.ok) throw new Error(await parseError(res));
      const data: LimitUsage = await res.json();
      setUsage(data);
    } catch (err: any) {
      setError(err?.message || '加载使用情况失败');
    }
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSavingUser(true);
    setMessage(null);
    setError(null);
    try {
      const payload = {
        email: userForm.email || undefined,
        full_name: userForm.full_name || '',
        role: userForm.role,
        is_active: userForm.is_active,
      };
      const res = await fetch(`${API_BASE}/users/${selectedUser.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await parseError(res));
      setMessage('用户信息已更新');
      loadUsers();
    } catch (err: any) {
      setError(err?.message || '保存失败');
    } finally {
      setSavingUser(false);
    }
  };

  const saveLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSavingLimit(true);
    setMessage(null);
    setError(null);
    try {
      const toNumber = (v: string) => (v === '' ? undefined : Number(v));
      const payload: any = {};
      const m1 = toNumber(limitForm.max_accounts);
      const m2 = toNumber(limitForm.max_collect_per_day);
      const m3 = toNumber(limitForm.max_api_calls_per_day);
      if (m1 !== undefined) payload.max_accounts = m1;
      if (m2 !== undefined) payload.max_collect_per_day = m2;
      if (m3 !== undefined) payload.max_api_calls_per_day = m3;

      const res = await fetch(`${API_BASE}/admin/limits/${selectedUser.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await parseError(res));
      setMessage('限额已更新');
      loadLimits(selectedUser.id);
    } catch (err: any) {
      setError(err?.message || '保存失败');
    } finally {
      setSavingLimit(false);
    }
  };

  return (
    <div className="content">
      <div className="panel bright">
        <p className="eyebrow">管理员中心</p>
        <h2>欢迎，{auth.username || '管理员'}</h2>
        <div className="muted">管理平台用户、角色、启用状态以及限额配置。</div>
      </div>

      {message ? <StatusBanner message={message} /> : null}
      {error ? <StatusBanner message={error} type="error" /> : null}

      <div className="workspace">
        <div className="sidebar bright">
          <div className="sidebar-head">
            <div className="brand">用户列表</div>
            <div className="muted small">选择一个用户进行编辑</div>
          </div>
          <div className="sidebar-nav" style={{ maxHeight: 480, overflow: 'auto' }}>
            {loading ? (
              <div className="muted small">正在加载...</div>
            ) : users.length === 0 ? (
              <div className="muted small">暂无用户</div>
            ) : (
              users.map((u) => (
                <button
                  key={u.id}
                  className={`nav-item ${selectedUser?.id === u.id ? 'active' : ''}`}
                  onClick={() => handleSelect(u)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{u.username}</span>
                    <span className="muted small">{u.role}</span>
                  </div>
                  <div className="muted small">{u.is_active ? '已启用' : '已停用'}</div>
                </button>
              ))
            )}
          </div>
          <button className="ghost-btn full" onClick={auth.logout}>
            退出登录
          </button>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {!selectedUser ? (
            <div className="panel">
              <div className="muted">请选择左侧用户进行管理</div>
            </div>
          ) : (
            <>
              <div className="panel bright">
                <div className="panel-head">
                  <div>
                    <p className="eyebrow">用户信息</p>
                    <h3 style={{ margin: 0 }}>{selectedUser.username}</h3>
                    <div className="muted small">创建时间：{selectedUser.created_at}</div>
                  </div>
                </div>
                <form className="form-grid" onSubmit={saveUser}>
                  <input
                    value={userForm.email}
                    onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="邮箱"
                  />
                  <input
                    value={userForm.full_name}
                    onChange={(e) => setUserForm((f) => ({ ...f, full_name: e.target.value }))}
                    placeholder="姓名（可选）"
                  />
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                    <option value="super_admin">super_admin</option>
                  </select>
                  <div>
                    <label style={{ fontSize: 14, color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={userForm.is_active}
                        onChange={(e) => setUserForm((f) => ({ ...f, is_active: e.target.checked }))}
                        style={{ marginRight: 8 }}
                      />
                      账号启用
                    </label>
                  </div>
                  <div className="inline-buttons">
                    <button className="solid-btn" type="submit" disabled={savingUser}>
                      {savingUser ? '保存中…' : '保存用户信息'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="panel bright">
                <div className="panel-head">
                  <div>
                    <p className="eyebrow">限额配置</p>
                    <h3 style={{ margin: 0 }}>账号数 / 采集 / API 调用</h3>
                  </div>
                  {usage ? (
                    <div className="muted small">
                      今日采集：{usage.collect_today ?? 0} | 今日 API 调用：{usage.api_calls_today ?? 0}
                    </div>
                  ) : null}
                </div>
                <form className="form-grid" onSubmit={saveLimits}>
                  <input
                    type="number"
                    value={limitForm.max_accounts}
                    onChange={(e) => setLimitForm((f) => ({ ...f, max_accounts: e.target.value }))}
                    placeholder="最大账号数"
                  />
                  <input
                    type="number"
                    value={limitForm.max_collect_per_day}
                    onChange={(e) => setLimitForm((f) => ({ ...f, max_collect_per_day: e.target.value }))}
                    placeholder="每日采集上限"
                  />
                  <input
                    type="number"
                    value={limitForm.max_api_calls_per_day}
                    onChange={(e) => setLimitForm((f) => ({ ...f, max_api_calls_per_day: e.target.value }))}
                    placeholder="每日 API 调用上限"
                  />
                  <div className="inline-buttons">
                    <button className="solid-btn" type="submit" disabled={savingLimit}>
                      {savingLimit ? '保存中…' : '保存限额'}
                    </button>
                    <button className="ghost-btn" type="button" onClick={() => selectedUser && loadLimits(selectedUser.id)}>
                      重新加载
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
const ProtectedRoute: React.FC<{
  auth: AuthHook;
  admin?: boolean;
  element: JSX.Element;
}> = ({ auth, admin, element }) => {
  if (!auth.token) {
    return <Navigate to={admin ? '/admin/login' : '/login'} replace />;
  }
  if (admin && (!auth.role || !auth.role.toLowerCase().includes('admin'))) {
    return <Navigate to="/login" replace />;
  }
  return element;
};

const App: React.FC = () => {
  const userAuth = useAuth('user');
  const adminAuth = useAuth('admin');

  return (
    <div className="app">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<UserLogin auth={userAuth} />} />
          <Route path="/admin/login" element={<AdminLogin auth={adminAuth} />} />
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute
                auth={userAuth}
                element={<UserWorkspace auth={userAuth} />}
              />
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute
                auth={adminAuth}
                admin
                element={<AdminDashboard auth={adminAuth} />}
              />
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
