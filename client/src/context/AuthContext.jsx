import { createContext, useReducer, useEffect } from 'react';
import { attendanceApi } from '../api/attendance.api';

export const AuthContext = createContext(null);

const initialState = {
  user: null,
  employee: null,
  company: null,
  permissions: null,
  token: null,
  is_checked_in: false,
  loading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        employee: action.payload.employee,
        company: action.payload.company,
        permissions: action.payload.permissions,
        token: action.payload.token,
        loading: false,
      };
    case 'LOGOUT':
      return { ...initialState, loading: false };
    case 'SET_CHECKED_IN':
      return { ...state, is_checked_in: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'UPDATE_EMPLOYEE':
      return { ...state, employee: { ...state.employee, ...action.payload } };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /* Restore session from localStorage on mount */
  useEffect(() => {
    const token = localStorage.getItem('empay_token');
    const saved = localStorage.getItem('empay_user');
    if (token && saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({
          type: 'LOGIN',
          payload: { ...parsed, token },
        });
        /* Also fetch latest attendance status */
        attendanceApi.getStatus().then(res => {
          if (res.success) dispatch({ type: 'SET_CHECKED_IN', payload: res.data.is_checked_in });
        });
      } catch {
        localStorage.removeItem('empay_token');
        localStorage.removeItem('empay_user');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = (data) => {
    const { token, ...rest } = data;
    localStorage.setItem('empay_token', token);
    localStorage.setItem('empay_user', JSON.stringify(rest));
    dispatch({ type: 'LOGIN', payload: data });
    /* Fetch status after login */
    attendanceApi.getStatus().then(res => {
      if (res.success) dispatch({ type: 'SET_CHECKED_IN', payload: res.data.is_checked_in });
    });
  };

  const logout = () => {
    localStorage.removeItem('empay_token');
    localStorage.removeItem('empay_user');
    dispatch({ type: 'LOGOUT' });
  };

  const toggleCheckIn = async () => {
    try {
      if (state.is_checked_in) {
        const res = await attendanceApi.checkOut();
        if (res.success) {
          dispatch({ type: 'SET_CHECKED_IN', payload: false });
          return res;
        } else if (res.error?.message?.includes('No active check-in')) {
          // If backend says no active check-in, force frontend to false
          dispatch({ type: 'SET_CHECKED_IN', payload: false });
          return { success: true, forced: true };
        }
        return res;
      } else {
        const res = await attendanceApi.checkIn();
        if (res.success) {
          dispatch({ type: 'SET_CHECKED_IN', payload: true });
          return res;
        } else if (res.error?.message?.includes('Already checked in')) {
          // If backend says already checked in, force frontend to true
          dispatch({ type: 'SET_CHECKED_IN', payload: true });
          return { success: true, forced: true };
        }
        return res;
      }
    } catch {
      return { success: false, error: { message: 'Connection error' } };
    }
  };

  const setCheckedIn = (value) => {
    dispatch({ type: 'SET_CHECKED_IN', payload: value });
  };

  const updateEmployee = (data) => {
    dispatch({ type: 'UPDATE_EMPLOYEE', payload: data });
    /* Also update localStorage */
    const saved = localStorage.getItem('empay_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.employee = { ...parsed.employee, ...data };
      localStorage.setItem('empay_user', JSON.stringify(parsed));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        toggleCheckIn,
        setCheckedIn,
        updateEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
