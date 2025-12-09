// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
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
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Download as ExportIcon,
  Assessment as AnalyzeIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import {
  fetchSearchTasks,
  createSearchTask,
  exportSearchData,
  getSearchAnalysis,
} from '../store/slices/schedulerSlice';
import {
  fetchInstagramAccounts,
} from '../store/slices/instagramSlice';

interface SearchTaskFormData {
  instagram_account_id: number;
  task_name: string;
  search_type: 'hashtag' | 'location' | 'username' | 'keyword';
  search_query: string;
  search_params?: any;
}

const SearchTaskPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { searchTasks, isLoading, error } = useSelector((state: RootState) => state.scheduler);
  const { accounts } = useSelector((state: RootState) => state.instagram);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<SearchTaskFormData | null>(null);
  const [formData, setFormData] = useState<SearchTaskFormData>({
    instagram_account_id: 0,
    task_name: '',
    search_type: 'hashtag',
    search_query: '',
    search_params: {},
  });

  useEffect(() => {
    dispatch(fetchSearchTasks());
    dispatch(fetchInstagramAccounts());
  }, [dispatch]);

  const handleOpenDialog = (task?: any) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        instagram_account_id: task.instagram_account_id,
        task_name: task.task_name,
        search_type: task.search_type,
        search_query: task.search_query,
        search_params: task.search_params || {},
      });
    } else {
      setEditingTask(null);
      setFormData({
        instagram_account_id: 0,
        task_name: '',
        search_type: 'hashtag',
        search_query: '',
        search_params: {},
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTask(null);
    setFormData({
      instagram_account_id: 0,
      task_name: '',
      search_type: 'hashtag',
      search_query: '',
      search_params: {},
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.instagram_account_id) {
        alert('请选择Instagram账号');
        return;
      }
      await dispatch(createSearchTask(formData)).unwrap();
      handleCloseDialog();
      dispatch(fetchSearchTasks());
    } catch (error) {
      console.error('操作失败:', error);
    }
  };

  const handleExport = async (taskId: number, format: string) => {
    try {
      await dispatch(exportSearchData({ taskId, format })).unwrap();
      // 这里可以添加下载逻辑
      console.log(`导出任务 ${taskId} 为 ${format} 格式`);
    } catch (error) {
      console.error('导出失败:', error);
    }
  };

  const handleAnalyze = async (taskId: number) => {
    try {
      await dispatch(getSearchAnalysis(taskId)).unwrap();
      console.log(`分析任务 ${taskId} 数据`);
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hashtag':
        return 'primary';
      case 'location':
        return 'secondary';
      case 'username':
        return 'info';
      case 'keyword':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            搜索任务管理
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => dispatch(fetchSearchTasks())}
              disabled={isLoading}
              sx={{ mr: 2 }}
            >
              刷新
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              创建任务
            </Button>
          </Box>
        </Box>

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
                  <TableCell>创建时间</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {searchTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                        {task.task_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTypeText(task.search_type)}
                        color={getTypeColor(task.search_type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                        {task.search_query}
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
                      {new Date(task.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="导出JSON">
                        <IconButton
                          onClick={() => handleExport(task.id, 'json')}
                          color="primary"
                          disabled={task.status !== 'completed'}
                        >
                          <ExportIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="导出CSV">
                        <IconButton
                          onClick={() => handleExport(task.id, 'csv')}
                          color="secondary"
                          disabled={task.status !== 'completed'}
                        >
                          <ExportIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="数据分析">
                        <IconButton
                          onClick={() => handleAnalyze(task.id)}
                          color="info"
                          disabled={task.status !== 'completed'}
                        >
                          <AnalyzeIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="编辑">
                        <IconButton
                          onClick={() => handleOpenDialog(task)}
                          color="info"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {searchTasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box py={4}>
                        <Typography variant="body1" color="textSecondary">
                          还没有创建搜索任务
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenDialog()}
                          sx={{ mt: 2 }}
                        >
                          创建第一个任务
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* 创建/编辑搜索任务对话框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTask ? '编辑搜索任务' : '创建搜索任务'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Instagram账号"
                  value={formData.instagram_account_id}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    instagram_account_id: Number(e.target.value) 
                  })}
                  required
                  disabled={isLoading}
                  SelectProps={{ native: true }}
                >
                  <option value={0}>请选择账号</option>
                  {accounts.filter(acc => acc.login_status === 'logged_in').map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.username}
                    </option>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="任务名称"
                  value={formData.task_name}
                  onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                  required
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SearchIcon sx={{ mr: 1 }} />
                      </Box>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="搜索类型"
                  value={formData.search_type}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    search_type: e.target.value as any 
                  })}
                  disabled={isLoading}
                  SelectProps={{ native: true }}
                >
                  <option value="hashtag">标签搜索</option>
                  <option value="location">位置搜索</option>
                  <option value="username">用户搜索</option>
                  <option value="keyword">关键词搜索</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="搜索内容"
                  value={formData.search_query}
                  onChange={(e) => setFormData({ ...formData, search_query: e.target.value })}
                  required
                  disabled={isLoading}
                  placeholder={
                    formData.search_type === 'hashtag' ? '例如：时尚' :
                    formData.search_type === 'location' ? '例如：北京' :
                    formData.search_type === 'username' ? '例如：username' :
                    '例如：关键词'
                  }
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={isLoading}>
              取消
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || !formData.instagram_account_id}
            >
              {isLoading ? <CircularProgress size={20} /> : (editingTask ? '更新' : '创建')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default SearchTaskPage;
// @ts-nocheck
