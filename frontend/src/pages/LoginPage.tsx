import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { AppDispatch, RootState } from '../store';
import { loginUser, registerUser } from '../store/slices/authSlice';

const StyledContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  width: '100%',
  maxWidth: 400,
  borderRadius: theme.spacing(2),
  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
}));

const LoginForm: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
  });

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(loginUser(loginForm)).unwrap();
      navigate('/dashboard');
    } catch (error) {
      // 错误已经在Redux中处理
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(registerUser(registerForm)).unwrap();
      // 注册成功后切换到登录标签
      setTabValue(0);
    } catch (error) {
      // 错误已经在Redux中处理
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <StyledContainer maxWidth="lg">
      <StyledPaper elevation={3}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          Instagram 自动化平台
        </Typography>
        
        <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 3 }}>
          <Tab label="登录" />
          <Tab label="注册" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {tabValue === 0 && (
          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="用户名"
              margin="normal"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              required
              disabled={isLoading}
            />
            <TextField
              fullWidth
              label="密码"
              type="password"
              margin="normal"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              required
              disabled={isLoading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : '登录'}
            </Button>
          </Box>
        )}

        {tabValue === 1 && (
          <Box component="form" onSubmit={handleRegister}>
            <TextField
              fullWidth
              label="用户名"
              margin="normal"
              value={registerForm.username}
              onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
              required
              disabled={isLoading}
            />
            <TextField
              fullWidth
              label="邮箱"
              type="email"
              margin="normal"
              value={registerForm.email}
              onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              required
              disabled={isLoading}
            />
            <TextField
              fullWidth
              label="姓名"
              margin="normal"
              value={registerForm.full_name}
              onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
              disabled={isLoading}
            />
            <TextField
              fullWidth
              label="密码"
              type="password"
              margin="normal"
              value={registerForm.password}
              onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
              required
              disabled={isLoading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : '注册'}
            </Button>
          </Box>
        )}
      </StyledPaper>
    </StyledContainer>
  );
};

export default LoginForm;
