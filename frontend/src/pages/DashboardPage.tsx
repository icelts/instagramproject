import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountCircle,
  Schedule,
  Search,
  Message,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { AppDispatch, RootState } from '../store';
import { fetchInstagramAccounts, fetchSchedules, fetchSearchTasks } from '../store/slices/instagramSlice';
import { fetchSchedules as fetchSchedulesAction } from '../store/slices/schedulerSlice';

const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
}));

const StatCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

const StatCardContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const LargeIcon = styled(Box)(({ theme }) => ({
  fontSize: '3rem',
  color: theme.palette.primary.main,
  marginRight: theme.spacing(2),
}));

const DashboardPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { accounts, isLoading: accountsLoading } = useSelector((state: RootState) => state.instagram);
  const { schedules, isLoading: schedulesLoading } = useSelector((state: RootState) => state.scheduler);
  const { searchTasks, isLoading: tasksLoading } = useSelector((state: RootState) => state.scheduler);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // 加载数据
    dispatch(fetchInstagramAccounts());
    dispatch(fetchSchedulesAction());
    dispatch(fetchSearchTasks());
  }, [dispatch, navigate, isAuthenticated]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'logged_in':
        return 'success';
      case 'logged_out':
        return 'default';
      case 'challenge_required':
        return 'warning';
      case 'banned':
        return 'error';
      default:
        return 'default';
    }
  };

  const getScheduleStatusColor = (status: string) => {
    switch (status) {
      case 'posted':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'info';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  if (accountsLoading || schedulesLoading || tasksLoading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <StyledContainer maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        欢迎回来，{user?.full_name || user?.username}！
      </Typography>

      {/* 统计卡片 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard elevation={3}>
            <StatCardContent>
              <Box display="flex" alignItems="center">
                <LargeIcon>
                  <DashboardIcon fontSize="inherit" />
                </LargeIcon>
                <Box>
                  <Typography variant="h4" color="primary">
                    {accounts.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Instagram 账号
                  </Typography>
                </Box>
              </Box>
            </StatCardContent>
          </StatCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard elevation={3}>
            <StatCardContent>
              <Box display="flex" alignItems="center">
                <LargeIcon>
                  <Schedule fontSize="inherit" />
                </LargeIcon>
                <Box>
                  <Typography variant="h4" color="primary">
                    {schedules.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    发帖计划
                  </Typography>
                </Box>
              </Box>
            </StatCardContent>
          </StatCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard elevation={3}>
            <StatCardContent>
              <Box display="flex" alignItems="center">
                <LargeIcon>
                  <Search fontSize="inherit" />
                </LargeIcon>
                <Box>
                  <Typography variant="h4" color="primary">
                    {searchTasks.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    搜索任务
                  </Typography>
                </Box>
              </Box>
            </StatCardContent>
          </StatCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard elevation={3}>
            <StatCardContent>
              <Box display="flex" alignItems="center">
                <LargeIcon>
                  <AccountCircle fontSize="inherit" />
                </LargeIcon>
                <Box>
                  <Typography variant="h4" color="primary">
                    {accounts.filter(acc => acc.login_status === 'logged_in').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    在线账号
                  </Typography>
                </Box>
              </Box>
            </StatCardContent>
          </StatCard>
        </Grid>
      </Grid>

      {/* 快速操作和信息卡片 */}
      <Grid container spacing={3}>
        {/* Instagram 账号状态 */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Instagram 账号状态
            </Typography>
            {accounts.length === 0 ? (
              <Box textAlign="center" py={3}>
                <Typography variant="body2" color="textSecondary">
                  还没有添加Instagram账号
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/instagram/accounts')}
                  sx={{ mt: 2 }}
                >
                  添加账号
                </Button>
              </Box>
            ) : (
              <Box>
                {accounts.slice(0, 3).map((account) => (
                  <Box key={account.id} sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1">
                        {account.username}
                      </Typography>
                      <Chip
                        label={account.login_status}
                        color={getStatusColor(account.login_status)}
                        size="small"
                      />
                    </Box>
                  </Box>
                ))}
                {accounts.length > 3 && (
                  <Button
                    variant="text"
                    onClick={() => navigate('/instagram/accounts')}
                  >
                    查看全部账号
                  </Button>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* 最近发帖计划 */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              最近发帖计划
            </Typography>
            {schedules.length === 0 ? (
              <Box textAlign="center" py={3}>
                <Typography variant="body2" color="textSecondary">
                  还没有创建发帖计划
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/scheduler/schedules')}
                  sx={{ mt: 2 }}
                >
                  创建计划
                </Button>
              </Box>
            ) : (
              <Box>
                {schedules.slice(0, 3).map((schedule) => (
                  <Box key={schedule.id} sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1" noWrap>
                        {schedule.title}
                      </Typography>
                      <Chip
                        label={schedule.status}
                        color={getScheduleStatusColor(schedule.status)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary" noWrap>
                      {new Date(schedule.scheduled_time).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
                {schedules.length > 3 && (
                  <Button
                    variant="text"
                    onClick={() => navigate('/scheduler/schedules')}
                  >
                    查看全部计划
                  </Button>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* 搜索任务状态 */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              搜索任务状态
            </Typography>
            {searchTasks.length === 0 ? (
              <Box textAlign="center" py={3}>
                <Typography variant="body2" color="textSecondary">
                  还没有创建搜索任务
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/scheduler/search-tasks')}
                  sx={{ mt: 2 }}
                >
                  创建任务
                </Button>
              </Box>
            ) : (
              <Box>
                {searchTasks.slice(0, 3).map((task) => (
                  <Box key={task.id} sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1" noWrap>
                        {task.task_name}
                      </Typography>
                      <Chip
                        label={task.status}
                        color={getTaskStatusColor(task.status)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary" noWrap>
                      {task.search_type}: {task.search_query}
                    </Typography>
                  </Box>
                ))}
                {searchTasks.length > 3 && (
                  <Button
                    variant="text"
                    onClick={() => navigate('/scheduler/search-tasks')}
                  >
                    查看全部任务
                  </Button>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* 快速操作 */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              快速操作
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AccountCircle />}
                  onClick={() => navigate('/instagram/accounts')}
                  sx={{ py: 2 }}
                >
                  管理账号
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Schedule />}
                  onClick={() => navigate('/scheduler/schedules')}
                  sx={{ py: 2 }}
                >
                  发帖计划
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Search />}
                  onClick={() => navigate('/scheduler/search-tasks')}
                  sx={{ py: 2 }}
                >
                  搜索任务
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Message />}
                  onClick={() => navigate('/monitoring')}
                  sx={{ py: 2 }}
                >
                  消息监控
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </StyledContainer>
  );
};

export default DashboardPage;
