// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  Checkbox,
  FormControlLabel,
  Grid,
  Button,
  CircularProgress,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchInstagramAccounts, fetchAccountStats } from '../store/slices/instagramSlice';

const colors = ['#8884d8', '#82ca9d', '#ff7300', '#d0ed57', '#a4de6c', '#888888', '#ff0000', '#0088FE', '#00C49F', '#FFBB28'];

const AccountStatsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { accounts, stats, isLoading } = useSelector((state: RootState) => state.instagram);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [days, setDays] = useState<number>(30);

  useEffect(() => {
    dispatch(fetchInstagramAccounts());
  }, [dispatch]);

  useEffect(() => {
    selectedIds.forEach(id => {
      dispatch(fetchAccountStats({ accountId: id, days }));
    });
  }, [selectedIds, days, dispatch]);

  const mergeStats = useMemo(() => {
    const dates = new Set<string>();
    selectedIds.forEach(id => {
      (stats[id] || []).forEach((s: any) => dates.add(s.stat_date));
    });
    const sortedDates = Array.from(dates).sort();
    return sortedDates.map(date => {
      const row: any = { date };
      selectedIds.forEach(id => {
        const stat = (stats[id] || []).find((s: any) => s.stat_date === date);
        row[`followers_${id}`] = stat?.followers_count ?? null;
        row[`posts_${id}`] = stat?.posts_count ?? null;
      });
      return row;
    });
  }, [stats, selectedIds]);

  const toggleId = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  const renderLines = (metric: 'followers' | 'posts') =>
    selectedIds.map((id, idx) => (
      <Line
        key={`${metric}_${id}`}
        type="monotone"
        dataKey={`${metric}_${id}`}
        stroke={colors[idx % colors.length]}
        dot={false}
        name={`${accounts.find(a => a.id === id)?.username || id} - ${metric === 'followers' ? '粉丝' : '帖子'}`}
      />
    ));

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">账号增长曲线</Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2">时间范围（天）</Typography>
            <input
              type="number"
              value={days}
              min={7}
              max={90}
              onChange={e => setDays(Math.max(7, Math.min(90, Number(e.target.value))))}
              style={{ width: 80, padding: 6, borderRadius: 6, border: '1px solid #ccc' }}
            />
          </Box>
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          选择要对比的账号（支持多选）：
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          {accounts.map(acc => (
            <Chip
              key={acc.id}
              label={acc.username}
              color={selectedIds.includes(acc.id) ? 'primary' : 'default'}
              onClick={() => toggleId(acc.id)}
              variant={selectedIds.includes(acc.id) ? 'filled' : 'outlined'}
            />
          ))}
        </Box>

        {isLoading && selectedIds.length === 0 ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : selectedIds.length === 0 ? (
          <Typography color="text.secondary">请选择至少一个账号</Typography>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" mb={1}>
                粉丝增长
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={mergeStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {renderLines('followers')}
                </LineChart>
              </ResponsiveContainer>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" mb={1}>
                帖子数量
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={mergeStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {renderLines('posts')}
                </LineChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default AccountStatsPage;
