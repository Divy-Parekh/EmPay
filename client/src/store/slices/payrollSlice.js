import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { payrollApi } from '../../api/payroll.api';

const initialState = {
  dashboardData: null,
  payruns: [],
  loading: false,
  error: null,
};

export const fetchPayrollDashboard = createAsyncThunk(
  'payroll/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const res = await payrollApi.getDashboard();
      if (!res.success) return rejectWithValue(res.error);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchPayruns = createAsyncThunk(
  'payroll/fetchPayruns',
  async (_, { rejectWithValue }) => {
    try {
      const res = await payrollApi.getPayruns();
      if (!res.success) return rejectWithValue(res.error);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const validatePayrun = createAsyncThunk(
  'payroll/validate',
  async (id, { rejectWithValue }) => {
    try {
      const res = await payrollApi.validatePayrun(id);
      if (!res.success) return rejectWithValue(res.error);
      return id; // Return ID to update status locally
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const cancelPayrun = createAsyncThunk(
  'payroll/cancel',
  async (id, { rejectWithValue }) => {
    try {
      const res = await payrollApi.cancelPayrun(id);
      if (!res.success) return rejectWithValue(res.error);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {
    invalidateDashboard: (state) => {
      state.dashboardData = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayrollDashboard.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPayrollDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardData = action.payload;
      })
      .addCase(fetchPayrollDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPayruns.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPayruns.fulfilled, (state, action) => {
        state.loading = false;
        state.payruns = action.payload || [];
      })
      .addCase(fetchPayruns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update status on success
      .addCase(validatePayrun.fulfilled, (state, action) => {
        const pr = state.payruns.find(p => p.id === action.payload);
        if (pr) pr.status = 'validated';
      })
      .addCase(cancelPayrun.fulfilled, (state, action) => {
        const pr = state.payruns.find(p => p.id === action.payload);
        if (pr) pr.status = 'draft';
      });
  },
});

export const { invalidateDashboard } = payrollSlice.actions;
export default payrollSlice.reducer;
