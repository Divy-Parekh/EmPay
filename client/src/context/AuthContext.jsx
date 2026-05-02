import { createContext, useReducer, useEffect } from 'react';
import { attendanceApi } from '../api/attendance.api';

export const AuthContext = createContext(null);

const initialState = {
  user: null,
  employee: null,
  company: null,
  permissions: null,
  token: null,
  isCheckedIn: false,
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
      return { ...state, isCheckedIn: action.payload };
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
  };

  const logout = () => {
    localStorage.removeItem('empay_token');
    localStorage.removeItem('empay_user');
    dispatch({ type: 'LOGOUT' });
  };

  const toggleCheckIn = async () => {
    try {
      if (state.isCheckedIn) {
        const res = await attendanceApi.checkOut();
        if (res.success) dispatch({ type: 'SET_CHECKED_IN', payload: false });
        return res;
      } else {
        const res = await attendanceApi.checkIn();
        if (res.success) dispatch({ type: 'SET_CHECKED_IN', payload: true });
        return res;
      }
    } catch {
      return { success: false };
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
