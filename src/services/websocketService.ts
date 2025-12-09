/**
 * WebSocket客户端服务
 * 处理与后端的实时通信
 */

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
  channel?: string;
  status?: string;
  user?: any;
  online_users?: number[];
}

interface WebSocketConfig {
  url: string;
  userId: number;
  token: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
}

type MessageHandler = (message: WebSocketMessage) => void;
type ConnectionHandler = (connected: boolean) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private connectionHandlers: ConnectionHandler[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private isConnecting = false;
  private isConnected = false;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectAttempts: 5,
      reconnectInterval: 3000,
      heartbeatInterval: 30000,
      ...config,
    };
  }

  /**
   * 连接WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected || this.isConnecting) {
        resolve();
        return;
      }

      this.isConnecting = true;
      const wsUrl = `${this.config.url}?token=${this.config.token}`;
      
      try {
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('WebSocket连接已建立');
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.notifyConnectionHandlers(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('解析WebSocket消息失败:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket连接已关闭:', event.code, event.reason);
          this.isConnected = false;
          this.isConnecting = false;
          this.stopHeartbeat();
          this.notifyConnectionHandlers(false);
          
          // 如果不是主动关闭，尝试重连
          if (event.code !== 1000 && this.reconnectAttempts < this.config.reconnectAttempts!) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket连接错误:', error);
          this.isConnecting = false;
          this.notifyConnectionHandlers(false);
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * 断开WebSocket连接
   */
  disconnect(): void {
    if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      
    if (this.ws) {
      this.ws.close(1000, '用户主动断开');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.notifyConnectionHandlers(false);
  }

  /**
   * 发送消息
   */
  send(message: Partial<WebSocketMessage>): void {
    if (this.ws && this.isConnected) {
      const fullMessage: WebSocketMessage = {
        type: message.type || '',
        timestamp: new Date().toISOString(),
        ...message,
      };
      
      this.ws.send(JSON.stringify(fullMessage));
    } else {
      console.warn('WebSocket未连接，无法发送消息');
    }
  }

  /**
   * 发送心跳
   */
  private sendHeartbeat(): void {
    this.send({ type: 'ping' });
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`安排第${this.reconnectAttempts}次重连...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(error => {
        console.error('重连失败:', error);
      });
    }, this.config.reconnectInterval);
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: WebSocketMessage): void {
    console.log('收到WebSocket消息:', message);
    
    // 处理心跳响应
    if (message.type === 'pong') {
      return;
    }
    
    // 调用注册的消息处理器
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('消息处理器执行失败:', error);
        }
      });
    }
  }

  /**
   * 通知连接状态处理器
   */
  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('连接状态处理器执行失败:', error);
      }
    });
  }

  /**
   * 注册消息处理器
   */
  onMessage(type: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  /**
   * 移除消息处理器
   */
  offMessage(type: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
      if (handlers.length === 0) {
        this.messageHandlers.delete(type);
      }
    }
  }

  /**
   * 注册连接状态处理器
   */
  onConnection(handler: ConnectionHandler): void {
    this.connectionHandlers.push(handler);
  }

  /**
   * 移除连接状态处理器
   */
  offConnection(handler: ConnectionHandler): void {
    const index = this.connectionHandlers.indexOf(handler);
    if (index > -1) {
      this.connectionHandlers.splice(index, 1);
    }
  }

  /**
   * 订阅频道
   */
  subscribe(channel: string): void {
    this.send({
      type: 'subscribe',
      channel,
    });
  }

  /**
   * 取消订阅频道
   */
  unsubscribe(channel: string): void {
    this.send({
      type: 'unsubscribe',
      channel,
    });
  }

  /**
   * 获取连接状态
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * 获取连接状态（连接中）
   */
  get connecting(): boolean {
    return this.isConnecting;
  }
}

// 创建全局WebSocket服务实例
let websocketService: WebSocketService | null = null;

/**
 * 初始化WebSocket服务
 */
export const initializeWebSocket = (config: WebSocketConfig): WebSocketService => {
  if (websocketService) {
    websocketService.disconnect();
  }
  
  websocketService = new WebSocketService(config);
  return websocketService;
};

/**
 * 获取WebSocket服务实例
 */
export const getWebSocketService = (): WebSocketService | null => {
  return websocketService;
};

/**
 * 断开WebSocket连接
 */
export const disconnectWebSocket = (): void => {
  if (websocketService) {
    websocketService.disconnect();
    websocketService = null;
  }
};

export default WebSocketService;
