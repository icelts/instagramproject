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
  Chip,
  Box,
  Alert,
  CircularProgress,
  Tooltip,
  Grid,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Reply as ReplyIcon,
  Key as KeywordIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import {
  fetchAutoReplyRules,
  createAutoReplyRule,
  updateAutoReplyRule,
  deleteAutoReplyRule,
} from '../store/slices/monitoringSlice';
import { fetchInstagramAccounts } from '../store/slices/instagramSlice';

interface AutoReplyFormData {
  instagram_account_id: number;
  rule_name: string;
  keywords: string[];
  reply_message: string;
  is_active: boolean;
  priority: number;
}

const emptyForm: AutoReplyFormData = {
  instagram_account_id: 0,
  rule_name: '',
  keywords: [],
  reply_message: '',
  is_active: true,
  priority: 0,
};

const AutoReplyPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { autoReplyRules, isLoading, error } = useSelector((state: RootState) => state.monitoring);
  const { accounts } = useSelector((state: RootState) => state.instagram);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [formData, setFormData] = useState<AutoReplyFormData>(emptyForm);
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    dispatch(fetchAutoReplyRules(null));
    dispatch(fetchInstagramAccounts());
  }, [dispatch]);

  const handleOpenDialog = (rule?: any) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        instagram_account_id: rule.instagram_account_id || 0,
        rule_name: rule.rule_name || '',
        keywords: rule.keywords || [],
        reply_message: rule.reply_message || '',
        is_active: rule.is_active ?? true,
        priority: rule.priority ?? 0,
      });
    } else {
      setEditingRule(null);
      setFormData(emptyForm);
    }
    setKeywordInput('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRule(null);
    setFormData(emptyForm);
    setKeywordInput('');
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()],
      }));
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.instagram_account_id) {
      alert('请选择 Instagram 账号');
      return;
    }
    if (formData.keywords.length === 0) {
      alert('请至少添加一个关键词');
      return;
    }
    if (!formData.reply_message.trim()) {
      alert('请输入回复内容');
      return;
    }

    try {
      if (editingRule?.id) {
        await dispatch(updateAutoReplyRule({ id: editingRule.id, data: formData })).unwrap();
      } else {
        await dispatch(createAutoReplyRule(formData)).unwrap();
      }
      handleCloseDialog();
      dispatch(fetchAutoReplyRules(null));
    } catch (err) {
      console.error('操作失败', err);
    }
  };

  const handleDelete = async (ruleId: number) => {
    if (!window.confirm('确定要删除这个自动回复规则吗？')) return;
    try {
      await dispatch(deleteAutoReplyRule(ruleId)).unwrap();
      dispatch(fetchAutoReplyRules(null));
    } catch (err) {
      console.error('删除失败', err);
    }
  };

  const getStatusColor = (isActive: boolean) => (isActive ? 'success' : 'default');
  const getStatusText = (isActive: boolean) => (isActive ? '启用' : '禁用');
  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'error';
    if (priority >= 5) return 'warning';
    if (priority >= 3) return 'info';
    return 'default';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            自动回复配置
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => dispatch(fetchAutoReplyRules(null))}
              disabled={isLoading}
              sx={{ mr: 2 }}
            >
              刷新
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              创建规则
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {String(error)}
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
                  <TableCell>规则名称</TableCell>
                  <TableCell>账号</TableCell>
                  <TableCell>关键词</TableCell>
                  <TableCell>回复内容</TableCell>
                  <TableCell>优先级</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {autoReplyRules.map((rule: any) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {rule.rule_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {accounts.find(acc => acc.id === rule.instagram_account_id)?.username || '未知账号'}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {(rule.keywords || []).map((keyword: string, index: number) => (
                          <Chip
                            key={index}
                            label={keyword}
                            size="small"
                            variant="outlined"
                            icon={<KeywordIcon fontSize="small" />}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                        {rule.reply_message}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={rule.priority} color={getPriorityColor(rule.priority)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={getStatusText(rule.is_active)} color={getStatusColor(rule.is_active)} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="编辑">
                        <IconButton onClick={() => handleOpenDialog(rule)} color="info">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="删除">
                        <IconButton onClick={() => handleDelete(rule.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {autoReplyRules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box py={4}>
                        <Typography variant="body1" color="textSecondary">
                          暂无自动回复规则
                        </Typography>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ mt: 2 }}>
                          创建第一个规则
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingRule ? '编辑自动回复规则' : '创建自动回复规则'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Instagram账号"
                  value={formData.instagram_account_id}
                  onChange={e => setFormData({ ...formData, instagram_account_id: Number(e.target.value) })}
                  required
                  disabled={isLoading}
                  SelectProps={{ native: true }}
                >
                  <option value={0}>请选择账号</option>
                  {accounts.filter(acc => acc.login_status === 'logged_in').map(account => (
                    <option key={account.id} value={account.id}>
                      {account.username}
                    </option>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="规则名称"
                  value={formData.rule_name}
                  onChange={e => setFormData({ ...formData, rule_name: e.target.value })}
                  required
                  disabled={isLoading}
                  placeholder="为规则起个名字"
                />
              </Grid>
              <Grid item xs={12}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    关键词（消息包含这些词时触发自动回复）
                  </Typography>
                  <Box display="flex" gap={1} mb={1}>
                    <TextField
                      fullWidth
                      size="small"
                      value={keywordInput}
                      onChange={e => setKeywordInput(e.target.value)}
                      placeholder="输入关键词后按回车或点击添加"
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                      disabled={isLoading}
                    />
                    <Button type="button" variant="outlined" onClick={handleAddKeyword} disabled={!keywordInput.trim() || isLoading}>
                      添加
                    </Button>
                  </Box>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {formData.keywords.map((keyword, index) => (
                      <Chip key={index} label={keyword} onDelete={() => handleRemoveKeyword(keyword)} size="small" icon={<KeywordIcon fontSize="small" />} />
                    ))}
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="回复内容"
                  multiline
                  rows={3}
                  value={formData.reply_message}
                  onChange={e => setFormData({ ...formData, reply_message: e.target.value })}
                  required
                  disabled={isLoading}
                  placeholder="输入自动回复的内容"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="优先级"
                  type="number"
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  disabled={isLoading}
                  helperText="数字越大优先级越高 (0-10)"
                  inputProps={{ min: 0, max: 10 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                      disabled={isLoading}
                    />
                  }
                  label="启用此规则"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={isLoading}>
              取消
            </Button>
            <Button type="submit" variant="contained" disabled={isLoading || !formData.instagram_account_id || formData.keywords.length === 0}>
              {isLoading ? <CircularProgress size={20} /> : editingRule ? '更新' : '创建'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default AutoReplyPage;
