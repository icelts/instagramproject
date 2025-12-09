// @ts-nocheck
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface InstagramAccount {
  id: number;
  username: string;
  login_status: 'logged_out' | 'logged_in' | 'challenge_required' | 'banned';
  last_login?: string;
  is_active: boolean;
  created_at: string;
  proxy_id?: number | null;
}

interface ProxyConfig {
  id: number;
  name: string;
  host: string;
  port: number;
  username?: string;
  proxy_type: 'http' | 'https' | 'socks4' | 'socks5';
  is_active: boolean;
  created_at: string;
}

interface InstagramState {
  accounts: InstagramAccount[];
  proxies: ProxyConfig[];
  currentAccount: InstagramAccount | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: InstagramState = {
  accounts: [],
  proxies: [],
  currentAccount: null,
  isLoading: false,
  error: null,
};

const API_BASE = 'http://localhost:8000/api/v1/instagram';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('未认证');
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

const handleError = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    if (data?.detail) return data.detail;
  } catch (_) {
    // ignore
  }
  return fallback;
};

export const fetchInstagramAccounts = createAsyncThunk('instagram/fetchAccounts', async (_, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_BASE}/accounts`, { headers: authHeaders() });
    if (!response.ok) {
      const msg = await handleError(response, '获取账号失败');
      throw new Error(msg);
    }
    return await response.json();
  } catch (error: any) {
    return rejectWithValue(error.message || '请求失败');
  }
});

export const addInstagramAccount = createAsyncThunk(
  'instagram/addAccount',
  async (accountData: { username: string; password: string; proxy_id?: number }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/accounts`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
      });
      if (!response.ok) {
        const msg = await handleError(response, '添加账号失败');
        throw new Error(msg);
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || '请求失败');
    }
  }
);

export const loginInstagramAccount = createAsyncThunk('instagram/loginAccount', async (accountId: number, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_BASE}/accounts/${accountId}/login`, {
      method: 'POST',
      headers: authHeaders(),
    });
    if (!response.ok) {
      const msg = await handleError(response, '登录失败');
      throw new Error(msg);
    }
    return await response.json();
  } catch (error: any) {
    return rejectWithValue(error.message || '请求失败');
  }
});

export const checkAccountStatus = createAsyncThunk('instagram/checkAccountStatus', async (accountId: number, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_BASE}/accounts/${accountId}/status`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      const msg = await handleError(response, '检查状态失败');
      throw new Error(msg);
    }
    const data = await response.json();
    return { accountId, status: data };
  } catch (error: any) {
    return rejectWithValue(error.message || '请求失败');
  }
});

export const deleteInstagramAccount = createAsyncThunk('instagram/deleteAccount', async (accountId: number, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_BASE}/accounts/${accountId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!response.ok) {
      const msg = await handleError(response, '删除账号失败');
      throw new Error(msg);
    }
    return accountId;
  } catch (error: any) {
    return rejectWithValue(error.message || '请求失败');
  }
});

export const fetchProxyConfigs = createAsyncThunk('instagram/fetchProxies', async (_, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_BASE}/proxies`, { headers: authHeaders() });
    if (!response.ok) {
      const msg = await handleError(response, '获取代理失败');
      throw new Error(msg);
    }
    return await response.json();
  } catch (error: any) {
    return rejectWithValue(error.message || '请求失败');
  }
});

export const addProxyConfig = createAsyncThunk('instagram/addProxy', async (proxyData: Partial<ProxyConfig>, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_BASE}/proxies`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(proxyData),
    });
    if (!response.ok) {
      const msg = await handleError(response, '添加代理失败');
      throw new Error(msg);
    }
    return await response.json();
  } catch (error: any) {
    return rejectWithValue(error.message || '请求失败');
  }
});

const instagramSlice = createSlice({
  name: 'instagram',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setCurrentAccount: (state, action) => {
      state.currentAccount = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchInstagramAccounts.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInstagramAccounts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts = action.payload;
      })
      .addCase(fetchInstagramAccounts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(addInstagramAccount.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addInstagramAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts.push(action.payload);
      })
      .addCase(addInstagramAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(loginInstagramAccount.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginInstagramAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        const { accountId, status } = action.payload;
        const account = state.accounts.find(acc => acc.id === accountId);
        if (account) {
          account.login_status = status.login_status;
          account.last_login = status.last_login;
        }
      })
      .addCase(loginInstagramAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(checkAccountStatus.fulfilled, (state, action) => {
        const { accountId, status } = action.payload;
        const account = state.accounts.find(acc => acc.id === accountId);
        if (account) {
          account.login_status = status.login_status;
          account.last_login = status.last_login;
        }
      })
      .addCase(checkAccountStatus.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(deleteInstagramAccount.fulfilled, (state, action) => {
        state.accounts = state.accounts.filter(account => account.id !== action.payload);
        if (state.currentAccount?.id === action.payload) {
          state.currentAccount = null;
        }
      })
      .addCase(deleteInstagramAccount.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(fetchProxyConfigs.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProxyConfigs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.proxies = action.payload;
      })
      .addCase(fetchProxyConfigs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(addProxyConfig.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addProxyConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        state.proxies.push(action.payload);
      })
      .addCase(addProxyConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCurrentAccount } = instagramSlice.actions;
export default instagramSlice.reducer;
