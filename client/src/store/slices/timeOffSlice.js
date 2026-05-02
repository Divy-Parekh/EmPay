import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { timeoffApi } from '../../api/timeoff.api';

const initialState = {
  requests: [],
  balances: [], // Logged-in user's balances
  allBalances: [], // Company-wide balances (for Admin/HR)
  types: [],
  loading: false,
  error: null,
};

export const fetchTimeOffData = createAsyncThunk(
  'timeoff/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const [reqRes, balRes, typeRes] = await Promise.all([
        timeoffApi.getRequests(),
        timeoffApi.getBalances(),
        timeoffApi.getTypes()
      ]);
      return {
        requests: reqRes.data || [],
        balances: balRes.data || [],
        types: typeRes.data || []
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchAllBalances = createAsyncThunk(
  'timeoff/fetchAllBalances',
  async (_, { rejectWithValue }) => {
    try {
      const res = await timeoffApi.getAllBalances();
      if (!res.success) return rejectWithValue(res.error);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const approveRequest = createAsyncThunk(
  'timeoff/approve',
  async (id, { rejectWithValue }) => {
    try {
      const res = await timeoffApi.approveRequest(id);
      if (!res.success) return rejectWithValue(res.error);
      return id; // Return ID to update local state
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const rejectRequest = createAsyncThunk(
  'timeoff/reject',
  async (id, { rejectWithValue }) => {
    try {
      const res = await timeoffApi.rejectRequest(id);
      if (!res.success) return rejectWithValue(res.error);
      return id; // Return ID to update local state
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const timeOffSlice = createSlice({
  name: 'timeOff',
  initialState,
  reducers: {
    addRequestLocally: (state, action) => {
      state.requests.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTimeOffData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTimeOffData.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload.requests;
        state.balances = action.payload.balances;
        state.types = action.payload.types;
      })
      .addCase(fetchTimeOffData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAllBalances.fulfilled, (state, action) => {
        state.allBalances = action.payload || [];
      })
      // Update on success
      .addCase(approveRequest.fulfilled, (state, action) => {
        const req = state.requests.find(r => r.id === action.payload);
        if (req) req.status = 'approved';
      })
      .addCase(rejectRequest.fulfilled, (state, action) => {
        const req = state.requests.find(r => r.id === action.payload);
        if (req) req.status = 'rejected';
      });
  },
});

export const { addRequestLocally } = timeOffSlice.actions;
export default timeOffSlice.reducer;
