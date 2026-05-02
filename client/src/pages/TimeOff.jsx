import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { timeoffApi } from '../api/timeoff.api';
import { canApproveTimeOff } from '../utils/roles';
import { formatDate } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { Plus, Check, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TimeOff() {
  const { user, employee } = useAuth();
  const isApprover = canApproveTimeOff(user?.role);
  const [activeSubTab, setActiveSubTab] = useState('Time Off');
  const [requests, setRequests] = useState([]);
  const [balances, setBalances] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showAllocModal, setShowAllocModal] = useState(false);

  /* New request form */
  const [reqForm, setReqForm] = useState({ time_off_type_id: '', start_date: '', end_date: '', allocation_days: 1, note: '' });
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  /* Allocation form */
  const [allocForm, setAllocForm] = useState({ employee_id: '', time_off_type_id: '', days: 0 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [reqRes, balRes, typeRes] = await Promise.all([
      timeoffApi.getRequests(), timeoffApi.getBalances(), timeoffApi.getTypes()
    ]);
    if (reqRes.success) setRequests(reqRes.data || []);
    if (balRes.success) setBalances(balRes.data || []);
    if (typeRes.success) setTypes(typeRes.data || []);
    setLoading(false);
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!reqForm.time_off_type_id || !reqForm.start_date || !reqForm.end_date) {
      toast.error('Fill all required fields'); return;
    }
    setSubmitting(true);
    let res;
    if (attachment) {
      const fd = new FormData();
      Object.entries(reqForm).forEach(([k, v]) => fd.append(k, v));
      fd.append('attachment', attachment);
      res = await timeoffApi.uploadRequest(fd);
    } else {
      res = await timeoffApi.createRequest(reqForm);
    }
    setSubmitting(false);
    if (res.success) {
      toast.success('Time off request submitted'); setShowNewModal(false);
      setReqForm({ time_off_type_id: '', start_date: '', end_date: '', allocation_days: 1, note: '' });
      setAttachment(null); fetchData();
    } else toast.error(res.error?.message || 'Failed to submit');
  };

  const handleApprove = async (id) => {
    const res = await timeoffApi.approveRequest(id);
    if (res.success) { toast.success('Approved'); fetchData(); }
    else toast.error('Failed to approve');
  };

  const handleReject = async (id) => {
    const res = await timeoffApi.rejectRequest(id);
    if (res.success) { toast.success('Rejected'); fetchData(); }
    else toast.error('Failed to reject');
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    const res = await timeoffApi.allocate(allocForm);
    if (res.success) { toast.success('Leaves allocated'); setShowAllocModal(false); fetchData(); }
    else toast.error(res.error?.message || 'Failed to allocate');
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Time Off</h1>
        <div className="flex gap-2">
          {isApprover && (
            <div className="flex gap-1 mr-4">
              {['Time Off', 'Allocation'].map(t => (
                <button key={t} onClick={() => setActiveSubTab(t)} className={`tab-item ${activeSubTab === t ? 'active' : ''}`}>{t}</button>
              ))}
            </div>
          )}
          <button onClick={() => isApprover && activeSubTab === 'Allocation' ? setShowAllocModal(true) : setShowNewModal(true)}
            className="btn-primary flex items-center gap-2" id="timeoff-new-btn">
            <Plus size={16} />New
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map((b, i) => (
          <div key={i} className="card p-4">
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">{b.type_name || b.name}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: b.remaining > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{b.remaining ?? 0}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">of {b.total_allocated ?? 0} days</p>
          </div>
        ))}
      </div>

      {/* Requests Table */}
      <div className="card">
        <div className="table-container">
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
      <Modal isOpen={showAllocModal} onClose={() => setShowAllocModal(false)} title="Allocate Leaves">
        <form onSubmit={handleAllocate} className="space-y-4">
          <div><label className="label">Employee ID</label><input value={allocForm.employee_id} onChange={e => setAllocForm({...allocForm, employee_id: e.target.value})} className="input-field" placeholder="Employee UUID" /></div>
          <div><label className="label">Leave Type</label>
            <select value={allocForm.time_off_type_id} onChange={e => setAllocForm({...allocForm, time_off_type_id: e.target.value})} className="select-field">
              <option value="">Select type...</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div><label className="label">Days to Allocate</label><input type="number" value={allocForm.days} onChange={e => setAllocForm({...allocForm, days: Number(e.target.value)})} className="input-field" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAllocModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" id="alloc-submit">Allocate</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
