/**
 * 实时消息显示组件
 * 显示WebSocket接收到的实时消息
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  ScrollArea,
  Separator,
  Button,
  Switch,
} from './ui';
import {
  MessageSquare,
  Settings,
  Trash2,
  Bell,
  BellOff,
  RefreshCw,
} from 'lucide-react';
import { RootState } from '../store';
import {
  selectMessages,
  selectIsConnected,
  clearMessages,
  addMessage,
} from '../store/slices/websocketSlice';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface MessageItem {
  id: string;
  type: string;
  data?: any;
  timestamp: string;
  status?: string;
  user?: any;
}

interface RealTimeMessagesProps {
  className?: string;
  maxMessages?: number;
  showTimestamp?: boolean;
  showType?: boolean;
  autoScroll?: boolean;
}

export const RealTimeMessages: React.FC<RealTimeMessagesProps> = ({
  className = '',
  maxMessages = 50,
  showTimestamp = true,
  showType = true,
  autoScroll = true,
}) => {
  const dispatch = useDispatch();
  const messages = useSelector(selectMessages);
  const isConnected = useSelector(selectIsConnected);
  
  const [autoScrollEnabled, setAutoScrollEnabled] = React.useState(autoScroll);
  const [showNotifications, setShowNotifications] = React.useState(true);
  const [expandedTypes, setExpandedTypes] = React.useState<Set<string>>(
    new Set(['new_message', 'auto_reply', 'task_update', 'account_update'])
  );

  // 消息类型颜色映射
  const getTypeColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      new_message: 'bg-blue-500',
      auto_reply: 'bg-green-500',
      task_update: 'bg-orange-500',
      account_update: 'bg-purple-500',
      welcome: 'bg-indigo-500',
      connection: 'bg-gray-500',
      error: 'bg-red-500',
    };
    return colorMap[type] || 'bg-gray-400';
  };

  // 消息类型显示名称
  const getTypeDisplayName = (type: string): string => {
    const nameMap: Record<string, string> = {
      new_message: '新消息',
      auto_reply: '自动回复',
      task_update: '任务更新',
      account_update: '账号更新',
      welcome: '欢迎消息',
      connection: '连接状态',
      error: '错误',
    };
    return nameMap[type] || type;
  };

  // 清空消息
  const handleClearMessages = () => {
    dispatch(clearMessages());
  };

  // 切换消息类型展开状态
  const toggleTypeExpansion = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  // 获取消息类型统计
  const getTypeStats = () => {
    const stats: Record<string, number> = {};
    messages.forEach((msg) => {
      stats[msg.type] = (stats[msg.type] || 0) + 1;
    });
    return stats;
  };

  // 浏览器通知
  const showNotification = (message: MessageItem) => {
    if (!showNotifications || document.hidden) return;

    const notification = new Notification(`Instagram自动化平台 - ${getTypeDisplayName(message.type)}`, {
      body: JSON.stringify(message.data, null, 2).substring(0, 200),
      icon: '/favicon.ico',
      tag: 'instagram-realtime',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    setTimeout(() => notification.close(), 5000);
  };

  // 请求通知权限
  useEffect(() => {
    if (showNotifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [showNotifications]);

  // 处理新消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message: MessageItem = JSON.parse(event.data);
        dispatch(addMessage(message));
        showNotification(message);
      } catch (error) {
        console.error('解析WebSocket消息失败:', error);
      }
    };

    // 这里可以监听WebSocket消息事件
    // 实际实现中需要与WebSocket服务集成

    return () => {
      // 清理事件监听器
    };
  }, [dispatch, showNotifications]);

  // 自动滚动到底部
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (autoScrollEnabled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScrollEnabled]);

  const typeStats = getTypeStats();
  const displayedMessages = messages.slice(0, maxMessages);

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle className="text-lg">实时消息</CardTitle>
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? '已连接' : '未连接'}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearMessages}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="h-8 w-8 p-0"
            >
              {showNotifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </Button>
            
            <div className="flex items-center space-x-1">
              <label className="text-sm">自动滚动</label>
              <Switch
                checked={autoScrollEnabled}
                onCheckedChange={setAutoScrollEnabled}
                size="sm"
              />
            </div>
          </div>
        </div>
        
        {/* 消息类型统计 */}
        <div className="flex flex-wrap gap-1 mt-2">
          {Object.entries(typeStats).map(([type, count]) => (
            <Badge
              key={type}
              variant="outline"
              className={`cursor-pointer text-xs ${
                expandedTypes.has(type) ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => toggleTypeExpansion(type)}
            >
              <div className={`w-2 h-2 rounded-full ${getTypeColor(type)} mr-1`} />
              {getTypeDisplayName(type)} ({count})
            </Badge>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {displayedMessages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无实时消息</p>
                <p className="text-sm">WebSocket连接后将显示实时消息</p>
              </div>
            ) : (
              displayedMessages.map((message, index) => {
                if (!expandedTypes.has(message.type)) return null;
                
                return (
                  <div
                    key={`${message.type}-${message.timestamp}-${index}`}
                    className="relative border rounded-lg p-3 bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="secondary"
                          className={`${getTypeColor(message.type)} text-white`}
                        >
                          {getTypeDisplayName(message.type)}
                        </Badge>
                        {showTimestamp && message.timestamp && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(message.timestamp), {
                              addSuffix: true,
                              locale: zhCN,
                            })}
                          </span>
                        )}
                      </div>
                      
                      {message.status && (
                        <Badge variant="outline" className="text-xs">
                          {message.status}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {message.user && (
                        <div className="text-xs text-muted-foreground">
                          用户: {message.user.username} (ID: {message.user.id})
                        </div>
                      )}
                      
                      {message.data && (
                        <div className="bg-background rounded p-2">
                          <pre className="text-xs whitespace-pre-wrap break-all">
                            {JSON.stringify(message.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RealTimeMessages;
// @ts-nocheck
