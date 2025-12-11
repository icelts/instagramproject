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
  Alert,
  CircularProgress,
  Tooltip,
  Box,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import {
  fetchProxyConfigs,
  addProxyConfig,
  testProxyConfig,
  deleteProxyConfig,
  bulkDeleteProxyConfigs,
} from '../store/slices/instagramSlice';

interface ProxyFormData {
  name: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  proxy_type: 'http' | 'https' | 'socks4' | 'socks5';
}

const ProxyConfigPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { proxies, isLoading, error } = useSelector((state: RootState) => state.instagram);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProxy, setEditingProxy] = useState<ProxyFormData | null>(null);
  const [localTestResult, setLocalTestResult] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProxyFormData>({
    name: '',
    host: '',
    port: 8080,
    proxy_type: 'http',
  });

  useEffect(() => {
    dispatch(fetchProxyConfigs());
  }, [dispatch]);

  const handleOpenDialog = (proxy?: any) => {
    setLocalTestResult(null);
    if (proxy) {
      setEditingProxy(proxy);
      setFormData({
        name: proxy.name,
        host: proxy.host,
        port: proxy.port,
        username: proxy.username || '',
        password: '',
        proxy_type: proxy.proxy_type,
      });
    } else {
      setEditingProxy(null);
      setFormData({
        name: '',
        host: '',
        port: 8080,
        proxy_type: 'http',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setLocalTestResult(null);
    setOpenDialog(false);
    setEditingProxy(null);
    setFormData({
      name: '',
      host: '',
      port: 8080,
      proxy_type: 'http',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(addProxyConfig(formData)).unwrap();
      handleCloseDialog();
      dispatch(fetchProxyConfigs());
    } catch (error) {
      console.error('操作失败:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`确定删除选中的 ${selectedIds.length} 条代理吗？`)) return;
    try {
      await dispatch(bulkDeleteProxyConfigs(selectedIds)).unwrap();
      setSelectedIds([]);
      dispatch(fetchProxyConfigs());
    } catch (error) {
      console.error('批量删除失败:', error);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === proxies.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(proxies.map(p => p.id));
    }
  };

  const handleTestProxy = async () => {
    try {
      const res: any = await dispatch(testProxyConfig(formData)).unwrap();
      setLocalTestResult(res?.message || '测试成功');
    } catch (err: any) {
      setLocalTestResult(err?.message || '测试失败');
      console.error('代理测试失败:', err);
    }
  };

  const handleDelete = async (proxyId: number) => {
    if (!window.confirm('确定删除该代理配置吗？')) return;
    try {
      await dispatch(deleteProxyConfig(proxyId)).unwrap();
      dispatch(fetchProxyConfigs());
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'http':
        return 'HTTP';
      case 'https':
        return 'HTTPS';
      case 'socks4':
        return 'SOCKS4';
      case 'socks5':
        return 'SOCKS5';
      default:
        return '未知';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            代理配置管理
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
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => dispatch(fetchProxyConfigs())}
              disabled={isLoading}
              sx={{ mr: 2 }}
            >
              刷新
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              新建代理
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
                      {selectedIds.length === proxies.length && proxies.length > 0 ? (
                        <CheckBoxIcon />
                      ) : (
                        <CheckBoxOutlineBlankIcon />
                      )}
                    </IconButton>
                  </TableCell>
                  <TableCell>名称</TableCell>
                  <TableCell>类型</TableCell>
                  <TableCell>地址</TableCell>
                  <TableCell>端口</TableCell>
                  <TableCell>用户名</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>创建时间</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proxies.map(proxy => (
                  <TableRow key={proxy.id}>
                    <TableCell padding="checkbox">
                      <IconButton size="small" onClick={() => toggleSelect(proxy.id)}>
                        {selectedIds.includes(proxy.id) ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>{proxy.name}</TableCell>
                    <TableCell>
                      <Chip label={getTypeText(proxy.proxy_type)} color="primary" size="small" />
                    </TableCell>
                    <TableCell>{proxy.host}</TableCell>
                    <TableCell>{proxy.port}</TableCell>
                    <TableCell>{proxy.username || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={proxy.is_active ? '启用' : '停用'}
                        color={proxy.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{proxy.created_at ? new Date(proxy.created_at).toLocaleString() : '-'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="测试连接">
                        <IconButton
                          onClick={() => {
                            setEditingProxy(proxy);
                            setFormData({ ...proxy, password: '' });
                            handleTestProxy();
                          }}
                          color="primary"
                        >
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="编辑">
                        <IconButton onClick={() => handleOpenDialog(proxy)} color="info">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="删除">
                        <IconButton onClick={() => handleDelete(proxy.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {proxies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Box py={4}>
                        <Typography variant="body1" color="textSecondary">
                          还没有配置代理
                        </Typography>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ mt: 2 }}>
                          添加第一个代理
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
        <DialogTitle>{editingProxy ? '编辑代理配置' : '添加代理配置'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="配置名称"
              margin="normal"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isLoading}
              placeholder="如：美国代理"
            />
            <TextField
              fullWidth
              select
              label="代理类型"
              margin="normal"
              value={formData.proxy_type}
              onChange={e => setFormData({ ...formData, proxy_type: e.target.value as any })}
              disabled={isLoading}
            >
              <MenuItem value="http">HTTP</MenuItem>
              <MenuItem value="https">HTTPS</MenuItem>
              <MenuItem value="socks4">SOCKS4</MenuItem>
              <MenuItem value="socks5">SOCKS5</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="服务器地址"
              margin="normal"
              value={formData.host}
              onChange={e => setFormData({ ...formData, host: e.target.value })}
              required
              disabled={isLoading}
              placeholder="如：192.168.1.100 或 proxy.example.com"
            />
            <TextField
              fullWidth
              label="端口"
              type="number"
              margin="normal"
              value={formData.port}
              onChange={e => setFormData({ ...formData, port: parseInt(e.target.value) || 8080 })}
              required
              disabled={isLoading}
              placeholder="如：8080"
            />
            <TextField
              fullWidth
              label="用户名（可选）"
              margin="normal"
              value={formData.username || ''}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              disabled={isLoading}
            />
            <TextField
              fullWidth
              label="密码（编辑时需要重新输入）"
              type="password"
              margin="normal"
              value={formData.password || ''}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingProxy ? '留空保持原密码（测试/保存需重新输入）' : '可选，如果代理需要认证'}
              disabled={isLoading}
            />
            {localTestResult && (
              <Alert severity="info" sx={{ mt: 1 }}>
                {localTestResult}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={isLoading}>
              取消
            </Button>
            <Button variant="outlined" onClick={handleTestProxy} disabled={isLoading}>
              测试连接
            </Button>
            <Button type="submit" variant="contained" disabled={isLoading}>
              {isLoading ? <CircularProgress size={20} /> : editingProxy ? '更新' : '添加'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default ProxyConfigPage;
