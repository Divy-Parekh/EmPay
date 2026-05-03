import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { timeoffApi } from '../api/timeoff.api';
import { fetchTimeOffData, approveRequest, rejectRequest, addRequestLocally, fetchAllBalances } from '../store/slices/timeOffSlice';
import { fetchEmployees } from '../store/slices/employeeSlice';
import { canApproveTimeOff } from '../utils/roles';
import { formatDate } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import CustomSelect from '../components/common/CustomSelect';
import CustomDatePicker from '../components/common/CustomDatePicker';
import { Plus, Check, X, Upload, Coins, PieChart as PieChartIcon, ClipboardCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import { statsApi } from '../api/stats.api';

export default function TimeOff() {
  const { user, employee } = useAuth();
  const dispatch = useDispatch();
  const isApprover = canApproveTimeOff(user?.role);
  const canAllocate = ['admin', 'hr_officer'].includes(user?.role);
  
  const { requests, balances, allBalances, types, loading } = useSelector((state) => state.timeOff);
  const { list: employees } = useSelector((state) => state.employees);
  
  const typeOptions = useMemo(() => types.map(t => ({ value: t.id, label: t.name })), [types]);
  const employeeOptions = useMemo(() => employees.map(e => ({ 
    value: e.id, 
    label: `${e.first_name} ${e.last_name} (${e.job_position || (e.role === 'admin' ? 'Admin' : 'Employee')})`
  })), [employees]);
  const rowFilterOptions = useMemo(() => [
    { value: 'all', label: 'Combined Total' },
    ...typeOptions
  ], [typeOptions]);

  const [activeSubTab, setActiveSubTab] = useState('Time Off');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showAllocModal, setShowAllocModal] = useState(false);

  /* New request form */
  const [reqForm, setReqForm] = useState({ time_off_type_id: '', start_date: '', end_date: '', allocation_days: 1, note: '' });
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Auto-calculate days based on duration
  useEffect(() => {
    if (reqForm.start_date && reqForm.end_date) {
      const start = new Date(reqForm.start_date);
      const end = new Date(reqForm.end_date);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0) {
        setReqForm(prev => ({ ...prev, allocation_days: diffDays }));
      }
    }
  }, [reqForm.start_date, reqForm.end_date]);

  /* Allocation form */
  const [allocForm, setAllocForm] = useState({ employee_id: '', time_off_type_id: '', days: 0 });

  /* State to track per-employee filter selection */
  const [rowFilters, setRowFilters] = useState({}); // { employeeId: typeId | 'all' }

  const handleRowFilterChange = (empId, typeId) => {
    setRowFilters(prev => ({ ...prev, [empId]: typeId }));
  };

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => { 
    dispatch(fetchTimeOffData()); 
    if (isApprover) loadStats();
  }, [dispatch, isApprover]);

  const loadStats = async () => {
    try {
      const res = await statsApi.getTimeOffStats();
      if (res.success) setStats(res.data);
    } catch (err) {
      console.error('Failed to load time off stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Fetch employees if they are an approver (for the dropdown)
  useEffect(() => {
    if (isApprover) {
      dispatch(fetchEmployees());
    }
  }, [dispatch, isApprover]);

  // Fetch company balances when switching to Allocation tab
  useEffect(() => {
    if (activeSubTab === 'Allocation') {
      dispatch(fetchAllBalances());
    }
  }, [dispatch, activeSubTab]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!reqForm.time_off_type_id || !reqForm.start_date || !reqForm.end_date) {
      toast.error('Fill all required fields'); return;
    }
    setSubmitting(true);
    let res;
    try {
      if (attachment) {
        const fd = new FormData();
        Object.entries(reqForm).forEach(([k, v]) => fd.append(k, v));
        fd.append('attachment', attachment);
        res = await timeoffApi.uploadRequest(fd);
      } else {
        res = await timeoffApi.createRequest(reqForm);
      }
      if (res.success) {
        toast.success('Time off request submitted'); 
        setShowNewModal(false);
        setReqForm({ time_off_type_id: '', start_date: '', end_date: '', allocation_days: 1, note: '' });
        setAttachment(null); 
        dispatch(fetchTimeOffData());
      } else toast.error(res.error?.message || 'Failed to submit');
    } catch(err) {
       toast.error('Connection error');
    }
    setSubmitting(false);
  };

  const handleApprove = async (id) => {
    try {
      await dispatch(approveRequest(id)).unwrap();
      toast.success('Approved');
    } catch(err) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await dispatch(rejectRequest(id)).unwrap();
      toast.success('Rejected');
    } catch(err) {
      toast.error('Failed to reject');
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!allocForm.employee_id || !allocForm.time_off_type_id) {
      toast.error('Please select employee and leave type');
      return;
    }
    const res = await timeoffApi.allocate(allocForm);
    if (res.success) { 
      toast.success('Leaves allocated'); 
      setShowAllocModal(false); 
      setAllocForm({ employee_id: '', time_off_type_id: '', days: 0 }); // Reset form
      dispatch(fetchAllBalances()); 
    }
    else toast.error(res.error?.message || 'Failed to allocate');
  };

  // Group balances by employee
  const groupedBalances = allBalances.reduce((acc, b) => {
    if (!acc[b.employee_id]) {
      acc[b.employee_id] = {
        name: b.employee_name,
        balances: {},
        total: { allocated: 0, used: 0, remaining: 0 }
      };
    }
    acc[b.employee_id].balances[b.time_off_type_id] = b;
    acc[b.employee_id].total.allocated += parseFloat(b.total_allocated || 0);
    acc[b.employee_id].total.used += parseFloat(b.used || 0);
    acc[b.employee_id].total.remaining += parseFloat(b.remaining || 0);
    return acc;
  }, {});

  const employeeIds = Object.keys(groupedBalances).sort((a, b) => 
    groupedBalances[a].name.localeCompare(groupedBalances[b].name)
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Time Off</h1>
        <div className="flex gap-2">
          {isApprover && (
            <div className="flex gap-1 mr-4">
              <button onClick={() => setActiveSubTab('Time Off')} className={`tab-item ${activeSubTab === 'Time Off' ? 'active' : ''}`}>Time Off</button>
              {canAllocate && (
                <button onClick={() => setActiveSubTab('Allocation')} className={`tab-item ${activeSubTab === 'Allocation' ? 'active' : ''}`}>Allocation</button>
              )}
            </div>
          )}
          <button 
            onClick={() => canAllocate && activeSubTab === 'Allocation' ? setShowAllocModal(true) : setShowNewModal(true)}
            className="btn-primary flex items-center gap-2" id="timeoff-new-btn">
            <Plus size={16} />
            {canAllocate && activeSubTab === 'Allocation' ? 'Allocate Time Off' : 'New Request'}
          </button>
        </div>
      </div>

      {/* Personal Balance Cards (Always show for current user) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map((b, i) => (
          <div key={i} className="card p-4">
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">{b.type_name || b.name}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: b.remaining > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{b.remaining ?? 0}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">of {b.total_allocated ?? 0} days</p>
          </div>
        ))}
      </div>

      {/* Approver Analytics Section */}
      {isApprover && !statsLoading && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Leave Types Distribution */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChartIcon size={18} className="text-blue-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Leave Type Breakdown</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.leaveTypeDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.leaveTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Approval Status */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <ClipboardCheck size={18} className="text-emerald-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Request Status</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.approvalStatusDistribution}
                    innerRadius={0}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {stats.approvalStatusDistribution.map((entry, index) => {
                      const color = entry.name === 'approved' ? '#10B981' : (entry.name === 'pending' ? '#F59E0B' : '#EF4444');
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="card">
        <div className="table-container">
          {activeSubTab === 'Time Off' ? (
            <table className="data-table">
              <thead>
                <tr>
                  {isApprover && <th>Employee</th>}
                  <th>Start Date</th><th>End Date</th><th>Type</th><th>Days</th><th>Status</th>
                  {isApprover && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8 text-[var(--text-secondary)]">Loading...</td></tr>
                ) : requests.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-[var(--text-secondary)]">No time off requests</td></tr>
                ) : requests.map(r => (
                  <tr key={r.id}>
                    {isApprover && <td className="font-medium">{r.employee_name}</td>}
                    <td>{formatDate(r.start_date)}</td><td>{formatDate(r.end_date)}</td>
                    <td>{r.type_name || r.time_off_type}</td><td>{r.allocation_days}</td>
                    <td><StatusBadge status={r.status} /></td>
                    {isApprover && (
                      <td>
                        {r.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(r.id)} className="p-1.5 rounded-lg bg-[rgba(16,185,129,0.15)] text-[#34D399] hover:bg-[rgba(16,185,129,0.25)] transition-colors" title="Approve"><Check size={16} /></button>
                            <button onClick={() => handleReject(r.id)} className="p-1.5 rounded-lg bg-[rgba(239,68,68,0.15)] text-[#F87171] hover:bg-[rgba(239,68,68,0.25)] transition-colors" title="Reject"><X size={16} /></button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* Allocation Tab Content - Grouped View */
            <div className="space-y-4">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th style={{ width: '200px' }}>View Leaves</th>
                    <th>Total Allocated</th>
                    <th>Used</th>
                    <th>Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-8 text-[var(--text-secondary)]">Loading...</td></tr>
                  ) : employeeIds.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-[var(--text-secondary)]">No allocations yet</td></tr>
                  ) : employeeIds.map((empId) => {
                    const empData = groupedBalances[empId];
                    const selectedFilter = rowFilters[empId] || 'all';
                    
                    let displayData;
                    if (selectedFilter === 'all') {
                      displayData = empData.total;
                    } else {
                      displayData = empData.balances[selectedFilter] || { total_allocated: 0, used: 0, remaining: 0 };
                    }

                    return (
                      <tr key={empId}>
                        <td className="font-medium">{empData.name}</td>
                        <td>
                          <CustomSelect 
                            options={rowFilterOptions}
                            value={selectedFilter}
                            onChange={(val) => handleRowFilterChange(empId, val)}
                            className="min-w-[150px]"
                          />
                        </td>
                        <td className="font-semibold">{displayData.total_allocated || displayData.allocated}</td>
                        <td className="text-[var(--text-secondary)]">{displayData.used}</td>
                        <td>
                          <span className={`font-bold ${(displayData.remaining || 0) > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                            {displayData.remaining}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Time Off Modal */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="New Time Off Request">
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div><label className="label">Employee</label><input value={`${employee?.first_name || ''} ${employee?.last_name || ''}`} disabled className="input-field opacity-60" /></div>
          <CustomSelect 
            label="Time Off Type *"
            options={typeOptions}
            value={reqForm.time_off_type_id}
            onChange={val => setReqForm({...reqForm, time_off_type_id: val})}
            placeholder="Select type..."
          />
          <div className="grid grid-cols-2 gap-3">
            <CustomDatePicker 
              label="Start Date *"
              value={reqForm.start_date}
              onChange={val => setReqForm({...reqForm, start_date: val})}
            />
            <CustomDatePicker 
              label="End Date *"
              value={reqForm.end_date}
              onChange={val => setReqForm({...reqForm, end_date: val})}
            />
          </div>
          <div>
            <label className="label">Total Days (Auto-calculated)</label>
            <div className="relative">
              <input 
                type="number" 
                min="0.5" 
                step="0.5" 
                value={reqForm.allocation_days} 
                onChange={e => setReqForm({...reqForm, allocation_days: Number(e.target.value)})} 
                className="input-field pr-16" 
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">DAYS</span>
            </div>
          </div>
          <div><label className="label">Note</label><textarea value={reqForm.note} onChange={e => setReqForm({...reqForm, note: e.target.value})} className="input-field resize-none" rows={2} /></div>
          <div>
            <label className="label">Attachment (for sick leave)</label>
            <label className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-[var(--border-color)] cursor-pointer hover:border-[var(--color-primary)] transition-colors">
              <Upload size={16} className="text-[var(--text-secondary)]" />
              <span className="text-sm text-[var(--text-secondary)]">{attachment ? attachment.name : 'Upload file...'}</span>
              <input type="file" onChange={e => setAttachment(e.target.files[0])} className="hidden" />
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowNewModal(false)} className="btn-secondary">Discard</button>
            <button type="submit" disabled={submitting} className={`btn-primary ${submitting ? 'opacity-50' : ''}`} id="timeoff-submit">
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Allocation Modal (Admin/HR) */}
      <Modal 
        isOpen={showAllocModal} 
        onClose={() => {
          setShowAllocModal(false);
          setAllocForm({ employee_id: '', time_off_type_id: '', days: 0 });
        }} 
        title="Allocate Leaves"
      >
        <form onSubmit={handleAllocate} className="space-y-4">
          <CustomSelect 
            label="Select Employee *"
            options={employeeOptions}
            value={allocForm.employee_id}
            onChange={val => setAllocForm({...allocForm, employee_id: val})}
          />
          <CustomSelect 
            label="Leave Type *"
            options={typeOptions}
            value={allocForm.time_off_type_id}
            onChange={val => setAllocForm({...allocForm, time_off_type_id: val})}
          />
          <div><label className="label">Days to Allocate</label><input type="number" value={allocForm.days} onChange={e => setAllocForm({...allocForm, days: Number(e.target.value)})} className="input-field" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => {
                setShowAllocModal(false);
                setAllocForm({ employee_id: '', time_off_type_id: '', days: 0 });
              }} 
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" id="alloc-submit">Allocate</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
