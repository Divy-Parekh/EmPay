import { useState, useEffect } from 'react';
import { settingsApi } from '../api/settings.api';
import { ROLE_LABELS } from '../utils/roles';
import { Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await settingsApi.getUsers();
    if (res.success) setUsers(res.data || []);
    setLoading(false);
  };

  const handleRoleChange = async (userId, newRole) => {
    const res = await settingsApi.updateRole(userId, newRole);
    if (res.success) { toast.success('Role updated'); fetchUsers(); }
    else toast.error(res.error?.message || 'Failed to update role');
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <Shield size={24} className="text-[var(--color-primary)]" />
        <h1 className="text-2xl font-bold">User Settings</h1>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>User Name</th><th>Login ID</th><th>Email</th><th>Role</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-[var(--text-secondary)]">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-[var(--text-secondary)]">No users found</td></tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td className="font-medium">{u.name || `${u.firstName || ''} ${u.lastName || ''}`}</td>
                  <td className="text-[var(--text-secondary)]">{u.loginId}</td>
                  <td className="text-[var(--text-secondary)]">{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      className="select-field w-auto text-sm"
                      id={`role-select-${u.id}`}
                    >
                      {Object.entries(ROLE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
