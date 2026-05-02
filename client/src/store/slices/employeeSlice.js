import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { employeeApi } from '../../api/employee.api';

const initialState = {
  list: [],
  loading: false,
  error: null,
};

export const fetchEmployees = createAsyncThunk(
  'employees/fetchEmployees',
  async (search = '', { rejectWithValue }) => {
    try {
      const res = await employeeApi.list(search);
      if (!res.success) return rejectWithValue(res.error);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createEmployee = createAsyncThunk(
  'employees/createEmployee',
  async (data, { rejectWithValue }) => {
    try {
      const res = await employeeApi.create(data);
      if (!res.success) return rejectWithValue(res.error);
      // Wait, create API might return { message: "..." } instead of the employee.
      // Need to fetch again if it doesn't return the full employee object.
      // Assuming for now it returns the new employee or a success signal.
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateEmployee = createAsyncThunk(
  'employees/updateEmployee',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await employeeApi.update(id, data);
      if (!res.success) return rejectWithValue(res.error);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteEmployee = createAsyncThunk(
  'employees/deleteEmployee',
  async (id, { rejectWithValue }) => {
    try {
      const res = await employeeApi.delete(id);
      if (!res.success) return rejectWithValue(res.error);
      return id; // Return ID to filter from list
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const employeeSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload || [];
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch employees';
      })
      // Update
      .addCase(updateEmployee.fulfilled, (state, action) => {
        // Update on success: replace the specific employee in the list
        const index = state.list.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      // Delete
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.list = state.list.filter(e => e.id !== action.payload);
      })
      // Sync attendance status when current user checks in/out via Navbar
      .addMatcher(
        (action) => action.type === 'auth/toggleCheckIn/fulfilled',
        (state, action) => {
          const attendance = action.payload.data;
          const employeeId = attendance.employee_id;
          const index = state.list.findIndex(e => e.id === employeeId);
          if (index !== -1) {
            state.list[index].is_checked_in = action.payload.is_checked_in;
            // If checking in, they are present. If checking out, they are still present for that day if they worked.
            state.list[index].attendance_status = 'present'; 
            state.list[index].today_work_hours = attendance.work_hours || 0;
          }
        }
      );
      // Create usually requires a re-fetch if the API doesn't return the full joined object,
      // but we can handle that in the component by dispatching fetchEmployees on create success.
  },
});

export default employeeSlice.reducer;
