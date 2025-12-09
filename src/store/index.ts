import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import instagramReducer from './slices/instagramSlice';
import schedulerReducer from './slices/schedulerSlice';
import monitoringReducer from './slices/monitoringSlice';
import websocketReducer from './slices/websocketSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    instagram: instagramReducer,
    scheduler: schedulerReducer,
    monitoring: monitoringReducer,
    websocket: websocketReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
