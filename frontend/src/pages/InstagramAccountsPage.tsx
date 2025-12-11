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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Login as LoginIcon,
  Refresh as RefreshIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../store';
import {
  fetchInstagramAccounts,
  addInstagramAccount,
  loginInstagramAccount,
  deleteInstagramAccount,
  bulkDeleteInstagramAccounts,
  fetchProxyConfigs,
} from '../store/slices/instagramSlice';

interface AccountFormData {
  username: string;
  password: string;
  two_factor_secret?: string;
  proxy_id?: number;
}

const InstagramAccountsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { accounts, proxies, isLoading, error } = useSelector((state: RootState) => state.instagram);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountFormData | null>(null);
  const [formData, setFormData] = useState<AccountFormData>({
    username: '',
    password: '',
    two_factor_secret: '',
    proxy_id: undefined,
  });

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([dispatch(fetchInstagramAccounts()).unwrap(), dispatch(fetchProxyConfigs()).unwrap()]);
      } catch (err) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    };
    load();
  }, [dispatch, navigate]);

  const handleOpenDialog = (account?: any) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        username: account.username,
        password: '',
        two_factor_secret: account.two_factor_secret || '',
        proxy_id: account.proxy_id,
      });
    } else {
      setEditingAccount(null);
      setFormData({
        username: '',
        password: '',
        two_factor_secret: '',
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
      two_factor_secret: '',
      proxy_id: undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.proxy_id) {
      alert('每个账号必须绑定代理，请先选择代理');
      return;
    }
    try {
      if (editingAccount) {
        // update API not provided yet
        console.warn('编辑账号暂未实现');
      } else {
        await dispatch(addInstagramAccount(formData)).unwrap();
      }
      handleCloseDialog();
      dispatch(fetchInstagramAccounts());
    } catch (err) {
      console.error('操作失败:', err);
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
    if (!window.confirm('确定要删除这个账号吗？')) return;
    try {
      await dispatch(deleteInstagramAccount(accountId)).unwrap();
      dispatch(fetchInstagramAccounts());
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`确定删除选中的 ${selectedIds.length} 个账号吗？`)) return;
    try {
      await dispatch(bulkDeleteInstagramAccounts(selectedIds)).unwrap();
      setSelectedIds([]);
      dispatch(fetchInstagramAccounts());
    } catch (error) {
      console.error('批量删除失败:', error);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === accounts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(accounts.map(acc => acc.id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'logged_in':
        return 'success';
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
              color="error"
              startIcon={selectedIds.length ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
              onClick={handleBulkDelete}
              disabled={isLoading || selectedIds.length === 0}
              sx={{ mr: 2 }}
            >
              批量删除
            </Button>
            <Button variant="text" onClick={() => navigate('/proxy-config')} disabled={isLoading} sx={{ mr: 2 }}>
              代理管理
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={async () => {
                await Promise.all([dispatch(fetchInstagramAccounts()), dispatch(fetchProxyConfigs())]);
              }}
              disabled={isLoading}
              sx={{ mr: 2 }}
            >
              刷新
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
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
                  <TableCell padding="checkbox">
                    <IconButton onClick={toggleSelectAll} size="small">
                      {selectedIds.length === accounts.length && accounts.length > 0 ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                    </IconButton>
                  </TableCell>
                  <TableCell>用户名</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>最后登录</TableCell>
                  <TableCell>绑定代理</TableCell>
                  <TableCell>粉丝</TableCell>
                  <TableCell>帖子</TableCell>
                  <TableCell>今日涨粉</TableCell>
                  <TableCell>创建时间</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accounts.map(account => (
                  <TableRow key={account.id}>
                    <TableCell padding="checkbox">
                      <IconButton size="small" onClick={() => toggleSelect(account.id)}>
                        {selectedIds.includes(account.id) ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>{account.username}</TableCell>
                    <TableCell>
                      <Chip label={getStatusText(account.login_status)} color={getStatusColor(account.login_status)} size="small" />
                    </TableCell>
                    <TableCell>{account.last_login ? new Date(account.last_login).toLocaleString() : '-'}</TableCell>
                    <TableCell>{account.proxy_id ? proxies.find(p => p.id === account.proxy_id)?.name || '-' : '-'}</TableCell>
                    <TableCell>{account.followers ?? '-'}</TableCell>
                    <TableCell>{account.posts ?? '-'}</TableCell>
                    <TableCell>{account.followers_change ?? '-'}</TableCell>
                    <TableCell>{new Date(account.created_at).toLocaleString()}</TableCell>
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
                        <IconButton onClick={() => handleOpenDialog(account)} color="info">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="删除">
                        <IconButton onClick={() => handleDelete(account.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {accounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Box py={4}>
                        <Typography variant="body1" color="textSecondary">
                          还没有添加 Instagram 账号
                        </Typography>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ mt: 2 }}>
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAccount ? '编辑账号' : '添加 Instagram 账号'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="用户名"
              margin="normal"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={isLoading}
            />
            <TextField
              fullWidth
              label="密码"
              type="password"
              margin="normal"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              required={!editingAccount}
              placeholder={editingAccount ? '留空保持原密码' : ''}
              disabled={isLoading}
            />
            <TextField
              fullWidth
              label="2FA 密钥（可选）"
              helperText="若账号开启两步验证，请填写 TOTP 密钥以便登录"
              margin="normal"
              value={formData.two_factor_secret || ''}
              onChange={e => setFormData({ ...formData, two_factor_secret: e.target.value })}
              disabled={isLoading}
            />
            <TextField
              fullWidth
              select
              label="代理"
              margin="normal"
              value={formData.proxy_id || ''}
              onChange={e => setFormData({ ...formData, proxy_id: e.target.value ? Number(e.target.value) : undefined })}
              disabled={isLoading}
              required
            >
              <MenuItem value="" disabled>
                请选择代理（必选）
              </MenuItem>
              {proxies.map(proxy => (
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
            <Button type="submit" variant="contained" disabled={isLoading}>
              {isLoading ? <CircularProgress size={20} /> : editingAccount ? '更新' : '添加'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default InstagramAccountsPage;
