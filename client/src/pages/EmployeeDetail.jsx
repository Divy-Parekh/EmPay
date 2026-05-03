import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { employeeApi } from '../api/employee.api';
import { canEditEmployee, canAccess } from '../utils/roles';
import { getInitials, formatDate } from '../utils/formatters';
import ResumeTab from '../components/employees/ResumeTab';
import PrivateInfoTab from '../components/employees/PrivateInfoTab';
import SalaryInfoTab from '../components/employees/SalaryInfoTab';
import SecurityTab from '../components/employees/SecurityTab';
import { ArrowLeft, Mail, Phone, MapPin, Building2, Users, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = ['Resume', 'Private Info', 'Salary Info', 'Security'];

export default function EmployeeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('Resume');
  const [loading, setLoading] = useState(true);

  const canEdit = canEditEmployee(user?.role) || user?.id === employee?.user_id;
  const showSalary = canAccess(user?.role, 'salary_info');

  useEffect(() => { fetchEmployee(); }, [id]);

  const fetchEmployee = async () => {
    setLoading(true);
    const res = await employeeApi.getById(id);
    if (res.success) {
      // Security: If regular employee, check if they are viewing themselves
      if (user?.role === 'employee' && res.data.user_id !== user.id) {
        toast.error('You do not have permission to view this profile');
        navigate('/dashboard/attendance');
        return;
      }
      setEmployee(res.data);
    } else {
      toast.error('Failed to load employee');
    }
    setLoading(false);
  };

  const visibleTabs = TABS.filter(t => t !== 'Salary Info' || showSalary);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-[var(--bg-card-hover)] rounded" />
        <div className="card p-8"><div className="flex gap-6"><div className="w-24 h-24 rounded-full bg-[var(--bg-card-hover)]" /><div className="space-y-3 flex-1"><div className="h-6 w-48 bg-[var(--bg-card-hover)] rounded" /><div className="h-4 w-32 bg-[var(--bg-card-hover)] rounded" /></div></div></div>
      </div>
    );
  }

  if (!employee) return <div className="card p-12 text-center text-[var(--text-secondary)]">Employee not found</div>;

  return (
    <div className="animate-fade-in space-y-6">
      {canAccess(user?.role, 'employees') && (
        <button 
          onClick={() => navigate('/dashboard/employees')} 
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-black hover:font-black transition-all mb-4" 
          id="emp-detail-back"
        >
          <ArrowLeft size={16} /> Back to Employees
        </button>
      )}

      {/* Header Card */}
      <div className="card p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Avatar */}
          <div className="shrink-0">
            {employee.profile_picture ? (
              <img src={employee.profile_picture} alt="" className="w-24 h-24 rounded-2xl object-cover ring-2 ring-[var(--border-color)]" />
            ) : (
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary), #9333EA)' }}>
                {getInitials(employee.first_name, employee.last_name)}
              </div>
            )}
          </div>
          {/* Info */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{employee.first_name} {employee.last_name}</h1>
              <p className="text-[var(--text-accent)] text-sm mt-1">{employee.job_position || 'No position assigned'}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-[var(--text-secondary)]">
                {employee.email && <span className="flex items-center gap-1.5"><Mail size={14} />{employee.email}</span>}
                {employee.phone && <span className="flex items-center gap-1.5"><Phone size={14} />{employee.phone}</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-[var(--text-secondary)]"><Building2 size={14} className="text-[var(--color-primary)] shrink-0" /><div><p className="text-[10px] uppercase tracking-wider">Company</p><p className="text-[var(--text-primary)]">{employee.company_name || '—'}</p></div></div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]"><Briefcase size={14} className="text-[var(--color-primary)] shrink-0" /><div><p className="text-[10px] uppercase tracking-wider">Department</p><p className="text-[var(--text-primary)]">{employee.department || '—'}</p></div></div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]"><Users size={14} className="text-[var(--color-primary)] shrink-0" /><div><p className="text-[10px] uppercase tracking-wider">Manager</p><p className="text-[var(--text-primary)]">{employee.manager_name || '—'}</p></div></div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]"><MapPin size={14} className="text-[var(--color-primary)] shrink-0" /><div><p className="text-[10px] uppercase tracking-wider">Location</p><p className="text-[var(--text-primary)]">{employee.location || '—'}</p></div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {visibleTabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item whitespace-nowrap ${activeTab === tab ? 'active' : ''}`} id={`emp-tab-${tab.toLowerCase().replace(/\s/g,'-')}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === 'Resume' && <ResumeTab employee={employee} canEdit={canEdit} onUpdate={fetchEmployee} />}
        {activeTab === 'Private Info' && <PrivateInfoTab employee={employee} canEdit={canEdit} onUpdate={fetchEmployee} />}
        {activeTab === 'Salary Info' && showSalary && <SalaryInfoTab employeeId={employee.id} canEdit={canAccess(user?.role, 'salary_info')} />}
        {activeTab === 'Security' && <SecurityTab employee={employee} />}
      </div>
    </div>
  );
}
