/**
 * 自动回复引擎界面
 * 管理自动回复规则和实时监控
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
  Select,
  Badge,
  Switch,
  Separator,
  ScrollArea,
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
  Bot,
  MessageSquare,
  Settings,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Save,
  RefreshCw,
  TestTube,
  Zap,
  Clock,
  User,
  Hash,
} from 'lucide-react';
import { RootState } from '../store';

interface AutoReplyRule {
  id: string;
  name: string;
  trigger: 'keyword' | 'mention' | 'dm' | 'comment';
  keywords: string[];
  response: string;
  enabled: boolean;
  delay: number;
  priority: number;
  accounts: string[];
  hashtags: string[];
  mentions: string[];
  created_at: string;
  updated_at: string;
  usage_count: number;
  success_rate: number;
}

interface AutoReplyStats {
  total_rules: number;
  active_rules: number;
  total_replies: number;
  success_rate: number;
  avg_response_time: number;
  last_activity: string;
}

export const AutoReplyEngine: React.FC = () => {
  const dispatch = useDispatch();
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [stats, setStats] = useState<AutoReplyStats>({
    total_rules: 0,
    active_rules: 0,
    total_replies: 0,
    success_rate: 0,
    avg_response_time: 0,
    last_activity: '',
  });
  
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('rules');
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 模拟数据
  useEffect(() => {
    const mockRules: AutoReplyRule[] = [
      {
        id: '1',
        name: '欢迎消息',
        trigger: 'dm',
        keywords: ['hello', 'hi', '你好'],
        response: '你好！感谢联系我，我会尽快回复您。',
        enabled: true,
        delay: 5,
        priority: 1,
        accounts: [],
        hashtags: [],
        mentions: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        usage_count: 156,
        success_rate: 98.5,
      },
      {
        id: '2',
        name: '产品咨询回复',
        trigger: 'comment',
        keywords: ['价格', '多少钱', '怎么买'],
        response: '感谢您的咨询！产品价格为XXX，详情请查看主页链接。',
        enabled: true,
        delay: 10,
        priority: 2,
        accounts: [],
        hashtags: [],
        mentions: [],
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        usage_count: 89,
        success_rate: 95.2,
      },
    ];
    
    const mockStats: AutoReplyStats = {
      total_rules: 15,
      active_rules: 12,
      total_replies: 1245,
      success_rate: 96.8,
      avg_response_time: 8.5,
      last_activity: '2024-01-10T15:30:00Z',
    };
    
    setRules(mockRules);
    setStats(mockStats);
  }, []);

  // 获取触发器图标
  const getTriggerIcon = (trigger: string) => {
    const icons: Record<string, React.ReactNode> = {
      dm: <MessageSquare className="h-4 w-4" />,
      comment: <MessageSquare className="h-4 w-4" />,
      mention: <User className="h-4 w-4" />,
      keyword: <Hash className="h-4 w-4" />,
    };
    return icons[trigger] || <Bot className="h-4 w-4" />;
  };

  // 获取触发器名称
  const getTriggerName = (trigger: string) => {
    const names: Record<string, string> = {
      dm: '私信',
      comment: '评论',
      mention: '提及',
      keyword: '关键词',
    };
    return names[trigger] || trigger;
  };

  // 创建/编辑规则
  const handleSaveRule = (rule: AutoReplyRule) => {
    setIsLoading(true);
    setTimeout(() => {
      if (editingRule) {
        // 更新规则
        setRules(prev => prev.map(r => r.id === rule.id ? rule : r));
      } else {
        // 创建新规则
        const newRule = {
          ...rule,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          usage_count: 0,
          success_rate: 0,
        };
        setRules(prev => [...prev, newRule]);
      }
      setIsLoading(false);
      setIsDialogOpen(false);
      setEditingRule(null);
    }, 1000);
  };

  // 删除规则
  const handleDeleteRule = (ruleId: string) => {
    if (confirm('确定要删除这个规则吗？')) {
      setRules(prev => prev.filter(r => r.id !== ruleId));
    }
  };

  // 切换规则状态
  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
  };

  // 测试自动回复
  const handleTestReply = async () => {
    if (!testMessage.trim()) return;
    
    setIsLoading(true);
    setTimeout(() => {
      const mockResult = {
        triggered_rules: ['1', '2'],
        response: '你好！感谢联系我，我会尽快回复您。',
        confidence: 0.95,
        processing_time: 0.5,
      };
      setTestResult(mockResult);
      setIsLoading(false);
    }, 2000);
  };

  // 规则表单组件
  const RuleForm: React.FC<{ rule?: AutoReplyRule; onSave: (rule: AutoReplyRule) => void }> = ({ rule, onSave }) => {
    const [formData, setFormData] = useState<AutoReplyRule>(
      rule || {
        id: '',
        name: '',
        trigger: 'keyword',
        keywords: [],
        response: '',
        enabled: true,
        delay: 0,
        priority: 1,
        accounts: [],
        hashtags: [],
        mentions: [],
        created_at: '',
        updated_at: '',
        usage_count: 0,
        success_rate: 0,
      }
    );

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">规则名称</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="输入规则名称"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="trigger">触发条件</Label>
            <Select
              value={formData.trigger}
              onValueChange={(value) => setFormData(prev => ({ ...prev, trigger: value as any }))}
            >
              <option value="keyword">关键词匹配</option>
              <option value="mention">@提及</option>
              <option value="dm">私信消息</option>
              <option value="comment">评论</option>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="keywords">关键词 (用逗号分隔)</Label>
          <Input
            id="keywords"
            value={formData.keywords.join(', ')}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k) 
            }))}
            placeholder="输入关键词，用逗号分隔"
          />
        </div>

        <div>
          <Label htmlFor="response">回复内容</Label>
          <Textarea
            id="response"
            value={formData.response}
            onChange={(e) => setFormData(prev => ({ ...prev, response: e.target.value }))}
            placeholder="输入自动回复内容"
            rows={4}
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="delay">延迟时间 (秒)</Label>
            <Input
              id="delay"
              type="number"
              min="0"
              value={formData.delay}
              onChange={(e) => setFormData(prev => ({ ...prev, delay: parseInt(e.target.value) }))}
            />
          </div>
          
          <div>
            <Label htmlFor="priority">优先级</Label>
            <Input
              id="priority"
              type="number"
              min="1"
              max="10"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
            />
            <Label htmlFor="enabled">启用规则</Label>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
            取消
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
            保存
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6" />
              <CardTitle>自动回复引擎</CardTitle>
              <Badge variant="secondary">{stats.active_rules}/{stats.total_rules} 活跃</Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingRule(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    新建规则
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingRule ? '编辑规则' : '创建新规则'}
                    </DialogTitle>
                  </DialogHeader>
                  <RuleForm
                    rule={editingRule || undefined}
                    onSave={handleSaveRule}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* 统计卡片 */}
          <div className="grid grid-cols-5 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total_rules}</div>
              <div className="text-sm text-muted-foreground">总规则数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.active_rules}</div>
              <div className="text-sm text-muted-foreground">活跃规则</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.total_replies}</div>
              <div className="text-sm text-muted-foreground">总回复数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.success_rate}%</div>
              <div className="text-sm text-muted-foreground">成功率</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-600">{stats.avg_response_time}s</div>
              <div className="text-sm text-muted-foreground">平均响应时间</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rules">规则管理</TabsTrigger>
              <TabsTrigger value="test">测试工具</TabsTrigger>
              <TabsTrigger value="logs">执行日志</TabsTrigger>
            </TabsList>
            
            <TabsContent value="rules" className="flex-1 p-4">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <Card key={rule.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                              {getTriggerIcon(rule.trigger)}
                              {getTriggerName(rule.trigger)}
                            </Badge>
                            <h3 className="font-medium">{rule.name}</h3>
                            <Badge variant="outline">优先级: {rule.priority}</Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground mb-2">
                            <div>关键词: {rule.keywords.join(', ')}</div>
                            <div>回复: {rule.response.substring(0, 100)}{rule.response.length > 100 ? '...' : ''}</div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>使用次数: {rule.usage_count}</span>
                            <span>成功率: {rule.success_rate}%</span>
                            <span>延迟: {rule.delay}秒</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRule(rule.id)}
                          >
                            {rule.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingRule(rule);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="test" className="flex-1 p-4">
              <div className="space-y-4 max-w-2xl mx-auto">
                <div>
                  <Label htmlFor="testMessage">测试消息</Label>
                  <Textarea
                    id="testMessage"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="输入测试消息，模拟触发自动回复"
                    rows={4}
                  />
                </div>
                
                <Button onClick={handleTestReply} disabled={isLoading || !testMessage.trim()}>
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
                  测试回复
                </Button>
                
                {testResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">测试结果</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div><strong>触发的规则:</strong> {testResult.triggered_rules.join(', ')}</div>
                        <div><strong>回复内容:</strong> {testResult.response}</div>
                        <div><strong>置信度:</strong> {(testResult.confidence * 100).toFixed(1)}%</div>
                        <div><strong>处理时间:</strong> {testResult.processing_time}秒</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="logs" className="flex-1 p-4">
              <div className="text-center text-muted-foreground py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>执行日志功能开发中...</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoReplyEngine;
// @ts-nocheck
