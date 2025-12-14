/**
 * 系统设置和配置界面
 * 提供系统参数配置、用户偏好设置等功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  Checkbox,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Label,
  Switch,
  Slider,
  Alert,
  AlertDescription,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui';
import {
  Settings,
  User,
  Shield,
  Bell,
  Database,
  Globe,
  Mail,
  Smartphone,
  Monitor,
  Key,
  Save,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Plus,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    defaultLanguage: string;
    timezone: string;
    dateFormat: string;
    theme: 'light' | 'dark' | 'auto';
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireTwoFactor: boolean;
    allowedIPs: string[];
    apiRateLimit: number;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    desktopNotifications: boolean;
    notificationFrequency: 'immediate' | 'hourly' | 'daily';
  };
  performance: {
    cacheEnabled: boolean;
    cacheTimeout: number;
    maxConcurrentTasks: number;
    logLevel: 'debug' | 'info' | 'warning' | 'error';
    dataRetentionDays: number;
  };
  instagram: {
    defaultProxy: boolean;
    maxAccounts: number;
    apiTimeout: number;
    retryAttempts: number;
    defaultDelayRange: {
      min: number;
      max: number;
    };
  };
}

interface SettingsPanelProps {
  className?: string;
  onSave?: (settings: SystemSettings) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  className = '',
  onSave 
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: 'Instagram自动化平台',
      siteDescription: '专业的Instagram自动化营销工具',
      defaultLanguage: 'zh-CN',
      timezone: 'Asia/Shanghai',
      dateFormat: 'yyyy-MM-dd',
      theme: 'auto',
    },
    security: {
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireTwoFactor: false,
      allowedIPs: [],
      apiRateLimit: 1000,
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      desktopNotifications: true,
      notificationFrequency: 'immediate',
    },
    performance: {
      cacheEnabled: true,
      cacheTimeout: 3600,
      maxConcurrentTasks: 10,
      logLevel: 'info',
      dataRetentionDays: 90,
    },
    instagram: {
      defaultProxy: true,
      maxAccounts: 50,
      apiTimeout: 30,
      retryAttempts: 3,
      defaultDelayRange: {
        min: 2,
        max: 8,
      },
    },
  });

  const [originalSettings, setOriginalSettings] = useState<SystemSettings>(settings);

  // 检查是否有更改
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  // 保存设置
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      setSaveMessage({ type: 'success', message: '设置保存成功' });
      onSave?.(settings);
      
      // 3秒后清除消息
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ type: 'error', message: '设置保存失败，请重试' });
    } finally {
      setIsSaving(false);
    }
  };

  // 重置设置
  const handleReset = () => {
    if (confirm('确定要重置所有设置到默认值吗？')) {
      const defaultSettings: SystemSettings = {
        general: {
          siteName: 'Instagram自动化平台',
          siteDescription: '专业的Instagram自动化营销工具',
          defaultLanguage: 'zh-CN',
          timezone: 'Asia/Shanghai',
          dateFormat: 'yyyy-MM-dd',
          theme: 'auto',
        },
        security: {
          sessionTimeout: 24,
          maxLoginAttempts: 5,
          passwordMinLength: 8,
          requireTwoFactor: false,
          allowedIPs: [],
          apiRateLimit: 1000,
        },
        notifications: {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          desktopNotifications: true,
          notificationFrequency: 'immediate',
        },
        performance: {
          cacheEnabled: true,
          cacheTimeout: 3600,
          maxConcurrentTasks: 10,
          logLevel: 'info',
          dataRetentionDays: 90,
        },
        instagram: {
          defaultProxy: true,
          maxAccounts: 50,
          apiTimeout: 30,
          retryAttempts: 3,
          defaultDelayRange: {
            min: 2,
            max: 8,
          },
        },
      };
      
      setSettings(defaultSettings);
      setSaveMessage({ type: 'success', message: '设置已重置为默认值' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  // 导出设置
  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `instagram-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // 导入设置
  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings(importedSettings);
        setSaveMessage({ type: 'success', message: '设置导入成功' });
        setTimeout(() => setSaveMessage(null), 3000);
      } catch (error) {
        setSaveMessage({ type: 'error', message: '设置文件格式错误' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  // 更新设置
  const updateSetting = (category: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="h-6 w-6" />
              <CardTitle className="text-xl">系统设置</CardTitle>
              {hasChanges && <Badge variant="secondary">有未保存的更改</Badge>}
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={importSettings}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  导入设置
                </Button>
              </div>
              
              <Button variant="outline" onClick={exportSettings}>
                <Download className="h-4 w-4 mr-2" />
                导出设置
              </Button>
              
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                重置
              </Button>
              
              <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                {isSaving ? '保存中...' : '保存设置'}
              </Button>
            </div>
          </div>
          
          {saveMessage && (
            <Alert className={`mt-4 ${
              saveMessage.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
            }`}>
              {saveMessage.type === 'success' ? (
                <Check className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription>{saveMessage.message}</AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">常规设置</TabsTrigger>
              <TabsTrigger value="security">安全设置</TabsTrigger>
              <TabsTrigger value="notifications">通知设置</TabsTrigger>
              <TabsTrigger value="performance">性能设置</TabsTrigger>
              <TabsTrigger value="instagram">Instagram设置</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="flex-1 p-4 overflow-auto">
              <div className="space-y-6 max-w-2xl">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Globe className="h-5 w-5 mr-2" />
                      基本信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="siteName">网站名称</Label>
                      <Input
                        id="siteName"
                        value={settings.general.siteName}
                        onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="siteDescription">网站描述</Label>
                      <Input
                        id="siteDescription"
                        value={settings.general.siteDescription}
                        onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="defaultLanguage">默认语言</Label>
                        <Select
                          value={settings.general.defaultLanguage}
                          onValueChange={(value) => updateSetting('general', 'defaultLanguage', value)}
                        >
                          <option value="zh-CN">简体中文</option>
                          <option value="en-US">English</option>
                          <option value="ja-JP">日本語</option>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="timezone">时区</Label>
                        <Select
                          value={settings.general.timezone}
                          onValueChange={(value) => updateSetting('general', 'timezone', value)}
                        >
                          <option value="Asia/Shanghai">北京时间</option>
                          <option value="America/New_York">纽约时间</option>
                          <option value="Europe/London">伦敦时间</option>
                          <option value="Asia/Tokyo">东京时间</option>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="theme">主题模式</Label>
                      <Select
                        value={settings.general.theme}
                        onValueChange={(value: any) => updateSetting('general', 'theme', value)}
                      >
                        <option value="light">浅色主题</option>
                        <option value="dark">深色主题</option>
                        <option value="auto">跟随系统</option>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="security" className="flex-1 p-4 overflow-auto">
              <div className="space-y-6 max-w-2xl">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      安全配置
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sessionTimeout">会话超时时间 (小时)</Label>
                        <Slider
                          value={[settings.security.sessionTimeout]}
                          onValueChange={([value]) => updateSetting('security', 'sessionTimeout', value)}
                          max={72}
                          min={1}
                          step={1}
                        />
                        <div className="text-sm text-muted-foreground mt-1">
                          {settings.security.sessionTimeout} 小时后自动登出
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="maxLoginAttempts">最大登录尝试次数</Label>
                        <Slider
                          value={[settings.security.maxLoginAttempts]}
                          onValueChange={([value]) => updateSetting('security', 'maxLoginAttempts', value)}
                          max={10}
                          min={3}
                          step={1}
                        />
                        <div className="text-sm text-muted-foreground mt-1">
                          超过 {settings.security.maxLoginAttempts} 次后锁定账户
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="passwordMinLength">密码最小长度</Label>
                        <Slider
                          value={[settings.security.passwordMinLength]}
                          onValueChange={([value]) => updateSetting('security', 'passwordMinLength', value)}
                          max={20}
                          min={6}
                          step={1}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="apiRateLimit">API速率限制 (次/分钟)</Label>
                        <Slider
                          value={[settings.security.apiRateLimit]}
                          onValueChange={([value]) => updateSetting('security', 'apiRateLimit', value)}
                          max={5000}
                          min={100}
                          step={100}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="requireTwoFactor"
                          checked={settings.security.requireTwoFactor}
                          onCheckedChange={(checked) => updateSetting('security', 'requireTwoFactor', checked)}
                        />
                        <Label htmlFor="requireTwoFactor">强制启用双因子认证</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="notifications" className="flex-1 p-4 overflow-auto">
              <div className="space-y-6 max-w-2xl">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Bell className="h-5 w-5 mr-2" />
                      通知配置
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {[
                        { key: 'emailNotifications', label: '邮件通知', icon: Mail },
                        { key: 'pushNotifications', label: '推送通知', icon: Smartphone },
                        { key: 'smsNotifications', label: '短信通知', icon: Monitor },
                        { key: 'desktopNotifications', label: '桌面通知', icon: Monitor },
                      ].map(({ key, label, icon: Icon }) => (
                        <div key={key} className="flex items-center space-x-3">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <Label htmlFor={key}>{label}</Label>
                          </div>
                          <Switch
                            id={key}
                            checked={settings.notifications[key as keyof typeof settings.notifications]}
                            onCheckedChange={(checked) => updateSetting('notifications', key, checked)}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div>
                      <Label htmlFor="notificationFrequency">通知频率</Label>
                      <Select
                        value={settings.notifications.notificationFrequency}
                        onValueChange={(value: any) => updateSetting('notifications', 'notificationFrequency', value)}
                      >
                        <option value="immediate">立即通知</option>
                        <option value="hourly">每小时汇总</option>
                        <option value="daily">每日汇总</option>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="performance" className="flex-1 p-4 overflow-auto">
              <div className="space-y-6 max-w-2xl">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Monitor className="h-5 w-5 mr-2" />
                      性能优化
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="maxConcurrentTasks">最大并发任务数</Label>
                        <Slider
                          value={[settings.performance.maxConcurrentTasks]}
                          onValueChange={([value]) => updateSetting('performance', 'maxConcurrentTasks', value)}
                          max={50}
                          min={1}
                          step={1}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="dataRetentionDays">数据保留天数</Label>
                        <Slider
                          value={[settings.performance.dataRetentionDays]}
                          onValueChange={([value]) => updateSetting('performance', 'dataRetentionDays', value)}
                          max={365}
                          min={7}
                          step={1}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="logLevel">日志级别</Label>
                      <Select
                        value={settings.performance.logLevel}
                        onValueChange={(value: any) => updateSetting('performance', 'logLevel', value)}
                      >
                        <option value="debug">调试</option>
                        <option value="info">信息</option>
                        <option value="warning">警告</option>
                        <option value="error">错误</option>
                      </Select>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="cacheEnabled"
                          checked={settings.performance.cacheEnabled}
                          onCheckedChange={(checked) => updateSetting('performance', 'cacheEnabled', checked)}
                        />
                        <Label htmlFor="cacheEnabled">启用缓存</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="instagram" className="flex-1 p-4 overflow-auto">
              <div className="space-y-6 max-w-2xl">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Smartphone className="h-5 w-5 mr-2" />
                      Instagram API配置
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="maxAccounts">最大账号数量</Label>
                        <Slider
                          value={[settings.instagram.maxAccounts]}
                          onValueChange={([value]) => updateSetting('instagram', 'maxAccounts', value)}
                          max={100}
                          min={1}
                          step={1}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="apiTimeout">API超时时间 (秒)</Label>
                        <Slider
                          value={[settings.instagram.apiTimeout]}
                          onValueChange={([value]) => updateSetting('instagram', 'apiTimeout', value)}
                          max={120}
                          min={5}
                          step={5}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>默认延迟范围 (秒)</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="minDelay">最小延迟</Label>
                          <Slider
                            value={[settings.instagram.defaultDelayRange.min]}
                            onValueChange={([value]) => updateSetting('instagram', 'defaultDelayRange', { 
                              ...settings.instagram.defaultDelayRange, 
                              min: value 
                            })}
                            max={60}
                            min={0}
                            step={1}
                          />
                        </div>
                        <div>
                          <Label htmlFor="maxDelay">最大延迟</Label>
                          <Slider
                            value={[settings.instagram.defaultDelayRange.max]}
                            onValueChange={([value]) => updateSetting('instagram', 'defaultDelayRange', { 
                              ...settings.instagram.defaultDelayRange, 
                              max: value 
                            })}
                            max={60}
                            min={0}
                            step={1}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="defaultProxy"
                          checked={settings.instagram.defaultProxy}
                          onCheckedChange={(checked) => updateSetting('instagram', 'defaultProxy', checked)}
                        />
                        <Label htmlFor="defaultProxy">默认使用代理</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPanel;
