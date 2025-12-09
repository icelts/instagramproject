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
  FormControlLabel,
  Switch,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  Image as ImageIcon,
  Description as TextIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import {
  fetchSchedules,
  createSchedule,
  deleteSchedule,
} from '../store/slices/schedulerSlice';
import {
  fetchInstagramAccounts,
} from '../store/slices/instagramSlice';

interface ScheduleFormData {
  instagram_account_id: number;
  title: string;
  content: string;
  scheduled_time: string;
  repeat_type: 'once' | 'daily' | 'weekly' | 'monthly';
  media_files?: any[];
}

const SchedulePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { schedules, isLoading, error } = useSelector((state: RootState) => state.scheduler);
  const { accounts } = useSelector((state: RootState) => state.instagram);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleFormData | null>(null);
  const [formData, setFormData] = useState<ScheduleFormData>({
    instagram_account_id: 0,
    title: '',
    content: '',
    scheduled_time: new Date().toISOString().slice(0, 16),
    repeat_type: 'once',
    media_files: [],
  });

  useEffect(() => {
    dispatch(fetchSchedules());
    dispatch(fetchInstagramAccounts());
  }, [dispatch]);

  const handleOpenDialog = (schedule?: any) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        instagram_account_id: schedule.instagram_account_id,
        title: schedule.title,
        content: schedule.content,
        scheduled_time: new Date(schedule.scheduled_time).toISOString().slice(0, 16),
        repeat_type: schedule.repeat_type,
        media_files: schedule.media_files || [],
      });
    } else {
      setEditingSchedule(null);
      setFormData({
        instagram_account_id: 0,
        title: '',
        content: '',
        scheduled_time: new Date().toISOString().slice(0, 16),
        repeat_type: 'once',
        media_files: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSchedule(null);
    setFormData({
      instagram_account_id: 0,
      title: '',
      content: '',
      scheduled_time: new Date().toISOString().slice(0, 16),
      repeat_type: 'once',
      media_files: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.instagram_account_id) {
        alert('请选择Instagram账号');
        return;
      }
      await dispatch(createSchedule(formData)).unwrap();
      handleCloseDialog();
      dispatch(fetchSchedules());
    } catch (error) {
      console.error('操作失败:', error);
    }
  };

  const handleDelete = async (scheduleId: number) => {
    if (window.confirm('确定要删除这个发帖计划吗？')) {
      try {
        await dispatch(deleteSchedule(scheduleId)).unwrap();
        dispatch(fetchSchedules());
      } catch (error) {
        console.error('删除失败:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted':
        return 'success';
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
      case 'posted':
        return '已发布';
      case 'pending':
        return '待发布';
      case 'failed':
        return '发布失败';
      case 'cancelled':
        return '已取消';
      default:
        return '未知';
    }
  };

  const getRepeatText = (type: string) => {
    switch (type) {
      case 'once':
        return '一次性';
      case 'daily':
        return '每日';
      case 'weekly':
        return '每周';
      case 'monthly':
        return '每月';
      default:
        return '未知';
    }
  };

  const getRepeatColor = (type: string) => {
    switch (type) {
      case 'once':
        return 'default';
      case 'daily':
        return 'primary';
      case 'weekly':
        return 'info';
      case 'monthly':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            定时发帖管理
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => dispatch(fetchSchedules())}
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
              创建计划
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
                  <TableCell>标题</TableCell>
                  <TableCell>账号</TableCell>
                  <TableCell>发布时间</TableCell>
                  <TableCell>重复类型</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>发布时间</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {schedule.title}
                        </Typography>
                        {schedule.media_files && schedule.media_files.length > 0 && (
                          <ImageIcon sx={{ ml: 1, color: 'primary.main', fontSize: 16 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {accounts.find(acc => acc.id === schedule.instagram_account_id)?.username || '未知账号'}
                    </TableCell>
                    <TableCell>
                      {new Date(schedule.scheduled_time).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getRepeatText(schedule.repeat_type)}
                        color={getRepeatColor(schedule.repeat_type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(schedule.status)}
                        color={getStatusColor(schedule.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {schedule.posted_at
                        ? new Date(schedule.posted_at).toLocaleString()
                        : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="编辑">
                        <IconButton
                          onClick={() => handleOpenDialog(schedule)}
                          color="info"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="删除">
                        <IconButton
                          onClick={() => handleDelete(schedule.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {schedules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box py={4}>
                        <Typography variant="body1" color="textSecondary">
                          还没有创建发帖计划
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenDialog()}
                          sx={{ mt: 2 }}
                        >
                          创建第一个计划
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

      {/* 创建/编辑发帖计划对话框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSchedule ? '编辑发帖计划' : '创建发帖计划'}
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
                  label="标题"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  disabled={isLoading}
                  placeholder="给这个帖子起个标题"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TextIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="内容"
                  multiline
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  disabled={isLoading}
                  placeholder="输入要发布的内容..."
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="发布时间"
                  type="datetime-local"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    scheduled_time: e.target.value 
                  })}
                  required
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ScheduleIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="重复类型"
                  value={formData.repeat_type}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    repeat_type: e.target.value as any 
                  })}
                  disabled={isLoading}
                  SelectProps={{ native: true }}
                >
                  <option value="once">一次性</option>
                  <option value="daily">每日重复</option>
                  <option value="weekly">每周重复</option>
                  <option value="monthly">每月重复</option>
                </TextField>
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
              {isLoading ? <CircularProgress size={20} /> : (editingSchedule ? '更新' : '创建')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default SchedulePage;
// @ts-nocheck
