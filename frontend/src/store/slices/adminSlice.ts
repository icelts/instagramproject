import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface AdminUser {
  id: number;
  username: string;
  email: string;
}

interface UserLimits {
  max_accounts: number;
  max_collect_per_day: number;
  max_api_calls_per_day: number;
}

interface UserUsage {
  api_calls_today: number;
  collect_today: number;
}

interface AdminState {
  adminToken: string | null;
  isAuthenticated: boolean;
  adminUser?: any;
  users: AdminUser[];
  limits: Record<number, UserLimits>;
  usage: Record<number, UserUsage>;
  loading: boolean;
  error: string | null;
  selectedUserId?: number;
}

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8800';

const initialState: AdminState = {
  adminToken: localStorage.getItem('adminToken'),
  isAuthenticated: !!localStorage.getItem('adminToken'),
  users: [],
  limits: {},
  usage: {},
  loading: false,
  error: null,
};

const authHeaders = (token: string | null) => {
  if (!token) throw new Error('未登录管理员');
  return { Authorization: `Bearer ${token}` };
};

export const adminLogin = createAsyncThunk(
  'admin/login',
  async (credentials: { username: string; password: string }) => {
    const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || '管理员登录失败');
    }
    return response.json();
  }
);

export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as any;
    const token = state.admin.adminToken as string | null;
    try {
      const response = await fetch(`${API_BASE}/api/v1/users`, {
        headers: authHeaders(token),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || '获取用户列表失败');
      }
      return await response.json();
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const fetchLimits = createAsyncThunk(
  'admin/fetchLimits',
  async (userId: number, { getState, rejectWithValue }) => {
    const state = getState() as any;
    const token = state.admin.adminToken as string | null;
    try {
      const response = await fetch(`${API_BASE}/api/v1/admin/limits/${userId}`, {
        headers: authHeaders(token),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || '获取配额失败');
      }
      const data = await response.json();
      return { userId, limits: data };
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const updateLimits = createAsyncThunk(
  'admin/updateLimits',
  async ({ userId, payload }: { userId: number; payload: Partial<UserLimits> }, { getState, rejectWithValue }) => {
    const state = getState() as any;
    const token = state.admin.adminToken as string | null;
    try {
      const response = await fetch(`${API_BASE}/api/v1/admin/limits/${userId}`, {
        method: 'PUT',
        headers: {
          ...authHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || '更新配额失败');
      }
      const data = await response.json();
      return { userId, limits: data };
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const fetchUsage = createAsyncThunk(
  'admin/fetchUsage',
  async (userId: number, { getState, rejectWithValue }) => {
    const state = getState() as any;
    const token = state.admin.adminToken as string | null;
    try {
      const response = await fetch(`${API_BASE}/api/v1/admin/limits/${userId}/usage`, {
        headers: authHeaders(token),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || '获取用量失败');
      }
      const data = await response.json();
      return { userId, usage: data };
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    adminLogout(state) {
      state.adminToken = null;
      state.isAuthenticated = false;
      state.adminUser = null;
      localStorage.removeItem('adminToken');
    },
    clearAdminError(state) {
      state.error = null;
    },
    selectUser(state, action: PayloadAction<number | undefined>) {
      state.selectedUserId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.adminToken = action.payload.access_token;
        state.adminUser = action.payload.user;
        localStorage.setItem('adminToken', action.payload.access_token);
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '管理员登录失败';
      })
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchLimits.fulfilled, (state, action) => {
        state.limits[action.payload.userId] = action.payload.limits;
      })
      .addCase(updateLimits.fulfilled, (state, action) => {
        state.limits[action.payload.userId] = action.payload.limits;
      })
      .addCase(updateLimits.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(fetchUsage.fulfilled, (state, action) => {
        state.usage[action.payload.userId] = action.payload.usage;
      });
  },
});

export const { adminLogout, clearAdminError, selectUser } = adminSlice.actions;
export default adminSlice.reducer;
