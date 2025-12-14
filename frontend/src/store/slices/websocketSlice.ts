/**
 * WebSocket状态管理
 * 处理实时通信相关状态
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { getWebSocketService, initializeWebSocket, disconnectWebSocket } from '../../services/websocketService';

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  onlineUsers: number[];
  messages: any[];
  error: string | null;
  reconnectAttempts: number;
  lastMessage: any;
}

const initialState: WebSocketState = {
  isConnected: false,
  isConnecting: false,
  onlineUsers: [],
  messages: [],
  error: null,
  reconnectAttempts: 0,
  lastMessage: null,
};

const apiBase = process.env.REACT_APP_API_BASE_URL;
const defaultWsBase = apiBase ? apiBase.replace(/^http/, 'ws') : 'ws://localhost:8800';
const WS_BASE = process.env.REACT_APP_WS_BASE_URL || defaultWsBase;

// 异步thunk：连接WebSocket
export const connectWebSocket = createAsyncThunk(
  'websocket/connect',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const token = localStorage.getItem('token');
    const user = state.auth.user;
    
    if (!token || !user) {
      throw new Error('用户未登录');
    }
    
    const wsUrl = `${WS_BASE}/api/v1/ws/ws/${user.id}`;
    
    const wsService = initializeWebSocket({
      url: wsUrl,
      userId: user.id,
      token,
    });
    
    // 注册消息处理器
    wsService.onMessage('welcome', (message) => {
      console.log('收到欢迎消息:', message);
    });
    
    wsService.onMessage('new_message', (message) => {
      console.log('收到新消息:', message.data);
    });
    
    wsService.onMessage('auto_reply', (message) => {
      console.log('收到自动回复通知:', message.data);
    });
    
    wsService.onMessage('task_update', (message) => {
      console.log('收到任务更新:', message.data);
    });
    
    wsService.onMessage('account_update', (message) => {
      console.log('收到账号更新:', message.data);
    });
    
    // 注册连接状态处理器
    wsService.onConnection((connected) => {
      console.log('WebSocket连接状态:', connected);
    });
    
    // 连接WebSocket
    await wsService.connect();
    
    return wsService;
  }
);

// 异步thunk：断开WebSocket连接
export const disconnectWebSocketAction = createAsyncThunk(
  'websocket/disconnect',
  async () => {
    disconnectWebSocket();
  }
);

// 异步thunk：发送消息
export const sendMessage = createAsyncThunk(
  'websocket/sendMessage',
  async (message: any, { getState }) => {
    const wsService = getWebSocketService();
    if (!wsService) {
      throw new Error('WebSocket未连接');
    }
    
    wsService.send(message);
    return message;
  }
);

// 异步thunk：订阅频道
export const subscribeChannel = createAsyncThunk(
  'websocket/subscribe',
  async (channel: string, { getState }) => {
    const wsService = getWebSocketService();
    if (!wsService) {
      throw new Error('WebSocket未连接');
    }
    
    wsService.subscribe(channel);
    return channel;
  }
);

// 异步thunk：取消订阅频道
export const unsubscribeChannel = createAsyncThunk(
  'websocket/unsubscribe',
  async (channel: string, { getState }) => {
    const wsService = getWebSocketService();
    if (!wsService) {
      throw new Error('WebSocket未连接');
    }
    
    wsService.unsubscribe(channel);
    return channel;
  }
);

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    setConnecting: (state, action: PayloadAction<boolean>) => {
      state.isConnecting = action.payload;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      if (action.payload) {
        state.error = null;
        state.reconnectAttempts = 0;
      }
    },
    setOnlineUsers: (state, action: PayloadAction<number[]>) => {
      state.onlineUsers = action.payload;
    },
    addMessage: (state, action: PayloadAction<any>) => {
      state.messages.unshift(action.payload);
      // 保持最近100条消息
      if (state.messages.length > 100) {
        state.messages = state.messages.slice(0, 100);
      }
      state.lastMessage = action.payload;
    },
    setMessages: (state, action: PayloadAction<any[]>) => {
      state.messages = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
      state.lastMessage = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isConnecting = false;
      state.isConnected = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    incrementReconnectAttempts: (state) => {
      state.reconnectAttempts += 1;
    },
    resetReconnectAttempts: (state) => {
      state.reconnectAttempts = 0;
    },
    updateLastMessage: (state, action: PayloadAction<any>) => {
      state.lastMessage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // 连接WebSocket
      .addCase(connectWebSocket.pending, (state) => {
        state.isConnecting = true;
        state.error = null;
      })
      .addCase(connectWebSocket.fulfilled, (state) => {
        state.isConnecting = false;
        state.isConnected = true;
        state.error = null;
      })
      .addCase(connectWebSocket.rejected, (state, action) => {
        state.isConnecting = false;
        state.isConnected = false;
        state.error = action.error.message || '连接失败';
      })
      
      // 断开WebSocket连接
      .addCase(disconnectWebSocketAction.fulfilled, (state) => {
        state.isConnected = false;
        state.isConnecting = false;
        state.onlineUsers = [];
      })
      
      // 发送消息
      .addCase(sendMessage.fulfilled, (state, action) => {
        // 可以在这里添加消息到历史记录
        console.log('消息发送成功:', action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.error.message || '发送消息失败';
      });
  },
});

export const {
  setConnecting,
  setConnected,
  setOnlineUsers,
  addMessage,
  setMessages,
  clearMessages,
  setError,
  clearError,
  incrementReconnectAttempts,
  resetReconnectAttempts,
  updateLastMessage,
} = websocketSlice.actions;

// 选择器
export const selectWebSocket = (state: { websocket: WebSocketState }) => state.websocket;
export const selectIsConnected = (state: { websocket: WebSocketState }) => state.websocket.isConnected;
export const selectIsConnecting = (state: { websocket: WebSocketState }) => state.websocket.isConnecting;
export const selectOnlineUsers = (state: { websocket: WebSocketState }) => state.websocket.onlineUsers;
export const selectMessages = (state: { websocket: WebSocketState }) => state.websocket.messages;
export const selectLastMessage = (state: { websocket: WebSocketState }) => state.websocket.lastMessage;
export const selectWebSocketError = (state: { websocket: WebSocketState }) => state.websocket.error;

export default websocketSlice.reducer;
