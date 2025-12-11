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
  Select,
  InputLabel,
  FormControl,
  OutlinedInput,
  Checkbox,
  ListItemText,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
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
import { fetchInstagramAccounts } from '../store/slices/instagramSlice';

interface SearchTaskFormData {
  account_ids: number[];
  task_name: string;
  search_type: 'hashtag' | 'location' | 'username' | 'keyword';
  search_queries_text: string; // multi-line input, split by newline
  limit_per_query: number;
  download_media: boolean;
  keep_hours: number;
  search_params?: any;
}

const SearchTaskPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { searchTasks, isLoading, error } = useSelector((state: RootState) => state.scheduler);
  const { accounts } = useSelector((state: RootState) => state.instagram);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [formData, setFormData] = useState<SearchTaskFormData>({
    account_ids: [],
    task_name: '',
    search_type: 'hashtag',
    search_queries_text: '',
    limit_per_query: 20,
    download_media: false,
    keep_hours: 24,
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
        account_ids: task.account_ids || [],
        task_name: task.task_name,
        search_type: task.search_type,
        search_queries_text: (task.search_queries || []).join('\n'),
        limit_per_query: task.limit_per_query || 20,
        download_media: Boolean(task.download_media),
        keep_hours: task.keep_hours || 24,
        search_params: task.search_params || {},
      });
    } else {
      setEditingTask(null);
      setFormData({
        account_ids: [],
        task_name: '',
        search_type: 'hashtag',
        search_queries_text: '',
        limit_per_query: 20,
        download_media: false,
        keep_hours: 24,
        search_params: {},
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTask(null);
      setFormData({
        account_ids: [],
        task_name: '',
        search_type: 'hashtag',
        search_queries_text: '',
        limit_per_query: 20,
        download_media: false,
        keep_hours: 24,
        search_params: {},
      });
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.account_ids.length) {
        alert('请至少选择一个Instagram账号');
        return;
      }
      const queries = formData.search_queries_text
        .split('\n')
        .map(q => q.trim())
        .filter(Boolean);
      if (!queries.length) {
        alert('请输入至少一个搜索词');
        return;
      }
      await dispatch(
        createSearchTask({
          account_ids: formData.account_ids,
          task_name: formData.task_name,
          search_type: formData.search_type,
          search_queries: queries,
          limit_per_query: formData.limit_per_query,
          download_media: formData.download_media,
          keep_hours: formData.keep_hours,
          search_params: formData.search_params,
        })
      ).unwrap();
      handleCloseDialog();
      dispatch(fetchSearchTasks());
    } catch (err) {
      console.error('操作失败:', err);
    }
  };

  const handleExport = async (taskId: number, format: string) => {
    try {
      await dispatch(exportSearchData({ taskId, format })).unwrap();
    } catch (err) {
      console.error('导出失败:', err);
    }
  };

  const handleAnalyze = async (taskId: number) => {
    try {
      await dispatch(getSearchAnalysis(taskId)).unwrap();
    } catch (err) {
      console.error('分析失败:', err);
    }
  };

  const getStatusChip = (status: string) => {
    const map: any = {
      completed: { label: '已完成', color: 'success' },
      running: { label: '运行中', color: 'info' },
      pending: { label: '待执行', color: 'warning' },
      failed: { label: '执行失败', color: 'error' },
      cancelled: { label: '已取消', color: 'default' },
    };
    const info = map[status] || { label: '未知', color: 'default' };
    return <Chip label={info.label} color={info.color} size="small" />;
  };

  const getTypeLabel = (type: string) => {
    const map: any = {
      hashtag: '标签',
      location: '地理位置',
      username: '用户名',
      keyword: '关键字',
    };
    return map[type] || type;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">搜索任务管理</Typography>
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
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              新建任务
            </Button>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          支持一次输入多个搜索词（每行一个），可选择多个账号并行抓取。支持用户名/标签/地理位置/关键字。
        </Alert>

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
                  <TableCell>类型</TableCell>
                  <TableCell>搜索词</TableCell>
                  <TableCell>账号数</TableCell>
                  <TableCell>参数</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>创建时间</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {searchTasks.map((task: any) => (
                  <TableRow key={task.id}>
                    <TableCell>{task.task_name}</TableCell>
                    <TableCell>
                      <Chip label={getTypeLabel(task.search_type)} color="primary" size="small" />
                    </TableCell>
                    <TableCell>
                      {task.search_queries?.slice(0, 2).join(', ')}
                      {task.search_queries?.length > 2 ? ` 等${task.search_queries.length}个` : ''}
                    </TableCell>
                    <TableCell>{task.account_ids?.length || 0}</TableCell>
                    <TableCell>
                      <div>每词 {task.limit_per_query || 0} 条</div>
                      <div>{task.download_media ? '下载媒体' : '仅元数据'}</div>
                    </TableCell>
                    <TableCell>{getStatusChip(task.status)}</TableCell>
                    <TableCell>{task.created_at ? new Date(task.created_at).toLocaleString() : '-'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="导出 JSON">
                        <IconButton onClick={() => handleExport(task.id, 'json')} color="primary">
                          <ExportIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="分析">
                        <IconButton onClick={() => handleAnalyze(task.id)} color="info">
                          <AnalyzeIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="删除">
                        <IconButton color="error">
                          <DeleteIcon />
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
                          还没有搜索任务，点击“新建任务”开始搜索
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenDialog()}
                          sx={{ mt: 2 }}
                        >
                          新建搜索任务
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTask ? '编辑搜索任务' : '创建搜索任务'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>选择账号</InputLabel>
                  <Select
                    multiple
                    value={formData.account_ids}
                    onChange={(e) =>
                      setFormData({ ...formData, account_ids: e.target.value as number[] })
                    }
                    input={<OutlinedInput label="选择账号" />}
                    renderValue={(selected) => {
                      const names = accounts
                        .filter((a) => selected.includes(a.id))
                        .map((a) => a.username)
                        .join(', ');
                      return names || '请选择账号';
                    }}
                  >
                    {accounts.map((acc) => (
                      <MenuItem key={acc.id} value={acc.id}>
                        <Checkbox checked={formData.account_ids.indexOf(acc.id) > -1} />
                        <ListItemText primary={acc.username} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="任务名称"
                  value={formData.task_name}
                  onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="搜索类型"
                  value={formData.search_type}
                  onChange={(e) => setFormData({ ...formData, search_type: e.target.value })}
                  required
                  disabled={isLoading}
                >
                  <MenuItem value="hashtag">标签</MenuItem>
                  <MenuItem value="location">地理位置</MenuItem>
                  <MenuItem value="username">用户名</MenuItem>
                  <MenuItem value="keyword">关键字</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="每个搜索词数量"
                  value={formData.limit_per_query}
                  onChange={(e) => setFormData({ ...formData, limit_per_query: Number(e.target.value) || 0 })}
                  required
                  disabled={isLoading}
                  inputProps={{ min: 1, max: 500 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="下载保留小时"
                  value={formData.keep_hours}
                  onChange={(e) => setFormData({ ...formData, keep_hours: Number(e.target.value) || 0 })}
                  helperText="下载的媒体在后台目录中保留的小时数"
                  disabled={isLoading}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={4} display="flex" alignItems="center">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.download_media}
                      onChange={(e) => setFormData({ ...formData, download_media: e.target.checked })}
                    />
                  }
                  label="下载媒体文件"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="搜索词（每行一个）"
                  value={formData.search_queries_text}
                  onChange={(e) => setFormData({ ...formData, search_queries_text: e.target.value })}
                  required
                  multiline
                  minRows={3}
                  placeholder="如需多账号并行抓取，按行输入多个搜索词"
                  disabled={isLoading}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="其他参数（JSON，可选）"
                  value={JSON.stringify(formData.search_params || {})}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value || '{}');
                      setFormData({ ...formData, search_params: parsed });
                    } catch {
                      // ignore
                    }
                  }}
                  disabled={isLoading}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={isLoading}>
              取消
            </Button>
            <Button type="submit" variant="contained" startIcon={<SearchIcon />} disabled={isLoading}>
              {isLoading ? <CircularProgress size={20} /> : editingTask ? '更新任务' : '开始搜索'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default SearchTaskPage;
