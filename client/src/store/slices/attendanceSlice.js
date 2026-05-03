import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { attendanceApi } from '../../api/attendance.api';
import { toggleCheckIn } from './authSlice';

const initialState = {
  adminRecords: [], // Daily records for admin view
  myRecords: [],    // Monthly records for employee view
  summary: null,    // Monthly summary for employee view
  loading: false,
  error: null,
};

export const fetchAllAttendance = createAsyncThunk(
  'attendance/fetchAll',
  async ({ date }, { rejectWithValue }) => {
    try {
      const res = await attendanceApi.getAll({ date });
      if (!res.success) return rejectWithValue(res.error);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMyAttendance = createAsyncThunk(
  'attendance/fetchMy',
  async ({ month, year }, { rejectWithValue }) => {
    try {
      const res = await attendanceApi.getMy({ month, year });
      if (!res.success) return rejectWithValue(res.error);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllAttendance.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.adminRecords = action.payload || [];
      })
      .addCase(fetchAllAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })
      .addCase(fetchMyAttendance.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.myRecords = action.payload?.records || [];
        state.summary = action.payload?.summary || null;
      })
      .addCase(fetchMyAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })
      // React to check-in/out success from authSlice to update local data immediately
      .addCase(toggleCheckIn.fulfilled, (state, action) => {
        // If it's a check-out, the API returns the updated session with work_hours
        const updatedSession = action.payload.data;
        if (updatedSession && updatedSession.check_out) {
          // Update myRecords
          const myIndex = state.myRecords.findIndex(r => r.id === updatedSession.id);
          if (myIndex !== -1) {
            state.myRecords[myIndex] = updatedSession;
          } else {
             // If not found (maybe they checked in today and it wasn't in the list yet), we could add it
             state.myRecords.unshift(updatedSession);
          }
          
          // We can also patch adminRecords if we want, but adminRecords is grouped by employee_id now
          // The admin list shows total hours per employee. 
          const adminIndex = state.adminRecords.findIndex(r => r.employee_id === updatedSession.employee_id);
          if (adminIndex !== -1) {
            // Very basic patch for admin view: just clear it to force refetch next time Admin looks at it,
            // or update it if we are sure how the aggregation works.
            state.adminRecords = [];
          }
        } else if (updatedSession && !updatedSession.check_out) {
           // It's a check-in
           state.myRecords.unshift(updatedSession);
           state.adminRecords = [];
        }
      });
  },
});

export default attendanceSlice.reducer;
