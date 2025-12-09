/**
 * 批量操作界面
 * 提供批量处理Instagram账号、内容、消息等功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Checkbox,
  Badge,
  Progress,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Alert,
  AlertDescription,
} from '@/components/ui';
import {
  Layers,
  Users,
  MessageSquare,
  Image,
  Calendar,
  Upload,
  Download,
  Play,
  Pause,
  Square,
  Check,
  X,
  AlertCircle,
  Settings,
  FileText,
  Trash2,
  Copy,
  Move,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface BatchTask {
  id: string;
  type: 'account' | 'content' | 'message' | 'data';
  operation: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  total: number;
  processed: number;
  success: number;
  failed: number;
  start_time: string;
  end_time?: string;
  created_by: string;
  description: string;
  parameters: any;
  result?: any;
}

interface BatchOperationProps {
  className?: string;
}

export const BatchOperations: React.FC<BatchOperationProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState<BatchTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<BatchTask | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 新建任务表单
  const [newTask, setNewTask] = useState({
    type: 'account' as 'account' | 'content' | 'message' | 'data',
    operation: '',
    description: '',
    parameters: {},
  });

  // 模拟数据
  useEffect(() => {
    const mockTasks: BatchTask[] = [
      {
        id: '1',
        type: 'account',
        operation: 'batch_login',
        status: 'completed',
        progress: 100,
        total: 50,
        processed: 50,
        success: 48,
        failed: 2,
        start_time: '2024-01-10T10:00:00Z',
        end_time: '2024-01-10T10:15:00Z',
        created_by: 'admin',
        description: '批量登录Instagram账号',
        parameters: { accounts: ['account1', 'account2'], proxy_enabled: true },
      },
      {
        id: '2',
        type: 'content',
        operation: 'batch_post',
        status: 'running',
        progress: 65,
        total: 100,
        processed: 65,
        success: 63,
        failed: 2,
        start_time: '2024-01-10T11:00:00Z',
        created_by: 'user1',
        description: '批量发布内容到多个账号',
        parameters: { accounts: ['account1'], content_type: 'image', schedule: true },
      },
      {
        id: '3',
        type: 'message',
        operation: 'batch_send',
        status: 'pending',
        progress: 0,
        total: 200,
        processed: 0,
        success: 0,
        failed: 0,
        start_time: '2024-01-10T12:00:00Z',
        created_by: 'user2',
        description: '批量发送私信消息',
        parameters: { message_template: 'hello', target_users: [] },
      },
    ];
    
    setTasks(mockTasks);
  }, []);

  // 获取操作类型的中文名称
  const getOperationName = (operation: string): string => {
    const nameMap: Record<string, string> = {
      batch_login: '批量登录',
      batch_post: '批量发布',
      batch_send: '批量发送',
      batch_follow: '批量关注',
      batch_unfollow: '批量取消关注',
      batch_like: '批量点赞',
      batch_comment: '批量评论',
      batch_export: '批量导出',
      batch_import: '批量导入',
      batch_delete: '批量删除',
      data_backup: '数据备份',
      data_restore: '数据恢复',
    };
    return nameMap[operation] || operation;
  };

  // 获取状态的颜色
  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      pending: 'bg-yellow-500',
      running: 'bg-blue-500',
      completed: 'bg-green-500',
      failed: 'bg-red-500',
      cancelled: 'bg-gray-500',
    };
    return colorMap[status] || 'bg-gray-400';
  };

  // 获取状态的中文名称
  const getStatusName = (status: string): string => {
    const nameMap: Record<string, string> = {
      pending: '等待中',
      running: '运行中',
      completed: '已完成',
      failed: '失败',
      cancelled: '已取消',
    };
    return nameMap[status] || status;
  };

  // 创建新任务
  const handleCreateTask = async () => {
    if (!newTask.operation || !newTask.description) {
      alert('请填写完整的任务信息');
      return;
    }

    setIsLoading(true);
    
    // 模拟创建任务
    setTimeout(() => {
      const task: BatchTask = {
        id: Date.now().toString(),
        type: newTask.type,
        operation: newTask.operation,
        status: 'pending',
        progress: 0,
        total: 0,
        processed: 0,
        success: 0,
        failed: 0,
        start_time: new Date().toISOString(),
        created_by: 'current_user',
        description: newTask.description,
        parameters: newTask.parameters,
      };
      
      setTasks(prev => [task, ...prev]);
      setIsLoading(false);
      setIsCreateDialogOpen(false);
      setNewTask({
        type: 'account',
        operation: '',
        description: '',
        parameters: {},
      });
    }, 1000);
  };

  // 取消任务
  const handleCancelTask = (taskId: string) => {
    if (confirm('确定要取消这个任务吗？')) {
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'cancelled', end_time: new Date().toISOString() }
          : task
      ));
    }
  };

  // 重试任务
  const handleRetryTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: 'pending', 
            progress: 0, 
            processed: 0, 
            success: 0, 
            failed: 0,
            start_time: new Date().toISOString(),
            end_time: undefined 
          }
        : task
    ));
  };

  // 删除任务
  const handleDeleteTask = (taskId: string) => {
    if (confirm('确定要删除这个任务记录吗？')) {
      setTasks(prev => prev.filter(task => task.id !== taskId));
    }
  };

  // 模拟任务进度更新
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => prev.map(task => {
        if (task.status === 'running' && task.progress < 100) {
          const newProgress = Math.min(task.progress + Math.random() * 10, 100);
          const newProcessed = Math.floor((newProgress / 100) * task.total);
          const newSuccess = Math.floor(newProcessed * 0.95);
          const newFailed = newProcessed - newSuccess;
          
          const updatedTask = {
            ...task,
            progress: newProgress,
            processed: newProcessed,
            success: newSuccess,
            failed: newFailed,
          };
          
          if (newProgress >= 100) {
            updatedTask.status = 'completed';
            updatedTask.end_time = new Date().toISOString();
          }
          
          return updatedTask;
        }
        return task;
      }));
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="h-6 w-6" />
              <CardTitle className="text-xl">批量操作</CardTitle>
              <Badge variant="secondary">{tasks.length}</Badge>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Layers className="h-4 w-4 mr-2" />
                  新建任务
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>创建批量任务</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="taskType">任务类型</Label>
                      <Select
                        value={newTask.type}
                        onValueChange={(value: any) => setNewTask(prev => ({ ...prev, type: value }))}
                      >
                        <option value="account">账号操作</option>
                        <option value="content">内容操作</option>
                        <option value="message">消息操作</option>
                        <option value="data">数据操作</option>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="operation">操作类型</Label>
                      <Select
                        value={newTask.operation}
                        onValueChange={(value) => setNewTask(prev => ({ ...prev, operation: value }))}
                      >
                        {newTask.type === 'account' && (
                          <>
                            <option value="">选择操作</option>
                            <option value="batch_login">批量登录</option>
                            <option value="batch_follow">批量关注</option>
                            <option value="batch_unfollow">批量取消关注</option>
                          </>
                        )}
                        {newTask.type === 'content' && (
                          <>
                            <option value="">选择操作</option>
                            <option value="batch_post">批量发布</option>
                            <option value="batch_like">批量点赞</option>
                            <option value="batch_comment">批量评论</option>
                            <option value="batch_delete">批量删除</option>
                          </>
                        )}
                        {newTask.type === 'message' && (
                          <>
                            <option value="">选择操作</option>
                            <option value="batch_send">批量发送</option>
                          </>
                        )}
                        {newTask.type === 'data' && (
                          <>
                            <option value="">选择操作</option>
                            <option value="batch_export">批量导出</option>
                            <option value="batch_import">批量导入</option>
                            <option value="data_backup">数据备份</option>
                            <option value="data_restore">数据恢复</option>
                          </>
                        )}
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">任务描述</Label>
                    <Textarea
                      id="description"
                      value={newTask.description}
                      onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="输入任务描述..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleCreateTask} disabled={isLoading}>
                      {isLoading ? '创建中...' : '创建任务'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tasks">任务列表</TabsTrigger>
              <TabsTrigger value="templates">任务模板</TabsTrigger>
              <TabsTrigger value="history">历史记录</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks" className="flex-1 p-4">
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">暂无批量任务</p>
                    <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                      创建第一个任务
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {tasks.map((task) => (
                      <Card key={task.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`} />
                            <div>
                              <h3 className="font-medium">{getOperationName(task.operation)}</h3>
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{getStatusName(task.status)}</Badge>
                            <Badge variant="secondary">{task.type}</Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>进度: {task.processed}/{task.total}</span>
                            <span>{task.progress.toFixed(1)}%</span>
                          </div>
                          
                          <Progress value={task.progress} className="h-2" />
                          
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">成功:</span>
                              <span className="ml-1 text-green-600">{task.success}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">失败:</span>
                              <span className="ml-1 text-red-600">{task.failed}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">创建者:</span>
                              <span className="ml-1">{task.created_by}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">开始时间:</span>
                              <span className="ml-1">
                                {format(new Date(task.start_time), 'HH:mm:ss')}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-3">
                          {task.status === 'running' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelTask(task.id)}
                            >
                              <Square className="h-4 w-4 mr-1" />
                              取消
                            </Button>
                          )}
                          
                          {task.status === 'failed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetryTask(task.id)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              重试
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTask(task)}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            详情
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="templates" className="flex-1 p-4">
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    任务模板功能开发中，您可以通过模板快速创建常用的批量操作任务。
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: '批量登录模板', icon: Users, desc: '快速批量登录多个账号' },
                    { name: '内容发布模板', icon: Image, desc: '定时批量发布内容' },
                    { name: '消息发送模板', icon: MessageSquare, desc: '批量发送私信消息' },
                    { name: '数据导出模板', icon: Download, desc: '定期导出业务数据' },
                  ].map((template, index) => (
                    <Card key={index} className="p-4 cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center space-x-3 mb-2">
                        <template.icon className="h-6 w-6 text-primary" />
                        <h3 className="font-medium">{template.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{template.desc}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="flex-1 p-4">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">历史记录功能开发中...</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BatchOperations;
// @ts-nocheck
