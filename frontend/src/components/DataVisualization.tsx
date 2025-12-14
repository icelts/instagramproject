/**
 * 数据可视化组件
 * 提供各种图表和数据展示功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Select,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  DateRangePicker,
  Switch,
} from './ui';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 图表颜色配置
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface DataVisualizationProps {
  className?: string;
}

export const DataVisualization: React.FC<DataVisualizationProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<any>({});

  // 模拟数据生成
  useEffect(() => {
    generateChartData();
  }, [dateRange, selectedMetric]);

  const generateChartData = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      
      // 生成时间序列数据
      const timeSeriesData = Array.from({ length: days }, (_, i) => {
        const date = subDays(dateRange.to, days - i - 1);
        return {
          date: format(date, 'MM/dd'),
          fullDate: date,
          messages: Math.floor(Math.random() * 100) + 50,
          likes: Math.floor(Math.random() * 200) + 100,
          comments: Math.floor(Math.random() * 50) + 20,
          follows: Math.floor(Math.random() * 30) + 10,
          engagement: Math.floor(Math.random() * 15) + 5,
        };
      });

      // 生成账号性能数据
      const accountPerformance = [
        { name: '账号1', messages: 245, likes: 1234, comments: 456, engagement: 8.5 },
        { name: '账号2', messages: 189, likes: 987, comments: 321, engagement: 7.2 },
        { name: '账号3', messages: 321, likes: 1567, comments: 234, engagement: 9.1 },
        { name: '账号4', messages: 156, likes: 789, comments: 189, engagement: 6.8 },
        { name: '账号5', messages: 278, likes: 1456, comments: 412, engagement: 8.9 },
      ];

      // 生成内容类型分布数据
      const contentTypeDistribution = [
        { name: '图片', value: 45, count: 450 },
        { name: '视频', value: 25, count: 250 },
        { name: '轮播', value: 20, count: 200 },
        { name: 'Reels', value: 10, count: 100 },
      ];

      // 生成互动来源数据
      const engagementSources = [
        { source: '主页', value: 35 },
        { source: 'Hashtag', value: 28 },
        { source: '推荐', value: 20 },
        { source: '分享', value: 12 },
        { source: '其他', value: 5 },
      ];

      // 生成时段分析数据
      const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        posts: Math.floor(Math.random() * 20) + 5,
        engagement: Math.floor(Math.random() * 100) + 50,
      }));

      // 生成关键词趋势数据
      const keywordTrends = [
        { keyword: '产品A', mentions: 456, growth: 12.5 },
        { keyword: '产品B', mentions: 389, growth: -5.2 },
        { keyword: '产品C', mentions: 234, growth: 8.7 },
        { keyword: '产品D', mentions: 178, growth: 15.3 },
        { keyword: '产品E', mentions: 145, growth: -2.1 },
      ];

      setChartData({
        timeSeriesData,
        accountPerformance,
        contentTypeDistribution,
        engagementSources,
        hourlyActivity,
        keywordTrends,
      });
      
      setIsLoading(false);
    }, 1000);
  };

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 导出图表数据
  const exportData = () => {
    const dataStr = JSON.stringify(chartData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `instagram-data-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6" />
              <CardTitle className="text-xl">数据可视化</CardTitle>
            </div>
            
            <div className="flex items-center space-x-2">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                className="w-64"
              />
              
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <option value="all">全部指标</option>
                <option value="engagement">互动数据</option>
                <option value="growth">增长数据</option>
                <option value="content">内容分析</option>
              </Select>
              
              <Button variant="outline" onClick={generateChartData} disabled={isLoading}>
                {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                刷新
              </Button>
              
              <Button variant="outline" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">总览</TabsTrigger>
              <TabsTrigger value="trends">趋势分析</TabsTrigger>
              <TabsTrigger value="comparison">对比分析</TabsTrigger>
              <TabsTrigger value="distribution">分布分析</TabsTrigger>
              <TabsTrigger value="performance">性能分析</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="flex-1 p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {/* 总体趋势图 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      总体趋势
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={chartData.timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area type="monotone" dataKey="messages" stackId="1" stroke="#8884d8" fill="#8884d8" />
                        <Area type="monotone" dataKey="likes" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                        <Area type="monotone" dataKey="comments" stackId="1" stroke="#ffc658" fill="#ffc658" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 内容类型分布 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <PieChartIcon className="h-5 w-5 mr-2" />
                      内容类型分布
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartData.contentTypeDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.contentTypeDistribution?.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="trends" className="flex-1 p-4">
              <div className="space-y-6">
                {/* 消息趋势 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2" />
                      消息趋势分析
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData.timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey="messages" stroke="#8884d8" strokeWidth={2} />
                        <Line type="monotone" dataKey="engagement" stroke="#82ca9d" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 时段活动分析 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      24小时活动分析
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData.hourlyActivity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="posts" fill="#8884d8" />
                        <Bar dataKey="engagement" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="comparison" className="flex-1 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    账号性能对比
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData.accountPerformance} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="messages" fill="#8884d8" />
                      <Bar dataKey="likes" fill="#82ca9d" />
                      <Bar dataKey="comments" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="distribution" className="flex-1 p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 互动来源分布 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">互动来源分布</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartData.engagementSources}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.engagementSources?.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 关键词趋势 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">关键词趋势</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {chartData.keywordTrends?.map((keyword: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{keyword.keyword}</h4>
                            <p className="text-sm text-muted-foreground">提及次数: {keyword.mentions}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {keyword.growth > 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <Badge variant={keyword.growth > 0 ? 'default' : 'destructive'}>
                              {keyword.growth > 0 ? '+' : ''}{keyword.growth}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="performance" className="flex-1 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">综合性能雷达图</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={chartData.accountPerformance}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <PolarRadiusAxis />
                      <Radar name="消息数" dataKey="messages" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                      <Radar name="点赞数" dataKey="likes" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                      <Radar name="评论数" dataKey="comments" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataVisualization;
// @ts-nocheck
