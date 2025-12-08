import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface PostSchedule {
  id: number;
  title: string;
  content: string;
  scheduled_time: string;
  repeat_type: 'once' | 'daily' | 'weekly' | 'monthly';
  status: 'pending' | 'posted' | 'failed' | 'cancelled';
  posted_at?: string;
  created_at: string;
}

interface SearchTask {
  id: number;
  task_name: string;
  search_type: 'hashtag' | 'location' | 'username' | 'keyword';
  search_query: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  results?: any;
}

interface SchedulerState {
  schedules: PostSchedule[];
  searchTasks: SearchTask[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SchedulerState = {
  schedules: [],
  searchTasks: [],
  isLoading: false,
  error: null,
};

// 异步actions
export const fetchSchedules = createAsyncThunk(
  'scheduler/fetchSchedules',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('未认证');
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/scheduler/schedules', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取发帖计划失败');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createSchedule = createAsyncThunk(
  'scheduler/createSchedule',
  async (scheduleData: {
    instagram_account_id: number;
    title: string;
    content: string;
    scheduled_time: string;
    repeat_type?: 'once' | 'daily' | 'weekly' | 'monthly';
    media_files?: any[];
  }, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('未认证');
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/scheduler/schedules', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '创建发帖计划失败');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteSchedule = createAsyncThunk(
  'scheduler/deleteSchedule',
  async (scheduleId: number, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('未认证');
    }

    try {
      const response = await fetch(`http://localhost:8000/api/v1/scheduler/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('删除发帖计划失败');
      }

      return scheduleId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSearchTasks = createAsyncThunk(
  'scheduler/fetchSearchTasks',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('未认证');
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/scheduler/search-tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取搜索任务失败');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createSearchTask = createAsyncThunk(
  'scheduler/createSearchTask',
  async (taskData: {
    instagram_account_id: number;
    task_name: string;
    search_type: 'hashtag' | 'location' | 'username' | 'keyword';
    search_query: string;
    search_params?: any;
  }, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('未认证');
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/scheduler/search-tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '创建搜索任务失败');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const exportSearchData = createAsyncThunk(
  'scheduler/exportSearchData',
  async ({ taskId, format }: { taskId: number; format: string }, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('未认证');
    }

    try {
      const response = await fetch(`http://localhost:8000/api/v1/scheduler/search-tasks/${taskId}/export?format_type=${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('导出数据失败');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getSearchAnalysis = createAsyncThunk(
  'scheduler/getSearchAnalysis',
  async (taskId: number, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('未认证');
    }

    try {
      const response = await fetch(`http://localhost:8000/api/v1/scheduler/search-tasks/${taskId}/analysis`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取分析数据失败');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const schedulerSlice = createSlice({
  name: 'scheduler',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // 获取发帖计划
    builder
      .addCase(fetchSchedules.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSchedules.fulfilled, (state, action) => {
        state.isLoading = false;
        state.schedules = action.payload;
      })
      .addCase(fetchSchedules.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // 创建发帖计划
    builder
      .addCase(createSchedule.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createSchedule.fulfilled, (state, action) => {
        state.isLoading = false;
        state.schedules.push(action.payload);
      })
      .addCase(createSchedule.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // 删除发帖计划
    builder
      .addCase(deleteSchedule.fulfilled, (state, action) => {
        state.schedules = state.schedules.filter(schedule => schedule.id !== action.payload);
      })
      .addCase(deleteSchedule.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // 获取搜索任务
    builder
      .addCase(fetchSearchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSearchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchTasks = action.payload;
      })
      .addCase(fetchSearchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // 创建搜索任务
    builder
      .addCase(createSearchTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createSearchTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchTasks.push(action.payload);
      })
      .addCase(createSearchTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // 导出搜索数据
    builder
      .addCase(exportSearchData.fulfilled, (state, action) => {
        // 处理导出数据，可以添加下载逻辑
        console.log('导出数据:', action.payload);
      })
      .addCase(exportSearchData.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // 获取搜索分析
    builder
      .addCase(getSearchAnalysis.fulfilled, (state, action) => {
        // 更新对应任务的分析数据
        const taskIndex = state.searchTasks.findIndex(task => task.id === action.meta.arg);
        if (taskIndex !== -1) {
          state.searchTasks[taskIndex] = {
            ...state.searchTasks[taskIndex],
            analysis: action.payload.analysis
          };
        }
      })
      .addCase(getSearchAnalysis.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = schedulerSlice.actions;
export default schedulerSlice.reducer;
