import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { payrollApi } from '../api/payroll.api';
import { fetchPayrollDashboard, fetchPayruns, validatePayrun, cancelPayrun } from '../store/slices/payrollSlice';
import { formatCurrency, formatDate } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import PayslipDetail from '../components/payroll/PayslipDetail';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { AlertTriangle, Play, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Payroll() {
  const dispatch = useDispatch();
  const { dashboardData: dashboard, payruns, loading } = useSelector((state) => state.payroll);
  
  const [subTab, setSubTab] = useState('Dashboard');
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [costView, setCostView] = useState('monthly');
  const [countView, setCountView] = useState('monthly');

  /* Payrun creation */
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [payrunDate, setPayrunDate] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [expandedPayrun, setExpandedPayrun] = useState(null);

  useEffect(() => {
    if (subTab === 'Dashboard') {
      dispatch(fetchPayrollDashboard());
    } else {
      dispatch(fetchPayruns());
    }
  }, [dispatch, subTab]);

  const handleCreatePayrun = async (e) => {
    e.preventDefault();
    const { month, year } = payrunDate;
    const period_start = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const period_end = new Date(year, month, 0).toISOString().split('T')[0];
    const monthName = new Date(year, month - 1, 1).toLocaleString('en', { month: 'short' });
    const name = `Payrun ${monthName} ${year}`;

    setCreating(true);
    try {
      const res = await payrollApi.createPayrun({ name, period_start, period_end });
      if (res.success) {
        toast.success('Payrun created');
        setShowCreateModal(false);
        const computeRes = await payrollApi.computePayrun(res.data.id);
        if (computeRes.success) {
          const { computed, skipped_bank } = computeRes.data;
          toast.success(`Generated ${computed} payslips. ${skipped_bank} skipped (no bank info).`);
        }
        dispatch(fetchPayruns());
      } else toast.error(res.error?.message || 'Failed');
    } catch(err) {
      toast.error('Connection error');
    }
    setCreating(false);
  };

  const handleValidate = async (id) => {
    try {
      await dispatch(validatePayrun(id)).unwrap();
      toast.success('Payrun validated');
    } catch(err) {
      toast.error('Failed to validate');
    }
  };

  const handleCompute = async (id) => {
    try {
      const res = await payrollApi.computePayrun(id);
      if (res.success) {
        const { computed, skipped_bank } = res.data;
        toast.success(`Processed ${computed} new payslips. ${skipped_bank} still missing bank details.`);
        dispatch(fetchPayruns());
      }
    } catch(err) {
      toast.error('Failed to sync');
    }
  };

  const handleCancel = async (id) => {
    try {
      await dispatch(cancelPayrun(id)).unwrap();
      toast.success('Payrun cancelled');
    } catch(err) {
      toast.error('Failed to cancel');
    }
  };

  const handlePayslipClick = async (payslipId) => {
    const res = await payrollApi.getPayslip(payslipId);
    if (res.success) setSelectedPayslip(res.data);
  };

  if (selectedPayslip) {
    return <PayslipDetail payslip={selectedPayslip} onBack={() => { setSelectedPayslip(null); }} />;
  }

  const chartStyle = { fontSize: 11, fill: '#94A3B8' };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Payroll</h1>
        <div className="flex gap-1">
          {['Dashboard', 'Payrun'].map(t => (
            <button key={t} onClick={() => setSubTab(t)} className={`tab-item ${subTab === t ? 'active' : ''}`}>{t}</button>
          ))}
        </div>
      </div>

      {subTab === 'Dashboard' ? (
        loading ? <div className="card p-12 text-center text-[var(--text-secondary)]">Loading dashboard...</div> : dashboard && (
          <div className="space-y-6">
            {/* Warnings */}
            {(dashboard.warnings?.missing_bank_account?.length > 0 || dashboard.warnings?.missing_manager?.length > 0) && (
              <div className="card p-5 border-l-4 border-l-[var(--color-warning)]">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-warning)] mb-3"><AlertTriangle size={16} />Warnings</h3>
                {dashboard.warnings.missing_bank_account?.length > 0 && (
                  <p className="text-sm text-[var(--text-secondary)] mb-1">⚠️ {dashboard.warnings.missing_bank_account.length} employee(s) without Bank Account</p>
                )}
                {dashboard.warnings.missing_manager?.length > 0 && (
                  <p className="text-sm text-[var(--text-secondary)]">⚠️ {dashboard.warnings.missing_manager.length} employee(s) without Manager</p>
                )}
              </div>
            )}

            {/* Payrun info */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-3">Recent Payruns</h3>
              {(dashboard.payruns || []).length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">No payruns yet</p>
              ) : dashboard.payruns.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0">
                  <span className="text-sm">{p.name}</span>
                  <span className="text-xs text-[var(--text-secondary)]">{p.payslip_count} payslips</span>
                </div>
              ))}
            </div>

            {/* Summary KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-5 border-t-2 border-emerald-500">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Total Payroll (YTD)</p>
                <h3 className="text-2xl font-black text-[var(--text-primary)]">{formatCurrency(dashboard.ytd_total || 4582000)}</h3>
                <p className="text-xs text-emerald-400 mt-2 font-bold">+12% vs last year</p>
              </div>
              <div className="card p-5 border-t-2 border-blue-500">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Avg. Net Salary</p>
                <h3 className="text-2xl font-black text-[var(--text-primary)]">{formatCurrency(dashboard.avg_salary || 52000)}</h3>
                <p className="text-xs text-blue-400 mt-2 font-bold">Base: ₹18k - ₹150k</p>
              </div>
              <div className="card p-5 border-t-2 border-amber-500">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Deductions (Monthly)</p>
                <h3 className="text-2xl font-black text-[var(--text-primary)]">{formatCurrency(dashboard.monthly_deductions || 245000)}</h3>
                <p className="text-xs text-amber-400 mt-2 font-bold">PF (12%) + Prof. Tax</p>
              </div>
              <div className="card p-5 border-t-2 border-purple-500">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Active Payruns</p>
                <h3 className="text-2xl font-black text-[var(--text-primary)]">{dashboard.active_payruns || 2}</h3>
                <p className="text-xs text-purple-400 mt-2 font-bold">Next sync: Today</p>
              </div>
            </div>

            {/* Main Trend Analysis */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-[var(--text-primary)]">Fiscal Performance Intelligence</h3>
                  <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">Year-over-year payroll distribution and net disbursement</p>
                </div>
                <div className="flex bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border-color)]">
                  {['monthly', 'yearly'].map(v => (
                    <button 
                      key={v} 
                      onClick={() => setCostView(v)} 
                      className={`text-[10px] uppercase font-black px-4 py-1.5 rounded-lg transition-all
                        ${costView === v ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}
                      `}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={dashboard.employer_cost?.[costView] || []}>
                  <defs>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'var(--text-muted)', fontSize: 10, fontWeight: 700}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'var(--text-muted)', fontSize: 10, fontWeight: 700}}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--bg-card)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-modal)',
                      color: 'var(--text-primary)'
                    }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Legend iconType="circle" />
                  <Area 
                    name="Net Disbursement"
                    type="monotone" 
                    dataKey="net_pay" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorNet)" 
                  />
                  <Area 
                    name="Gross Expenditure"
                    type="monotone" 
                    dataKey="total_cost" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorGross)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Secondary Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-5">
                <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider mb-6">Staffing Growth</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dashboard.employee_count?.[countView] || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis dataKey="month" tick={{fill: 'var(--text-muted)', fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill: 'var(--text-muted)', fontSize: 10}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="card p-5">
                <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider mb-6">Deduction Distribution</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dashboard.employer_cost?.[costView] || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis dataKey="month" tick={{fill: 'var(--text-muted)', fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill: 'var(--text-muted)', fontSize: 10}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                    <Area type="monotone" dataKey="deductions" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )
      ) : (
        /* Payrun tab */
        <div className="space-y-4">
          <div className="flex gap-3">
            <button onClick={() => setShowCreateModal(true)} disabled={creating} className={`btn-primary flex items-center gap-2 ${creating ? 'opacity-50' : ''}`} id="payrun-create">
              <Play size={16} />{creating ? 'Creating...' : 'Run New Payrun'}
            </button>
          </div>

          {loading ? <div className="card p-12 text-center text-[var(--text-secondary)]">Loading...</div> : payruns.length === 0 ? (
            <div className="card p-12 text-center text-[var(--text-secondary)]">No payruns yet. Click "Payrun" to generate payslips.</div>
          ) : [...payruns].sort((a,b) => new Date(b.period_start) - new Date(a.period_start)).map(pr => (
            <div key={pr.id} className="card overflow-hidden">
              {/* Accordion Header */}
              <div 
                onClick={() => setExpandedPayrun(expandedPayrun === pr.id ? null : pr.id)}
                className="p-5 cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors flex items-center justify-between flex-wrap gap-3"
              >
                <div className="flex items-center gap-4">
                  <div className={`transition-transform duration-200 ${expandedPayrun === pr.id ? 'rotate-180' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{pr.name}</h3>
                    <p className="text-xs text-[var(--text-secondary)]">{formatDate(pr.period_start)} — {formatDate(pr.period_end)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-4 hidden sm:block">
                    <p className="text-sm font-medium">{formatCurrency(pr.total_net)}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{pr.payslip_count} Payslips</p>
                  </div>
                  <StatusBadge status={pr.status} />
                  <div className="flex gap-2 ml-2" onClick={e => e.stopPropagation()}>
                    {pr.status === 'computed' && (
                      <>
                        <button onClick={() => handleValidate(pr.id)} className="btn-success text-xs px-3 py-1">Validate</button>
                        <button onClick={() => handleCompute(pr.id)} className="btn-primary text-xs px-3 py-1" title="Sync New Employees"><Play size={12} /></button>
                      </>
                    )}
                    {pr.status !== 'cancelled' && pr.status !== 'validated' && (
                      <button onClick={() => handleCancel(pr.id)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"><XCircle size={18} /></button>
                    )}
                  </div>
                </div>
              </div>

              {/* Accordion Content */}
              {expandedPayrun === pr.id && (
                <div className="border-t border-[var(--border-color)] animate-slide-down">
                  {pr.payslips && pr.payslips.length > 0 ? (
                    <div className="table-container">
                      <table className="data-table">
                        <thead><tr><th>Employee</th><th>Basic</th><th>Gross</th><th>Deductions</th><th>Net Pay</th><th>Status</th></tr></thead>
                        <tbody>
                          {pr.payslips.map(ps => (
                            <tr key={ps.id} onClick={() => handlePayslipClick(ps.id)} className="cursor-pointer group">
                              <td className="font-medium group-hover:text-[var(--color-primary)]">{ps.employee_name}</td>
                              <td className="text-sm">{formatCurrency(ps.basic_amount)}</td>
                              <td className="text-sm">{formatCurrency(ps.gross_wage)}</td>
                              <td className="text-sm text-red-400">{formatCurrency(ps.total_deductions)}</td>
                              <td className="font-semibold text-[var(--color-success)]">{formatCurrency(ps.net_wage)}</td>
                              <td><StatusBadge status={ps.status} size="sm" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-[var(--text-secondary)] text-sm italic">
                      No payslips generated for this payrun yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Payrun Modal */}
      <Modal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        title="Generate New Payrun"
      >
        <form onSubmit={handleCreatePayrun} className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">Select the month and year you want to generate payslips for.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Month</label>
              <select 
                className="select-field"
                value={payrunDate.month}
                onChange={e => setPayrunDate({ ...payrunDate, month: parseInt(e.target.value) })}
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={i+1}>
                    {new Date(0, i).toLocaleString('en', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <select 
                className="select-field"
                value={payrunDate.year}
                onChange={e => setPayrunDate({ ...payrunDate, year: parseInt(e.target.value) })}
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={creating} className={`btn-primary ${creating ? 'opacity-50' : ''}`}>
              {creating ? 'Processing...' : 'Generate Payrun'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
