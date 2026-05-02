import { useSelector, useDispatch } from 'react-redux';
import { login as loginAction, logout as logoutAction, updateEmployeeProfile, toggleCheckIn, fetchCheckInStatus } from '../store/slices/authSlice';

export function useAuth() {
  const authState = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Map Redux state to what the components expect
  return {
    user: authState.user,
    token: authState.token,
    employee: authState.employee,
    company: authState.company,
    permissions: authState.permissions,
    is_checked_in: authState.is_checked_in,
    loading: authState.loading,
    error: authState.error,
    login: (data) => dispatch(loginAction(data)),
    logout: () => dispatch(logoutAction()),
    updateEmployee: (data) => dispatch(updateEmployeeProfile(data)),
    toggleCheckIn: async () => {
      return await dispatch(toggleCheckIn()).unwrap();
    },
    fetchCheckInStatus: () => dispatch(fetchCheckInStatus()),
  };
}
