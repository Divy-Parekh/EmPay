import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { fetchEmployees, createEmployee } from '../store/slices/employeeSlice';
import { canEditEmployee } from '../utils/roles';
import { getInitials } from '../utils/formatters';
import SearchBar from '../components/common/SearchBar';
import Modal from '../components/common/Modal';
import { UserPlus, Plane } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Employees() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { list: employees, loading } = useSelector((state) => state.employees);
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  /* New employee form */
  const [newEmp, setNewEmp] = useState({ 
    first_name: '', 
    last_name: '', 
    email: '', 
    role: 'employee', 
    job_position: '' 
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  const filteredEmployees = employees.filter((emp) => {
    const q = search.toLowerCase();
    return (
      emp.first_name?.toLowerCase().includes(q) ||
      emp.last_name?.toLowerCase().includes(q) ||
      emp.email?.toLowerCase().includes(q) ||
      emp.job_position?.toLowerCase().includes(q) ||
      emp.department?.toLowerCase().includes(q)
    );
  });

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!newEmp.first_name || !newEmp.last_name || !newEmp.email) {
      toast.error('All fields are required');
      return;
    }
    setCreating(true);
    try {
      const res = await dispatch(createEmployee(newEmp)).unwrap();
      toast.success(res?.message || 'Employee created! Credentials sent via email.');
      setShowNewModal(false);
      setNewEmp({ first_name: '', last_name: '', email: '', role: 'employee', job_position: '' });
      dispatch(fetchEmployees()); // Refresh list to get full joined object
    } catch (err) {
      toast.error(err?.message || 'Failed to create employee');
    } finally {
      setCreating(false);
    }
  };

  /* Status indicator component */
  const StatusIndicator = ({ status, isCheckedIn, workHours }) => {
    if (status === 'on_leave') {
      return <span className="text-xs font-medium px-2 py-1 rounded bg-[rgba(59,130,246,0.15)] text-[#3B82F6] flex items-center gap-1"><Plane size={12}/> On Leave</span>;
    }
    
    const hoursText = parseFloat(workHours) > 0 ? ` (${parseFloat(workHours).toFixed(1)}h)` : '';

    if (isCheckedIn) {
      return (
        <span className="text-xs font-medium px-2 py-1 rounded bg-[rgba(16,185,129,0.15)] text-[#34D399] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: 'var(--color-success)', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }} />
          Present{hoursText}
        </span>
      );
    }

    if (status === 'present') {
      return (
        <span className="text-xs font-medium px-2 py-1 rounded bg-[rgba(16,185,129,0.15)] text-[#34D399]">
          Present{hoursText}
        </span>
      );
    }
    
    /* absent / default */
    return (
      <span className="text-xs font-medium px-2 py-1 rounded bg-[rgba(239,68,68,0.15)] text-[#F87171]">
        Absent
      </span>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Employees</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {employees.length} team member{employees.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search employees..."
          />
          {canEditEmployee(user?.role) && (
            <button
              onClick={() => setShowNewModal(true)}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
              id="emp-new-btn"
            >
              <UserPlus size={16} />
              New
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[var(--bg-card-hover)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[var(--bg-card-hover)] rounded w-2/3" />
                  <div className="h-3 bg-[var(--bg-card-hover)] rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-[var(--text-secondary)]">
            {search ? 'No employees match your search' : 'No employees yet. Create your first team member!'}
          </div>
        </div>
      ) : (
        /* Employee cards grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEmployees.map((emp, index) => (
            <div
              key={emp.id}
              onClick={() => navigate(`/dashboard/employees/${emp.id}`)}
              className={`card card-clickable p-5 animate-fade-in-up stagger-${(index % 6) + 1}`}
              id={`emp-card-${emp.id}`}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                {emp.profile_picture ? (
                  <img
                    src={emp.profile_picture}
                    alt={`${emp.first_name} ${emp.last_name}`}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-[var(--border-color)]"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${
                        ['#7C3AED', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'][index % 5]
                      }, ${
                        ['#9333EA', '#BE185D', '#2563EB', '#059669', '#D97706'][index % 5]
                      })`,
                    }}
                  >
                    {getInitials(emp.first_name, emp.last_name)}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {emp.first_name} {emp.last_name}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                    {emp.job_position || 'No position'}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                    {emp.department || ''}
                  </p>
                </div>

                {/* Status indicator */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusIndicator 
                    status={emp.attendance_status || 'absent'} 
                    isCheckedIn={emp.is_checked_in} 
                    workHours={emp.today_work_hours}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Employee Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Add New Employee"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="new-emp-fname">First Name *</label>
              <input
                id="new-emp-fname"
                value={newEmp.first_name}
                onChange={(e) => setNewEmp({ ...newEmp, first_name: e.target.value })}
                placeholder="Jane"
                className="input-field"
              />
            </div>
            <div>
              <label className="label" htmlFor="new-emp-lname">Last Name *</label>
              <input
                id="new-emp-lname"
                value={newEmp.last_name}
                onChange={(e) => setNewEmp({ ...newEmp, last_name: e.target.value })}
                placeholder="Smith"
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="new-emp-email">Email *</label>
            <input
              id="new-emp-email"
              type="email"
              value={newEmp.email}
              onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
              placeholder="jane@company.com"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="new-emp-role">Role *</label>
              <select
                id="new-emp-role"
                value={newEmp.role}
                onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                className="select-field"
              >
                <option value="employee">Employee</option>
                <option value="hr_officer">HR Officer</option>
                <option value="payroll_officer">Payroll Officer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="new-emp-position">Job Position</label>
              <input
                id="new-emp-position"
                value={newEmp.job_position}
                onChange={(e) => setNewEmp({ ...newEmp, job_position: e.target.value })}
                placeholder="Software Engineer"
                className="input-field"
              />
            </div>
          </div>

          <div className="bg-[rgba(124,58,237,0.08)] rounded-lg p-3 border border-[rgba(124,58,237,0.2)]">
            <p className="text-xs text-[var(--text-secondary)]">
              📧 A Login ID and temporary password will be auto-generated and sent to the employee's email.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowNewModal(false)} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className={`btn-primary ${creating ? 'opacity-50' : ''}`}
              id="new-emp-submit"
            >
              {creating ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
