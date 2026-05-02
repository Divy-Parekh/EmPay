import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { timeoffApi } from '../api/timeoff.api';
import { fetchTimeOffData, approveRequest, rejectRequest, addRequestLocally, fetchAllBalances } from '../store/slices/timeOffSlice';
import { fetchEmployees } from '../store/slices/employeeSlice';
import { canApproveTimeOff } from '../utils/roles';
import { formatDate } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { Plus, Check, X, Upload, Coins } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TimeOff() {
  const { user, employee } = useAuth();
  const dispatch = useDispatch();
  const isApprover = canApproveTimeOff(user?.role);
  const canAllocate = ['admin', 'hr_officer'].includes(user?.role);
  
  const { requests, balances, allBalances, types, loading } = useSelector((state) => state.timeOff);
  const { list: employees } = useSelector((state) => state.employees);
  
  const [activeSubTab, setActiveSubTab] = useState('Time Off');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showAllocModal, setShowAllocModal] = useState(false);

  /* New request form */
  const [reqForm, setReqForm] = useState({ time_off_type_id: '', start_date: '', end_date: '', allocation_days: 1, note: '' });
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  /* Allocation form */
  const [allocForm, setAllocForm] = useState({ employee_id: '', time_off_type_id: '', days: 0 });

  /* Allocation Filter */
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => { 
    dispatch(fetchTimeOffData()); 
  }, [dispatch]);

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

  // State to track per-employee filter selection
  const [rowFilters, setRowFilters] = useState({}); // { employeeId: typeId | 'all' }

  const handleRowFilterChange = (empId, typeId) => {
    setRowFilters(prev => ({ ...prev, [empId]: typeId }));
  };

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
                          <select 
                            value={selectedFilter}
                            onChange={(e) => handleRowFilterChange(empId, e.target.value)}
                            className="select-field text-xs py-1 h-auto min-w-[120px]"
                          >
                            <option value="all">Combined Total</option>
                            {types.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
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
          <div><label className="label">Time Off Type *</label>
            <select value={reqForm.time_off_type_id} onChange={e => setReqForm({...reqForm, time_off_type_id: e.target.value})} className="select-field">
              <option value="">Select type...</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start Date *</label><input type="date" value={reqForm.start_date} onChange={e => setReqForm({...reqForm, start_date: e.target.value})} className="input-field" /></div>
            <div><label className="label">End Date *</label><input type="date" value={reqForm.end_date} onChange={e => setReqForm({...reqForm, end_date: e.target.value})} className="input-field" /></div>
          </div>
          <div><label className="label">Days</label><input type="number" min="0.5" step="0.5" value={reqForm.allocation_days} onChange={e => setReqForm({...reqForm, allocation_days: Number(e.target.value)})} className="input-field" /></div>
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
          <div>
            <label className="label">Select Employee *</label>
            <select 
              value={allocForm.employee_id} 
              onChange={e => setAllocForm({...allocForm, employee_id: e.target.value})} 
              className="select-field"
            >
              <option value="">Select employee...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.job_position || (emp.role === 'admin' ? 'Admin' : 'Employee')})
                </option>
              ))}
            </select>
          </div>
          <div><label className="label">Leave Type *</label>
            <select value={allocForm.time_off_type_id} onChange={e => setAllocForm({...allocForm, time_off_type_id: e.target.value})} className="select-field">
              <option value="">Select type...</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
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
