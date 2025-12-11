// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchInstagramAccounts, fetchAccountStats } from '../store/slices/instagramSlice';

const COLORS = ['#6366F1', '#22C55E', '#F97316', '#06B6D4', '#EC4899', '#FACC15', '#8B5CF6', '#10B981'];

const AccountStatsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { accounts, stats, isLoading } = useSelector((state: RootState) => state.instagram);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    const load = async () => {
      await dispatch(fetchInstagramAccounts());
    };
    load();
  }, [dispatch]);

  useEffect(() => {
    selectedIds.forEach(id => {
      if (!stats[id]) {
        dispatch(fetchAccountStats({ accountId: id, days: 30 }));
      }
    });
  }, [dispatch, selectedIds, stats]);

  const handleToggle = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const mergedFollowersData = useMemo(() => {
    const map: Record<string, any> = {};
    selectedIds.forEach((id, idx) => {
      const statList = stats[id] || [];
      statList.forEach((row: any) => {
        const date = row.stat_date?.slice(0, 10) || row.created_at?.slice(0, 10) || '';
        if (!map[date]) map[date] = { date };
        map[date][`followers_${id}`] = row.followers;
        map[date][`posts_${id}`] = row.posts;
      });
    });
    return Object.values(map).sort((a: any, b: any) => (a.date > b.date ? 1 : -1));
  }, [selectedIds, stats]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">账号增长曲线</Typography>
          <Button variant="outlined" onClick={() => selectedIds.forEach(id => dispatch(fetchAccountStats({ accountId: id, days: 30 })))}>
            刷新选中账号
          </Button>
        </Box>

        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          选择要展示的账号（多选）
        </Typography>
        <FormGroup row sx={{ mb: 3, gap: 2 }}>
          {accounts.map(acc => (
            <FormControlLabel
              key={acc.id}
              control={<Checkbox checked={selectedIds.includes(acc.id)} onChange={() => handleToggle(acc.id)} />}
              label={`${acc.username}${acc.followers ? `（粉丝 ${acc.followers}）` : ''}`}
            />
          ))}
        </FormGroup>

        {selectedIds.length === 0 ? (
          <Typography color="textSecondary">请选择至少一个账号查看曲线。</Typography>
        ) : (
          <>
            <Typography variant="h6" sx={{ mt: 1, mb: 1 }}>
              粉丝数变化
            </Typography>
            <Box height={320}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mergedFollowersData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {selectedIds.map((id, idx) => (
                    <Line
                      key={`followers-${id}`}
                      type="monotone"
                      dataKey={`followers_${id}`}
                      name={`${accounts.find(a => a.id === id)?.username || id} 粉丝`}
                      stroke={COLORS[idx % COLORS.length]}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Box>

            <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
              帖子数变化
            </Typography>
            <Box height={320}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mergedFollowersData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {selectedIds.map((id, idx) => (
                    <Line
                      key={`posts-${id}`}
                      type="monotone"
                      dataKey={`posts_${id}`}
                      name={`${accounts.find(a => a.id === id)?.username || id} 帖子`}
                      stroke={COLORS[(idx + 3) % COLORS.length]}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default AccountStatsPage;
