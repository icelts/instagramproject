import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';

import { store } from './store';
import { AppDispatch, RootState } from './store';
import { getCurrentUser } from './store/slices/authSlice';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InstagramAccountsPage from './pages/InstagramAccountsPage';
import ProxyConfigPage from './pages/ProxyConfigPage';
import SchedulePage from './pages/SchedulePage';
import SearchTaskPage from './pages/SearchTaskPage';
import MonitoringPage from './pages/MonitoringPage';
import AutoReplyPage from './pages/AutoReplyPage';
import DataExportPage from './pages/DataExportPage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      light: '#8b9bff',
      dark: '#4d5bc8',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated]);

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/instagram-accounts"
              element={
                <PrivateRoute>
                  <InstagramAccountsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/proxy-config"
              element={
                <PrivateRoute>
                  <ProxyConfigPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/schedule"
              element={
                <PrivateRoute>
                  <SchedulePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/search-tasks"
              element={
                <PrivateRoute>
                  <SearchTaskPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/monitoring"
              element={
                <PrivateRoute>
                  <MonitoringPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/auto-reply"
              element={
                <PrivateRoute>
                  <AutoReplyPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/data-export"
              element={
                <PrivateRoute>
                  <DataExportPage />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
