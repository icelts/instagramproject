import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface Message {
  id: number;
  thread_id: string;
  sender_username: string;
  message_content: string;
  message_type: 'text' | 'image' | 'video' | 'link';
  is_incoming: boolean;
  is_auto_reply: boolean;
  created_at: string;
  instagram_account_id?: number;
}

interface AutoReplyRule {
  id: number;
  rule_name: string;
  keywords: string[];
  reply_message: string;
  is_active: boolean;
  priority: number;
}

interface MonitoringState {
  messages: Message[];
  autoReplyRules: AutoReplyRule[];
  isConnected: boolean;
  isListening: boolean;
  stats: {
    totalMessages: number;
    incomingMessages: number;
    outgoingMessages: number;
    autoReplies: number;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: MonitoringState = {
  messages: [],
  autoReplyRules: [],
  isConnected: false,
  isListening: false,
  stats: {
    totalMessages: 0,
    incomingMessages: 0,
    outgoingMessages: 0,
    autoReplies: 0,
  },
  isLoading: false,
  error: null,
};

// 异步actions
export const fetchMessages = createAsyncThunk(
  'monitoring/fetchMessages',
  async (accountId: number | any, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('未认证');
    }

    try {
      const response = await fetch(`http://localhost:8000/api/v1/instagram/accounts/${accountId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取消息失败');
      }

      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAutoReplyRules = createAsyncThunk(
  'monitoring/fetchAutoReplyRules',
  async (accountId: any = null, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('未认证');
    }

    try {
      const response = await fetch(`http://localhost:8000/api/v1/instagram/accounts/${accountId}/auto-reply-rules`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取自动回复规则失败');
      }

      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createAutoReplyRule = createAsyncThunk(
  'monitoring/createAutoReplyRule',
  async (ruleData: {
    instagram_account_id: number;
    rule_name: string;
    keywords: string[];
    reply_message: string;
    priority?: number;
  }, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('未认证');
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/instagram/auto-reply-rules', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ruleData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '创建自动回复规则失败');
      }

      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'monitoring/sendMessage',
  async (messageData: {
    instagram_account_id: number;
    thread_id: string;
    message_content: string;
  }, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('未认证');
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/instagram/send-message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '发送消息失败');
      }

      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const monitoringSlice = createSlice({
  name: 'monitoring',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload;
    },
    setListeningStatus: (state, action) => {
      state.isListening = action.payload;
    },
    addNewMessage: (state, action) => {
      state.messages.unshift(action.payload);
      // 更新统计
      state.stats.totalMessages += 1;
      if (action.payload.is_incoming) {
        state.stats.incomingMessages += 1;
        if (action.payload.is_auto_reply) {
          state.stats.autoReplies += 1;
        }
      } else {
        state.stats.outgoingMessages += 1;
      }
    },
    updateAutoReplyRule: (state, action) => {
      const index = state.autoReplyRules.findIndex(rule => rule.id === action.payload.id);
      if (index !== -1) {
        state.autoReplyRules[index] = action.payload;
      }
    },
    deleteAutoReplyRule: (state, action) => {
      state.autoReplyRules = state.autoReplyRules.filter(rule => rule.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    // 获取消息
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload;
        // 更新统计
        state.stats.totalMessages = action.payload.length;
        state.stats.incomingMessages = action.payload.filter((msg: Message) => msg.is_incoming).length;
        state.stats.outgoingMessages = action.payload.filter((msg: Message) => !msg.is_incoming).length;
        state.stats.autoReplies = action.payload.filter((msg: Message) => msg.is_auto_reply).length;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // 获取自动回复规则
    builder
      .addCase(fetchAutoReplyRules.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAutoReplyRules.fulfilled, (state, action) => {
        state.isLoading = false;
        state.autoReplyRules = action.payload;
      })
      .addCase(fetchAutoReplyRules.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // 创建自动回复规则
    builder
      .addCase(createAutoReplyRule.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAutoReplyRule.fulfilled, (state, action) => {
        state.isLoading = false;
        state.autoReplyRules.push(action.payload);
      })
      .addCase(createAutoReplyRule.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // 发送消息
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        // 添加新消息到列表
        const newMessage = {
          id: action.payload.id,
          thread_id: action.payload.thread_id,
          sender_username: action.payload.sender_username,
          message_content: action.payload.message_content,
          message_type: action.payload.message_type || 'text',
          is_incoming: false,
          is_auto_reply: false,
          created_at: action.payload.created_at,
        };
        state.messages.unshift(newMessage);
        state.stats.totalMessages += 1;
        state.stats.outgoingMessages += 1;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  setConnectionStatus, 
  setListeningStatus, 
  addNewMessage,
  updateAutoReplyRule,
  deleteAutoReplyRule 
} = monitoringSlice.actions;

export default monitoringSlice.reducer;
