import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import employeeReducer from './slices/employeeSlice';
import attendanceReducer from './slices/attendanceSlice';
import timeOffReducer from './slices/timeOffSlice';
import payrollReducer from './slices/payrollSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    employees: employeeReducer,
    attendance: attendanceReducer,
    timeOff: timeOffReducer,
    payroll: payrollReducer,
    notification: notificationReducer,
  },
});
