import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardLayout from './components/layout/DashboardLayout';
import Employees from './pages/Employees';
import EmployeeDetail from './pages/EmployeeDetail';
import Attendance from './pages/Attendance';
import TimeOff from './pages/TimeOff';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import CompanyDetails from './pages/CompanyDetails';
import Notifications from './pages/Notifications';

/* Route guard — redirects to /login if unauthenticated */
function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return null; // or a loading spinner
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

/* Role-based route guard */
function RoleRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) {
    // If not allowed, redirect to a safe page like attendance or profile
    return <Navigate to="/dashboard/attendance" replace />;
  }
  return children;
}

export default function App() {
  const { user, company } = useAuth();

  // Dynamically update Tab Title and Favicon
  useEffect(() => {
    if (company?.name) {
      document.title = `${company.name} | EmPay HRMS`;
    } else {
      document.title = 'EmPay | Smart HRMS';
    }

    if (company?.logo_url) {
      const serverUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
      let favicon = document.querySelector('link[rel="icon"]');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(favicon);
      }
      favicon.href = `${serverUrl}${company.logo_url}`;
    }
  }, [company]);

  // Define the default tab based on user role
  const defaultTab = user?.role === 'employee' ? 'attendance' : 'employees';

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected dashboard routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={defaultTab} replace />} />

        <Route
          path="employees"
          element={
            <RoleRoute allowedRoles={['admin', 'hr_officer', 'payroll_officer']}>
              <Employees />
            </RoleRoute>
          }
        />
        <Route
          path="employees/:id"
          element={
            <RoleRoute allowedRoles={['admin', 'hr_officer', 'payroll_officer', 'employee']}>
              <EmployeeDetail />
            </RoleRoute>
          }
        />

        <Route path="attendance" element={<Attendance />} />
        <Route path="time-off" element={<TimeOff />} />

        <Route
          path="payroll"
          element={
            <RoleRoute allowedRoles={['admin', 'payroll_officer']}>
              <Payroll />
            </RoleRoute>
          }
        />
        <Route
          path="reports"
          element={
            <RoleRoute allowedRoles={['admin', 'payroll_officer']}>
              <Reports />
            </RoleRoute>
          }
        />
        <Route
          path="settings"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <Settings />
            </RoleRoute>
          }
        />
        <Route
          path="company"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <CompanyDetails />
            </RoleRoute>
          }
        />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
