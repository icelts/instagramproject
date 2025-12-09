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
  Chip,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Message as MessageIcon,
  Send as SendIcon,
  Reply as ReplyIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import {
  fetchMessages,
  fetchAutoReplyRules,
  createAutoReplyRule,
} from '../store/slices/monitoringSlice';
import {
  fetchInstagramAccounts,
} from '../store/slices/instagramSlice';

interface FilterState {
  instagram_account_id: number;
  message_type: string;
  is_auto_reply: boolean;
  search_query: string;
}

const MonitoringPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { messages, autoReplyRules, isLoading, error } = useSelector((state: RootState) => state.monitoring);
  const { accounts } = useSelector((state: RootState) => state.instagram);
  
  const [filters, setFilters] = useState<FilterState>({
    instagram_account_id: 0,
    message_type: 'all',
    is_auto_reply: false,
    search_query: '',
  });

  useEffect(() => {
    dispatch(fetchMessages(filters));
    dispatch(fetchAutoReplyRules());
    dispatch(fetchInstagramAccounts());
  }, [dispatch, filters]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      instagram_account_id: 0,
      message_type: 'all',
      is_auto_reply: false,
      search_query: '',
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'text':
        return 'default';
      case 'image':
        return 'primary';
      case 'video':
        return 'secondary';
      case 'link':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'text':
        return '文本';
      case 'image':
        return '图片';
      case 'video':
        return '视频';
      case 'link':
        return '链接';
      default:
        return '未知';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <MessageIcon fontSize="small" />;
      case 'image':
        return <MessageIcon fontSize="small" />;
      case 'video':
        return <MessageIcon fontSize="small" />;
      case 'link':
        return <MessageIcon fontSize="small" />;
      default:
        return <MessageIcon fontSize="small" />;
    }
  };

  const getFilteredMessages = () => {
    let filtered = messages;
    
    if (filters.instagram_account_id) {
      filtered = filtered.filter(msg => msg.instagram_account_id === filters.instagram_account_id);
    }
    
    if (filters.message_type !== 'all') {
      filtered = filtered.filter(msg => msg.message_type === filters.message_type);
    }
    
    if (filters.is_auto_reply) {
      filtered = filtered.filter(msg => msg.is_auto_reply === true);
    }
    
    if (filters.search_query) {
      const query = filters.search_query.toLowerCase();
      filtered = filtered.filter(msg => 
        msg.message_content.toLowerCase().includes(query) ||
        msg.sender_username.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const filteredMessages = getFilteredMessages();
  const incomingCount = filteredMessages.filter(msg => msg.is_incoming).length;
  const autoReplyCount = filteredMessages.filter(msg => msg.is_auto_reply).length;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            消息监控
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => dispatch(fetchMessages(filters))}
            disabled={isLoading}
          >
            刷新
          </Button>
        </Box>

        {/* 统计卡片 */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Badge badgeContent={filteredMessages.length} color="primary">
                    <MessageIcon color="action" />
                  </Badge>
                  <Box ml={2}>
                    <Typography variant="h6">{filteredMessages.length}</Typography>
                    <Typography variant="body2" color="textSecondary">总消息</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Badge badgeContent={incomingCount} color="info">
                    <MessageIcon color="action" />
                  </Badge>
                  <Box ml={2}>
                    <Typography variant="h6">{incomingCount}</Typography>
                    <Typography variant="body2" color="textSecondary">收到的消息</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Badge badgeContent={autoReplyCount} color="success">
                    <ReplyIcon color="action" />
                  </Badge>
                  <Box ml={2}>
                    <Typography variant="h6">{autoReplyCount}</Typography>
                    <Typography variant="body2" color="textSecondary">自动回复</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Badge badgeContent={autoReplyRules.length} color="warning">
                    <ScheduleIcon color="action" />
                  </Badge>
                  <Box ml={2}>
                    <Typography variant="h6">{autoReplyRules.length}</Typography>
                    <Typography variant="body2" color="textSecondary">自动回复规则</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 筛选器 */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Instagram账号"
                value={filters.instagram_account_id}
                onChange={(e) => handleFilterChange('instagram_account_id', Number(e.target.value))}
                size="small"
                SelectProps={{ native: true }}
              >
                <option value={0}>全部账号</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.username}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                select
                label="消息类型"
                value={filters.message_type}
                onChange={(e) => handleFilterChange('message_type', e.target.value)}
                size="small"
                SelectProps={{ native: true }}
              >
                <option value="all">全部类型</option>
                <option value="text">文本</option>
                <option value="image">图片</option>
                <option value="video">视频</option>
                <option value="link">链接</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="搜索消息内容或发送者"
                value={filters.search_query}
                onChange={(e) => handleFilterChange('search_query', e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant={filters.is_auto_reply ? "contained" : "outlined"}
                onClick={() => handleFilterChange('is_auto_reply', !filters.is_auto_reply)}
                size="small"
              >
                仅自动回复
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Tooltip title="清除筛选">
                <IconButton onClick={handleClearFilters} size="small">
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>

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
                  <TableCell>发送者</TableCell>
                  <TableCell>消息内容</TableCell>
                  <TableCell>类型</TableCell>
                  <TableCell>账号</TableCell>
                  <TableCell>方向</TableCell>
                  <TableCell>自动回复</TableCell>
                  <TableCell>时间</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {message.sender_username}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {message.message_content}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getTypeIcon(message.message_type)}
                        label={getTypeText(message.message_type)}
                        color={getTypeColor(message.message_type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {accounts.find(acc => acc.id === message.instagram_account_id)?.username || '未知账号'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={message.is_incoming ? '接收' : '发送'}
                        color={message.is_incoming ? 'info' : 'success'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={message.is_auto_reply ? '是' : '否'}
                        color={message.is_auto_reply ? 'warning' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(message.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredMessages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box py={4}>
                        <Typography variant="body1" color="textSecondary">
                          没有找到符合条件的消息
                        </Typography>
                        <Button
                          variant="text"
                          onClick={handleClearFilters}
                          sx={{ mt: 2 }}
                        >
                          清除筛选条件
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
    </Container>
  );
};

export default MonitoringPage;
// @ts-nocheck
