/**
 * 高级搜索过滤组件
 * 提供复杂的数据搜索和过滤功能
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
  ScrollArea,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Label,
  Slider,
  DatePicker,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui';
import {
  Search,
  Filter,
  Sliders,
  Calendar,
  User,
  Hash,
  MessageSquare,
  Heart,
  Share,
  Image,
  Video,
  MapPin,
  Clock,
  TrendingUp,
  Save,
  RotateCcw,
  Download,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface SearchFilter {
  keywords: string[];
  accounts: string[];
  hashtags: string[];
  mentions: string[];
  dateRange: {
    from: Date;
    to: Date;
  };
  contentType: ('image' | 'video' | 'carousel' | 'reel')[];
  minLikes: number;
  maxLikes: number;
  minComments: number;
  maxComments: number;
  location: string;
  language: string;
  verified: boolean;
  engagement: {
    min: number;
    max: number;
  };
  followers: {
    min: number;
    max: number;
  };
}

interface SearchResult {
  id: string;
  type: 'post' | 'user' | 'hashtag' | 'location';
  title: string;
  description: string;
  thumbnail?: string;
  metadata: any;
  score: number;
  matchedFilters: string[];
}

interface AdvancedSearchProps {
  className?: string;
  onSearch?: (filters: SearchFilter) => void;
  onResults?: (results: SearchResult[]) => void;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ 
  className = '',
  onSearch,
  onResults 
}) => {
  const [activeTab, setActiveTab] = useState('filters');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [savedFilters, setSavedFilters] = useState<SearchFilter[]>([]);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);
  
  const [filters, setFilters] = useState<SearchFilter>({
    keywords: [],
    accounts: [],
    hashtags: [],
    mentions: [],
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date(),
    },
    contentType: ['image', 'video', 'carousel', 'reel'],
    minLikes: 0,
    maxLikes: 10000,
    minComments: 0,
    maxComments: 1000,
    location: '',
    language: 'zh-CN',
    verified: false,
    engagement: {
      min: 0,
      max: 100,
    },
    followers: {
      min: 0,
      max: 1000000,
    },
  });

  // 模拟搜索结果
  const performSearch = async () => {
    setIsSearching(true);
    
    // 模拟API调用
    setTimeout(() => {
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'post',
          title: '产品展示图片',
          description: '最新产品展示，欢迎大家咨询购买...',
          thumbnail: '/api/placeholder/300/200',
          metadata: {
            likes: 1234,
            comments: 89,
            shares: 45,
            date: new Date(),
            author: 'user123',
            verified: true,
          },
          score: 0.95,
          matchedFilters: ['keywords', 'dateRange', 'contentType'],
        },
        {
          id: '2',
          type: 'user',
          title: '产品专家',
          description: '专注于产品评测和推荐的专业账号',
          metadata: {
            followers: 50000,
            following: 1200,
            posts: 892,
            verified: false,
          },
          score: 0.87,
          matchedFilters: ['keywords', 'followers'],
        },
        {
          id: '3',
          type: 'hashtag',
          title: '#产品推荐',
          description: '热门产品推荐标签，已有100万+帖子',
          metadata: {
            posts: 1203456,
            trending: true,
            category: '产品',
          },
          score: 0.82,
          matchedFilters: ['hashtags'],
        },
        {
          id: '4',
          type: 'location',
          title: '北京市朝阳区',
          description: '商业中心区域，多個热门商圈',
          metadata: {
            posts: 45678,
            country: '中国',
            city: '北京',
          },
          score: 0.76,
          matchedFilters: ['location'],
        },
      ];
      
      setResults(mockResults);
      setIsSearching(false);
      onResults?.(mockResults);
    }, 2000);
  };

  // 添加关键词
  const addKeyword = (keyword: string) => {
    if (keyword.trim() && !filters.keywords.includes(keyword.trim())) {
      setFilters(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword.trim()]
      }));
    }
  };

  // 移除关键词
  const removeKeyword = (keyword: string) => {
    setFilters(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  // 保存过滤器
  const saveFilter = () => {
    const filterName = prompt('请输入过滤器名称:');
    if (filterName) {
      setSavedFilters(prev => [...prev, { ...filters, name: filterName } as any]);
    }
  };

  // 加载保存的过滤器
  const loadFilter = (savedFilter: SearchFilter) => {
    setFilters(savedFilter);
  };

  // 重置过滤器
  const resetFilters = () => {
    setFilters({
      keywords: [],
      accounts: [],
      hashtags: [],
      mentions: [],
      dateRange: {
        from: subDays(new Date(), 30),
        to: new Date(),
      },
      contentType: ['image', 'video', 'carousel', 'reel'],
      minLikes: 0,
      maxLikes: 10000,
      minComments: 0,
      maxComments: 1000,
      location: '',
      language: 'zh-CN',
      verified: false,
      engagement: {
        min: 0,
        max: 100,
      },
      followers: {
        min: 0,
        max: 1000000,
      },
    });
  };

  // 导出结果
  const exportResults = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `search-results-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // 获取结果类型图标
  const getResultIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      post: <Image className="h-4 w-4" />,
      user: <User className="h-4 w-4" />,
      hashtag: <Hash className="h-4 w-4" />,
      location: <MapPin className="h-4 w-4" />,
    };
    return icons[type] || <Search className="h-4 w-4" />;
  };

  // 获取结果类型名称
  const getResultTypeName = (type: string) => {
    const names: Record<string, string> = {
      post: '帖子',
      user: '用户',
      hashtag: '标签',
      location: '地点',
    };
    return names[type] || type;
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-6 w-6" />
              <CardTitle className="text-xl">高级搜索</CardTitle>
              <Badge variant="secondary">{results.length}</Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={saveFilter}>
                <Save className="h-4 w-4 mr-2" />
                保存过滤
              </Button>
              <Button variant="outline" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4 mr-2" />
                重置
              </Button>
              <Button onClick={performSearch} disabled={isSearching}>
                {isSearching ? '搜索中...' : '开始搜索'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="filters">搜索条件</TabsTrigger>
              <TabsTrigger value="results">搜索结果</TabsTrigger>
              <TabsTrigger value="saved">保存的过滤</TabsTrigger>
            </TabsList>
            
            <TabsContent value="filters" className="flex-1 p-4 overflow-auto">
              <div className="space-y-6">
                {/* 关键词搜索 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Search className="h-5 w-5 mr-2" />
                      关键词搜索
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="输入关键词，按回车添加..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addKeyword((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          if (input.value) {
                            addKeyword(input.value);
                            input.value = '';
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {filters.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                          <span>{keyword}</span>
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeKeyword(keyword)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 高级过滤选项 */}
                <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start">
                      <Sliders className="h-4 w-4 mr-2" />
                      高级过滤选项
                      {isAdvancedOpen ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-6">
                    {/* 内容类型 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">内容类型</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {['image', 'video', 'carousel', 'reel'].map((type) => (
                            <div key={type} className="flex items-center space-x-2">
                              <Checkbox
                                id={type}
                                checked={filters.contentType.includes(type as any)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFilters(prev => ({
                                      ...prev,
                                      contentType: [...prev.contentType, type as any]
                                    }));
                                  } else {
                                    setFilters(prev => ({
                                      ...prev,
                                      contentType: prev.contentType.filter(t => t !== type)
                                    }));
                                  }
                                }}
                              />
                              <Label htmlFor={type}>
                                {type === 'image' ? '图片' : 
                                 type === 'video' ? '视频' : 
                                 type === 'carousel' ? '轮播' : 'Reels'}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* 互动数据 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">互动数据</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>点赞数量: {filters.minLikes} - {filters.maxLikes}</Label>
                            <div className="space-y-2">
                              <Slider
                                value={[filters.minLikes]}
                                onValueChange={([value]) => setFilters(prev => ({ ...prev, minLikes: value }))}
                                max={10000}
                                step={100}
                              />
                              <Slider
                                value={[filters.maxLikes]}
                                onValueChange={([value]) => setFilters(prev => ({ ...prev, maxLikes: value }))}
                                max={10000}
                                step={100}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label>评论数量: {filters.minComments} - {filters.maxComments}</Label>
                            <div className="space-y-2">
                              <Slider
                                value={[filters.minComments]}
                                onValueChange={([value]) => setFilters(prev => ({ ...prev, minComments: value }))}
                                max={1000}
                                step={10}
                              />
                              <Slider
                                value={[filters.maxComments]}
                                onValueChange={([value]) => setFilters(prev => ({ ...prev, maxComments: value }))}
                                max={1000}
                                step={10}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label>互动率: {filters.engagement.min}% - {filters.engagement.max}%</Label>
                          <div className="space-y-2">
                            <Slider
                              value={[filters.engagement.min]}
                              onValueChange={([value]) => setFilters(prev => ({ 
                                ...prev, 
                                engagement: { ...prev.engagement, min: value }
                              }))}
                              max={100}
                              step={1}
                            />
                            <Slider
                              value={[filters.engagement.max]}
                              onValueChange={([value]) => setFilters(prev => ({ 
                                ...prev, 
                                engagement: { ...prev.engagement, max: value }
                              }))}
                              max={100}
                              step={1}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 时间范围 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <Calendar className="h-5 w-5 mr-2" />
                          时间范围
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="fromDate">开始日期</Label>
                            <DatePicker
                              id="fromDate"
                              value={filters.dateRange.from}
                              onChange={(date) => setFilters(prev => ({
                                ...prev,
                                dateRange: { ...prev.dateRange, from: date! }
                              }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="toDate">结束日期</Label>
                            <DatePicker
                              id="toDate"
                              value={filters.dateRange.to}
                              onChange={(date) => setFilters(prev => ({
                                ...prev,
                                dateRange: { ...prev.dateRange, to: date! }
                              }))}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </TabsContent>
            
            <TabsContent value="results" className="flex-1 p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    搜索结果 ({results.length})
                  </h3>
                  <Button variant="outline" onClick={exportResults} disabled={results.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    导出结果
                  </Button>
                </div>
                
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">搜索中...</span>
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">暂无搜索结果</p>
                    <p className="text-sm text-muted-foreground">请调整搜索条件后重试</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {results.map((result) => (
                      <Card key={result.id} className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className="flex items-center space-x-2">
                            {getResultIcon(result.type)}
                            <Badge variant="outline">{getResultTypeName(result.type)}</Badge>
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-medium mb-1">{result.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{result.description}</p>
                            
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="text-muted-foreground">匹配度:</span>
                              <Badge variant={result.score > 0.8 ? 'default' : 'secondary'}>
                                {(result.score * 100).toFixed(1)}%
                              </Badge>
                              
                              <span className="text-muted-foreground">匹配条件:</span>
                              <div className="flex flex-wrap gap-1">
                                {result.matchedFilters.map((filter, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {filter}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="saved" className="flex-1 p-4">
              <div className="space-y-4">
                {savedFilters.length === 0 ? (
                  <div className="text-center py-8">
                    <Save className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">暂无保存的过滤器</p>
                    <p className="text-sm text-muted-foreground">配置搜索条件后点击"保存过滤"按钮</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {savedFilters.map((savedFilter, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{(savedFilter as any).name}</h3>
                            <p className="text-sm text-muted-foreground">
                              关键词: {savedFilter.keywords.join(', ')} | 
                              内容类型: {savedFilter.contentType.join(', ')} | 
                              点赞: {savedFilter.minLikes}-{savedFilter.maxLikes}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadFilter(savedFilter)}
                            >
                              加载
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSavedFilters(prev => prev.filter((_, i) => i !== index))}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedSearch;
// @ts-nocheck
