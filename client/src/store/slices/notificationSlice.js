import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationApi } from '../../api/notification.api';

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationApi.getNotifications();
      if (!response.success) return rejectWithValue(response.error);
      return response.data; // { notifications, unreadCount }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch notifications');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (id, { rejectWithValue }) => {
    try {
      const response = await notificationApi.markAsRead(id);
      if (!response.success) return rejectWithValue(response.error);
      return response.data; // updated notification
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to mark as read');
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationApi.markAllAsRead();
      if (!response.success) return rejectWithValue(response.error);
      return true;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to mark all as read');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    items: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const id = action.payload.id;
        const index = state.items.findIndex(n => n.id === id);
        if (index !== -1 && !state.items[index].is_read) {
          state.items[index].is_read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      // Mark all as read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.items.forEach(n => { n.is_read = true; });
        state.unreadCount = 0;
      });
  },
});

export default notificationSlice.reducer;
