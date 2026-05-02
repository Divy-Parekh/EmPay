import { useSelector, useDispatch } from 'react-redux';
import { login, logout, updateEmployeeProfile, toggleCheckIn, fetchCheckInStatus } from '../store/slices/authSlice';

export function useAuth() {
  const authState = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  return {
    ...authState,
    login: (data) => dispatch(login(data)),
    logout: () => dispatch(logout()),
    updateEmployee: (data) => dispatch(updateEmployeeProfile(data)),
    toggleCheckIn: async () => {
      return await dispatch(toggleCheckIn(authState.is_checked_in)).unwrap();
    },
    fetchCheckInStatus: () => dispatch(fetchCheckInStatus()),
  };
}
