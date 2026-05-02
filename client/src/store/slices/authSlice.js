import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { attendanceApi } from '../../api/attendance.api';

// Initial state from localStorage if available
const token = localStorage.getItem('empay_token');
const savedUser = localStorage.getItem('empay_user');
let parsedUser = null;
if (savedUser) {
  try {
    parsedUser = JSON.parse(savedUser);
  } catch (e) {
    localStorage.removeItem('empay_user');
    localStorage.removeItem('empay_token');
  }
}

const initialState = {
  user: parsedUser?.user || null,
  employee: parsedUser?.employee || null,
  company: parsedUser?.company || null,
  permissions: parsedUser?.permissions || null,
  token: parsedUser ? token : null,
  is_checked_in: false,
  loading: !parsedUser, // If no user, not loading. If user, might need to fetch status
  error: null,
};

// Async thunks
export const fetchCheckInStatus = createAsyncThunk(
  'auth/fetchCheckInStatus',
  async (_, { rejectWithValue }) => {
    try {
      const res = await attendanceApi.getStatus();
      if (!res.success) return rejectWithValue(res.error);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const toggleCheckIn = createAsyncThunk(
  'auth/toggleCheckIn',
  async (isCurrentlyCheckedIn, { rejectWithValue }) => {
    try {
      const res = isCurrentlyCheckedIn 
        ? await attendanceApi.checkOut() 
        : await attendanceApi.checkIn();
        
      if (!res.success) return rejectWithValue(res.error);
      return { is_checked_in: !isCurrentlyCheckedIn, data: res.data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      const { token, ...rest } = action.payload;
      localStorage.setItem('empay_token', token);
      localStorage.setItem('empay_user', JSON.stringify(rest));
      state.user = rest.user;
      state.employee = rest.employee;
      state.company = rest.company;
      state.permissions = rest.permissions;
      state.token = token;
      state.loading = false;
    },
    logout: (state) => {
      localStorage.removeItem('empay_token');
      localStorage.removeItem('empay_user');
      state.user = null;
      state.employee = null;
      state.company = null;
      state.permissions = null;
      state.token = null;
      state.is_checked_in = false;
    },
    updateEmployeeProfile: (state, action) => {
      state.employee = { ...state.employee, ...action.payload };
      const saved = localStorage.getItem('empay_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.employee = state.employee;
        localStorage.setItem('empay_user', JSON.stringify(parsed));
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCheckInStatus.pending, (state) => {
        // Don't set global loading here to avoid flashing UI
      })
      .addCase(fetchCheckInStatus.fulfilled, (state, action) => {
        state.is_checked_in = action.payload.is_checked_in;
        state.loading = false;
      })
      .addCase(fetchCheckInStatus.rejected, (state) => {
        state.loading = false;
      })
      .addCase(toggleCheckIn.fulfilled, (state, action) => {
        state.is_checked_in = action.payload.is_checked_in;
      })
      .addCase(toggleCheckIn.rejected, (state, action) => {
        // If server says already checked in/out, sync our local state
        if (action.payload?.message === 'Already checked in') {
          state.is_checked_in = true;
        } else if (action.payload?.message === 'Already checked out') {
          state.is_checked_in = false;
        }
      });
  },
});

export const { login, logout, updateEmployeeProfile, setLoading } = authSlice.actions;
export default authSlice.reducer;
