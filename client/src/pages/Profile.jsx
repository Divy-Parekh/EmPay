import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { employee } = useAuth();

  if (!employee?.id) {
    return (
      <div className="card p-12 text-center text-[var(--text-secondary)]">
        Profile not available
      </div>
    );
  }

  /* Redirect to the user's own employee detail page */
  return <Navigate to={`/dashboard/employees/${employee.id}`} replace />;
}
