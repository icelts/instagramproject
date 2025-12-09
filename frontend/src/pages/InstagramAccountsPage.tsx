import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Login as LoginIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import {
  fetchInstagramAccounts,
  addInstagramAccount,
  loginInstagramAccount,
  deleteInstagramAccount,
  fetchProxyConfigs,
} from '../store/slices/instagramSlice';

interface AccountFormData {
  username: string;
  password: string;
  proxy_id?: number;
}

const InstagramAccountsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { accounts, proxies, isLoading, error } = useSelector((state: RootState) => state.instagram);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountFormData | null>(null);
  const [formData, setFormData] = useState<AccountFormData>({
    username: '',
    password: '',
    proxy_id: undefined,
  });

  useEffect(() => {
    dispatch(fetchInstagramAccounts());
    dispatch(fetchProxyConfigs());
  }, [dispatch]);

  const handleOpenDialog = (account?: any) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        username: account.username,
        password: '', // 不显示密码，需要重新输入
        proxy_id: account.proxy_id,
      });
    } else {
      setEditingAccount(null);
      setFormData({
        username: '',
        password: '',
        proxy_id: undefined,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAccount(null);
    setFormData({
      username: '',
      password: '',
      proxy_id: undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        // 编辑功能暂未实现，因为API没有更新端点
        console.log('编辑账号功能待实现');
      } else {
        await dispatch(addInstagramAccount(formData)).unwrap();
      }
      handleCloseDialog();
      dispatch(fetchInstagramAccounts());
    } catch (error) {
      console.error('操作失败:', error);
    }
  };

  const handleLogin = async (accountId: number) => {
    try {
      await dispatch(loginInstagramAccount(accountId)).unwrap();
      dispatch(fetchInstagramAccounts());
    } catch (error) {
      console.error('登录失败:', error);
    }
  };

  const handleDelete = async (accountId: number) => {
    if (window.confirm('确定要删除这个账号吗？')) {
      try {
        await dispatch(deleteInstagramAccount(accountId)).unwrap();
        dispatch(fetchInstagramAccounts());
      } catch (error) {
        console.error('删除失败:', error);
      }
    }
  };

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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'logged_in':
        return '已登录';
      case 'logged_out':
        return '未登录';
      case 'challenge_required':
        return '需要验证';
      case 'banned':
        return '被封禁';
      default:
        return '未知';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Instagram 账号管理
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => dispatch(fetchInstagramAccounts())}
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
              添加账号
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
                  <TableCell>用户名</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>最后登录</TableCell>
                  <TableCell>代理</TableCell>
                  <TableCell>创建时间</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>{account.username}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(account.login_status)}
                        color={getStatusColor(account.login_status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {account.last_login
                        ? new Date(account.last_login).toLocaleString()
                        : '从未登录'}
                    </TableCell>
                    <TableCell>
                      {account.proxy_id
                        ? proxies.find(p => p.id === account.proxy_id)?.name || '未知代理'
                        : '无代理'}
                    </TableCell>
                    <TableCell>
                      {new Date(account.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="登录">
                        <IconButton
                          onClick={() => handleLogin(account.id)}
                          disabled={account.login_status === 'logged_in' || isLoading}
                          color="primary"
                        >
                          <LoginIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="编辑">
                        <IconButton
                          onClick={() => handleOpenDialog(account)}
                          color="info"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="删除">
                        <IconButton
                          onClick={() => handleDelete(account.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {accounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Box py={4}>
                        <Typography variant="body1" color="textSecondary">
                          还没有添加Instagram账号
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenDialog()}
                          sx={{ mt: 2 }}
                        >
                          添加第一个账号
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

      {/* 添加/编辑账号对话框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAccount ? '编辑账号' : '添加Instagram账号'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="用户名"
              margin="normal"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={isLoading}
            />
            <TextField
              fullWidth
              label="密码"
              type="password"
              margin="normal"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingAccount}
              placeholder={editingAccount ? '留空保持原密码' : ''}
              disabled={isLoading}
            />
            <TextField
              fullWidth
              select
              label="代理"
              margin="normal"
              value={formData.proxy_id || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                proxy_id: e.target.value ? Number(e.target.value) : undefined 
              })}
              disabled={isLoading}
            >
              <MenuItem value="">无代理</MenuItem>
              {proxies.map((proxy) => (
                <MenuItem key={proxy.id} value={proxy.id}>
                  {proxy.name} ({proxy.host}:{proxy.port})
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={isLoading}>
              取消
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={20} /> : (editingAccount ? '更新' : '添加')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default InstagramAccountsPage;
// @ts-nocheck
