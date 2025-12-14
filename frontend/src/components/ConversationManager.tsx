/**
 * 会话管理界面
 * 管理Instagram私信和评论会话
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Textarea,
  Badge,
  ScrollArea,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Separator,
  Select,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './ui';
import {
  MessageSquare,
  Users,
  Send,
  Search,
  Filter,
  MoreVertical,
  Reply,
  Forward,
  Star,
  Archive,
  Trash2,
  User,
  Clock,
  Check,
  CheckCheck,
  Image,
  Paperclip,
} from 'lucide-react';
import { RootState } from '../store';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_username: string;
  sender_avatar?: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'file';
  timestamp: string;
  read: boolean;
  delivered: boolean;
  is_from_me: boolean;
  media_url?: string;
  reply_to?: string;
}

interface Conversation {
  id: string;
  participant_id: string;
  participant_name: string;
  participant_username: string;
  participant_avatar?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_archived: boolean;
  is_starred: boolean;
  type: 'dm' | 'comment';
  account_name: string;
  status: 'active' | 'pending' | 'blocked';
}

export const ConversationManager: React.FC = () => {
  const dispatch = useDispatch();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // 模拟数据
  useEffect(() => {
    const mockConversations: Conversation[] = [
      {
        id: '1',
        participant_id: 'user1',
        participant_name: '张三',
        participant_username: 'zhangsan',
        participant_avatar: '',
        last_message: '你好，我想了解一下产品信息',
        last_message_time: '2024-01-10T15:30:00Z',
        unread_count: 2,
        is_archived: false,
        is_starred: true,
        type: 'dm',
        account_name: 'my_instagram',
        status: 'active',
      },
      {
        id: '2',
        participant_id: 'user2',
        participant_name: '李四',
        participant_username: 'lisi',
        participant_avatar: '',
        last_message: '这个价格有点贵，能便宜点吗？',
        last_message_time: '2024-01-10T14:20:00Z',
        unread_count: 0,
        is_archived: false,
        is_starred: false,
        type: 'dm',
        account_name: 'my_instagram',
        status: 'active',
      },
      {
        id: '3',
        participant_id: 'user3',
        participant_name: '王五',
        participant_username: 'wangwu',
        participant_avatar: '',
        last_message: '什么时候能发货？',
        last_message_time: '2024-01-10T13:15:00Z',
        unread_count: 1,
        is_archived: false,
        is_starred: false,
        type: 'comment',
        account_name: 'my_instagram',
        status: 'pending',
      },
    ];
    
    setConversations(mockConversations);
  }, []);

  // 加载会话消息
  useEffect(() => {
    if (selectedConversation) {
      setIsLoading(true);
      // 模拟加载消息
      setTimeout(() => {
        const mockMessages: Message[] = [
          {
            id: '1',
            conversation_id: selectedConversation.id,
            sender_id: selectedConversation.participant_id,
            sender_name: selectedConversation.participant_name,
            sender_username: selectedConversation.participant_username,
            content: '你好，我想了解一下产品信息',
            type: 'text',
            timestamp: '2024-01-10T15:30:00Z',
            read: true,
            delivered: true,
            is_from_me: false,
          },
          {
            id: '2',
            conversation_id: selectedConversation.id,
            sender_id: 'me',
            sender_name: '我',
            sender_username: 'me',
            content: '你好！感谢咨询，请问您想了解哪款产品？',
            type: 'text',
            timestamp: '2024-01-10T15:32:00Z',
            read: true,
            delivered: true,
            is_from_me: true,
          },
          {
            id: '3',
            conversation_id: selectedConversation.id,
            sender_id: selectedConversation.participant_id,
            sender_name: selectedConversation.participant_name,
            sender_username: selectedConversation.participant_username,
            content: '你们的新款产品有什么特点？',
            type: 'text',
            timestamp: '2024-01-10T15:35:00Z',
            read: true,
            delivered: true,
            is_from_me: false,
          },
        ];
        setMessages(mockMessages);
        setIsLoading(false);
      }, 1000);
    }
  }, [selectedConversation]);

  // 过滤会话
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.participant_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.last_message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' ||
                      (activeTab === 'unread' && conv.unread_count > 0) ||
                      (activeTab === 'starred' && conv.is_starred) ||
                      (activeTab === 'archived' && conv.is_archived);
    
    return matchesSearch && matchesTab;
  });

  // 发送消息
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      conversation_id: selectedConversation.id,
      sender_id: 'me',
      sender_name: '我',
      sender_username: 'me',
      content: messageInput,
      type: 'text',
      timestamp: new Date().toISOString(),
      read: false,
      delivered: false,
      is_from_me: true,
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');
    
    // 模拟发送延迟
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, delivered: true }
          : msg
      ));
    }, 1000);
  };

  // 切换会话星标
  const toggleStar = (conversationId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, is_starred: !conv.is_starred }
        : conv
    ));
  };

  // 归档会话
  const archiveConversation = (conversationId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, is_archived: true }
        : conv
    ));
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
    }
  };

  // 删除会话
  const deleteConversation = (conversationId: string) => {
    if (confirm('确定要删除这个会话吗？')) {
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }
    }
  };

  // 标记为已读
  const markAsRead = (conversationId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, unread_count: 0 }
        : conv
    ));
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex">
        <div className="w-80 border-r flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-lg">会话列表</CardTitle>
              <Badge variant="secondary">{filteredConversations.length}</Badge>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索会话..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="unread">未读</TabsTrigger>
                <TabsTrigger value="starred">星标</TabsTrigger>
                <TabsTrigger value="archived">归档</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      markAsRead(conversation.id);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversation.participant_avatar} />
                        <AvatarFallback>
                          {conversation.participant_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-1">
                            <h3 className="font-medium truncate">
                              {conversation.participant_name}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              @{conversation.participant_username}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {conversation.is_starred && (
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(conversation.last_message_time), {
                                addSuffix: true,
                                locale: zhCN,
                              })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.last_message}
                          </p>
                          
                          {conversation.unread_count > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {conversation.type === 'dm' ? '私信' : '评论'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {conversation.account_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </div>
        
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.participant_avatar} />
                      <AvatarFallback>
                        {selectedConversation.participant_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-medium">{selectedConversation.participant_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        @{selectedConversation.participant_username} • {selectedConversation.account_name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStar(selectedConversation.id)}
                    >
                      <Star className={`h-4 w-4 ${selectedConversation.is_starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => archiveConversation(selectedConversation.id)}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteConversation(selectedConversation.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 p-0 flex flex-col">
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.is_from_me ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.is_from_me
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            {!message.is_from_me && (
                              <span className="text-xs font-medium">
                                {message.sender_name}
                              </span>
                            )}
                            
                            <div className="flex items-center space-x-1">
                              {message.read ? (
                                <CheckCheck className="h-3 w-3 text-blue-500" />
                              ) : message.delivered ? (
                                <Check className="h-3 w-3 text-gray-500" />
                              ) : null}
                              
                              <span className="text-xs opacity-70">
                                {formatDistanceToNow(new Date(message.timestamp), {
                                  addSuffix: true,
                                  locale: zhCN,
                                })}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm">{message.content}</p>
                          
                          {message.media_url && (
                            <div className="mt-2">
                              {message.type === 'image' ? (
                                <img
                                  src={message.media_url}
                                  alt="媒体内容"
                                  className="rounded max-w-full h-auto"
                                />
                              ) : (
                                <div className="flex items-center space-x-2 text-sm">
                                  <Paperclip className="h-4 w-4" />
                                  <span>附件</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-center">
                        <div className="animate-pulse text-muted-foreground">
                          加载中...
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                <div className="border-t p-4">
                  <div className="flex items-end space-x-2">
                    <Textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="输入消息..."
                      className="flex-1 min-h-[40px] max-h-32 resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    
                    <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>选择一个会话开始聊天</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ConversationManager;
// @ts-nocheck
