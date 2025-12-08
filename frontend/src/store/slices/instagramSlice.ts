import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface InstagramAccount {
  id: number;
  username: string;
  login_status: 'logged_out' | 'logged_in' | 'challenge_required' | 'banned';
  last_login?: string;
  is_active: boolean;
  created_at: string;
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

// 异步actions
export const fetchInstagramAccounts = createAsyncThunk(
  'instagram/fetchAccounts',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('未认证');
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/instagram/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取Instagram账号失败');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addInstagramAccount = createAsyncThunk(
  'instagram/addAccount',
  async (accountData: {
    username: string;
    password: string;
    proxy_id?: number;
  }, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('未认证');
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/instagram/accounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '添加账号失败');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loginInstagramAccount = createAsyncThunk(
  'instagram/loginAccount',
  async (accountId: number, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('未认证');
    }

    try {
      const response = await fetch(`http://localhost:8000/api/v1/instagram/accounts/${accountId}/login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '登录失败');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const checkAccountStatus = createAsyncThunk(
  'instagram/checkAccountStatus',
  async (accountId: number, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('未认证');
    }

    try {
      const response = await fetch(`http://localhost:8000/api/v1/instagram/accounts/${accountId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('检查状态失败');
      }

      const data = await response.json();
      return { accountId, status: data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteInstagramAccount = createAsyncThunk(
  'instagram/deleteAccount',
  async (accountId: number, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('未认证');
    }

    try {
      const response = await fetch(`http://localhost:8000/api/v1/instagram/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('删除账号失败');
      }

      return accountId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchProxyConfigs = createAsyncThunk(
  'instagram/fetchProxies',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('未认证');
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/instagram/proxies', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取代理配置失败');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addProxyConfig = createAsyncThunk(
  'instagram/addProxy',
  async (proxyData: ProxyConfig, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('未认证');
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/instagram/proxies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proxyData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '添加代理失败');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const instagramSlice = createSlice({
  name: 'instagram',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentAccount: (state, action) => {
      state.currentAccount = action.payload;
    },
  },
  extraReducers: (builder) => {
    // 获取Instagram账号
    builder
      .addCase(fetchInstagramAccounts.pending, (state) => {
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
      });

    // 添加Instagram账号
    builder
      .addCase(addInstagramAccount.pending, (state) => {
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
      });

    // 登录Instagram账号
    builder
      .addCase(loginInstagramAccount.pending, (state) => {
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
      });

    // 检查账号状态
    builder
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
      });

    // 删除Instagram账号
    builder
      .addCase(deleteInstagramAccount.fulfilled, (state, action) => {
        state.accounts = state.accounts.filter(account => account.id !== action.payload);
        if (state.currentAccount?.id === action.payload) {
          state.currentAccount = null;
        }
      })
      .addCase(deleteInstagramAccount.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // 获取代理配置
    builder
      .addCase(fetchProxyConfigs.pending, (state) => {
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
      });

    // 添加代理配置
    builder
      .addCase(addProxyConfig.pending, (state) => {
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
