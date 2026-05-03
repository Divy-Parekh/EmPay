import { useState, useEffect, useMemo } from 'react';
import { settingsApi } from '../api/settings.api';
import { ROLE_LABELS } from '../utils/roles';
import CustomSelect from '../components/common/CustomSelect';
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

  const handleManagerChange = async (userId, employeeId, managerId) => {
    if (!employeeId) {
      toast.error('User has no employee profile');
      return;
    }
    const res = await settingsApi.updateManager(userId, employeeId, managerId);
    if (res.success) { toast.success('Manager updated'); fetchUsers(); }
    else toast.error(res.error?.message || 'Failed to update manager');
  };

  const roleOptions = useMemo(() => Object.entries(ROLE_LABELS).map(([val, label]) => ({
    value: val,
    label: label
  })), []);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">User Settings</h1>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>User Name</th><th>Login ID</th><th>Role</th><th>Reporting To (Manager)</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-[var(--text-secondary)]">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-[var(--text-secondary)]">No users found</td></tr>
              ) : users.map(u => {
                const managerOptions = [
                  { value: 'none', label: 'No Manager' },
                  ...users
                    .filter(m => m.employee_id && m.employee_id !== u.employee_id)
                    .map(m => ({
                      value: m.employee_id,
                      label: `${m.first_name} ${m.last_name}`
                    }))
                ];

                return (
                  <tr key={u.id}>
                    <td className="font-medium">{u.first_name ? `${u.first_name} ${u.last_name}` : u.login_id}</td>
                    <td className="text-[var(--text-secondary)]">{u.login_id}</td>
                    <td className="min-w-[160px]">
                      <CustomSelect
                        value={u.role}
                        options={roleOptions}
                        onChange={val => handleRoleChange(u.id, val)}
                        className="text-xs"
                      />
                    </td>
                    <td className="min-w-[200px]">
                      <CustomSelect
                        value={u.manager_id || 'none'}
                        options={managerOptions}
                        onChange={val => handleManagerChange(u.id, u.employee_id, val)}
                        className="text-xs"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

