// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Box,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Assessment as AnalyticsIcon,
  DateRange as DateIcon,
  People as UsersIcon,
  Message as MessageIcon,
  TrendingUp as TrendingIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import {
  fetchSearchTasks,
  exportSearchData,
  getSearchAnalysis,
} from '../store/slices/schedulerSlice';
import {
  fetchInstagramAccounts,
} from '../store/slices/instagramSlice';

interface ExportFilter {
  search_task_id: number;
  format: 'json' | 'csv' | 'excel';
  date_from: string;
  date_to: string;
}

const DataExportPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { searchTasks, isLoading, error } = useSelector((state: RootState) => state.scheduler);
  const { accounts } = useSelector((state: RootState) => state.instagram);
  
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<number>(0);
  const [exportFilters, setExportFilters] = useState<ExportFilter>({
    search_task_id: 0,
    format: 'csv',
    date_from: '',
    date_to: '',
  });
  const [analysisData, setAnalysisData] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchSearchTasks());
    dispatch(fetchInstagramAccounts());
  }, [dispatch]);

  const handleExportDialog = (taskId: number = 0) => {
    setSelectedTask(taskId);
    setExportFilters({
      search_task_id: taskId,
      format: 'csv',
      date_from: '',
      date_to: '',
    });
    setOpenExportDialog(true);
  };

  const handleCloseExportDialog = () => {
    setOpenExportDialog(false);
    setSelectedTask(0);
    setExportFilters({
      search_task_id: 0,
      format: 'csv',
      date_to: '',
      date_from: '',
    });
  };

  const handleExport = async () => {
    try {
      if (!exportFilters.search_task_id) {
        alert('请选择搜索任务');
        return;
      }
      
      await dispatch(exportSearchData({
        taskId: exportFilters.search_task_id,
        format: exportFilters.format,
        dateFrom: exportFilters.date_from,
        dateTo: exportFilters.date_to,
      })).unwrap();
      
      handleCloseExportDialog();
      console.log('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
    }
  };

  const handleAnalyze = async (taskId: number) => {
    try {
      const data = await dispatch(getSearchAnalysis(taskId)).unwrap();
      setAnalysisData(data);
      console.log('分析数据:', data);
    } catch (error) {
      console.error('分析失败:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'info';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'running':
        return '运行中';
      case 'pending':
        return '待执行';
      case 'failed':
        return '执行失败';
      case 'cancelled':
        return '已取消';
      default:
        return '未知';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'hashtag':
        return '标签搜索';
      case 'location':
        return '位置搜索';
      case 'username':
        return '用户搜索';
      case 'keyword':
        return '关键词搜索';
      default:
        return '未知';
    }
  };

  const getCompletedTasks = () => searchTasks.filter(task => task.status === 'completed');
  const totalCollectedUsers = searchTasks.reduce((sum, task) => {
    return sum + (task.results?.length || 0);
  }, 0);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            数据统计与导出
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => dispatch(fetchSearchTasks())}
            disabled={isLoading}
          >
            刷新
          </Button>
        </Box>

        {/* 统计卡片 */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{searchTasks.length}</Typography>
                    <Typography variant="body2" color="textSecondary">总搜索任务</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AnalyticsIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{getCompletedTasks().length}</Typography>
                    <Typography variant="body2" color="textSecondary">已完成任务</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <UsersIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{totalCollectedUsers.toLocaleString()}</Typography>
                    <Typography variant="body2" color="textSecondary">采集用户数</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <DownloadIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4">3</Typography>
                    <Typography variant="body2" color="textSecondary">导出格式</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 搜索任务列表 */}
        <Typography variant="h5" gutterBottom>
          搜索任务数据
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={60} />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>任务名称</TableCell>
                  <TableCell>搜索类型</TableCell>
                  <TableCell>搜索内容</TableCell>
                  <TableCell>账号</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>采集数据量</TableCell>
                  <TableCell>创建时间</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {searchTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {task.task_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTypeText(task.search_type)}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                        {Array.isArray(task.search_queries) ? task.search_queries.join(', ') : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {accounts.find(acc => acc.id === task.instagram_account_id)?.username || '未知账号'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(task.status)}
                        color={getStatusColor(task.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {task.results?.length || 0} 条
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(task.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="数据分析">
                        <IconButton
                          onClick={() => handleAnalyze(task.id)}
                          color="info"
                          disabled={task.status !== 'completed'}
                        >
                          <AnalyticsIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="导出数据">
                        <IconButton
                          onClick={() => handleExportDialog(task.id)}
                          color="primary"
                          disabled={task.status !== 'completed'}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {searchTasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Box py={4}>
                        <Typography variant="body1" color="textSecondary">
                          还没有搜索任务数据
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          请先创建搜索任务来采集数据
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* 导出对话框 */}
      <Dialog open={openExportDialog} onClose={handleCloseExportDialog} maxWidth="sm" fullWidth>
        <DialogTitle>导出数据</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="搜索任务"
                value={exportFilters.search_task_id}
                onChange={(e) => setExportFilters({ 
                  ...exportFilters, 
                  search_task_id: Number(e.target.value) 
                })}
                SelectProps={{ native: true }}
              >
                <option value={0}>请选择搜索任务</option>
                {getCompletedTasks().map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.task_name} - {getTypeText(task.search_type)}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="开始日期"
                type="date"
                value={exportFilters.date_from}
                onChange={(e) => setExportFilters({ 
                  ...exportFilters, 
                  date_from: e.target.value 
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="结束日期"
                type="date"
                value={exportFilters.date_to}
                onChange={(e) => setExportFilters({ 
                  ...exportFilters, 
                  date_to: e.target.value 
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="导出格式"
                value={exportFilters.format}
                onChange={(e) => setExportFilters({ 
                  ...exportFilters, 
                  format: e.target.value as any 
                })}
                SelectProps={{ native: true }}
              >
                <option value="csv">CSV 格式</option>
                <option value="json">JSON 格式</option>
                <option value="excel">Excel 格式</option>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExportDialog} disabled={isLoading}>
            取消
          </Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={isLoading || !exportFilters.search_task_id}
            startIcon={<DownloadIcon />}
          >
            {isLoading ? <CircularProgress size={20} /> : '导出'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DataExportPage;
// @ts-nocheck
