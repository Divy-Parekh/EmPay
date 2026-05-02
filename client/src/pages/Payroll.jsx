import { useState, useEffect } from 'react';
import { payrollApi } from '../api/payroll.api';
import { formatCurrency, formatDate } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import PayslipDetail from '../components/payroll/PayslipDetail';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AlertTriangle, Play, CheckCircle, XCircle, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Payroll() {
  const [subTab, setSubTab] = useState('Dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [payruns, setPayruns] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [costView, setCostView] = useState('monthly');
  const [countView, setCountView] = useState('monthly');

  /* Payrun creation */
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (subTab === 'Dashboard') fetchDashboard();
    else fetchPayruns();
  }, [subTab]);

  const fetchDashboard = async () => {
    setLoading(true);
    const res = await payrollApi.getDashboard();
    if (res.success) setDashboard(res.data);
    setLoading(false);
  };

  const fetchPayruns = async () => {
    setLoading(true);
    const res = await payrollApi.getPayruns();
    if (res.success) setPayruns(res.data || []);
    setLoading(false);
  };

  const handleCreatePayrun = async () => {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const name = `Payrun ${now.toLocaleString('en', { month: 'short' })} ${now.getFullYear()}`;

    setCreating(true);
    const res = await payrollApi.createPayrun({ name, periodStart, periodEnd });
    if (res.success) {
      toast.success('Payrun created');
      const computeRes = await payrollApi.computePayrun(res.data.id);
      if (computeRes.success) toast.success('Payslips generated');
      else toast.error('Failed to compute payslips');
      fetchPayruns();
    } else toast.error(res.error?.message || 'Failed');
    setCreating(false);
  };

  const handleValidate = async (id) => {
    const res = await payrollApi.validatePayrun(id);
    if (res.success) { toast.success('Payrun validated'); fetchPayruns(); }
    else toast.error('Failed to validate');
  };

  const handleCancel = async (id) => {
    const res = await payrollApi.cancelPayrun(id);
    if (res.success) { toast.success('Payrun cancelled'); fetchPayruns(); }
    else toast.error('Failed to cancel');
  };

  const handlePayslipClick = async (payslipId) => {
    const res = await payrollApi.getPayslip(payslipId);
    if (res.success) setSelectedPayslip(res.data);
  };

  if (selectedPayslip) {
    return <PayslipDetail payslip={selectedPayslip} onBack={() => { setSelectedPayslip(null); fetchPayruns(); }} />;
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
            {(dashboard.warnings?.missingBankAccount?.length > 0 || dashboard.warnings?.missingManager?.length > 0) && (
              <div className="card p-5 border-l-4 border-l-[var(--color-warning)]">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-warning)] mb-3"><AlertTriangle size={16} />Warnings</h3>
                {dashboard.warnings.missingBankAccount?.length > 0 && (
                  <p className="text-sm text-[var(--text-secondary)] mb-1">⚠️ {dashboard.warnings.missingBankAccount.length} employee(s) without Bank Account</p>
                )}
                {dashboard.warnings.missingManager?.length > 0 && (
                  <p className="text-sm text-[var(--text-secondary)]">⚠️ {dashboard.warnings.missingManager.length} employee(s) without Manager</p>
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
                  <span className="text-xs text-[var(--text-secondary)]">{p.payslipCount} payslips</span>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">Employer Cost</h3>
                  <div className="flex gap-1">{['monthly', 'yearly'].map(v => (
                    <button key={v} onClick={() => setCostView(v)} className={`text-xs px-2 py-1 rounded ${costView === v ? 'bg-[rgba(124,58,237,0.2)] text-white' : 'text-[var(--text-secondary)]'}`}>{v}</button>
                  ))}</div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dashboard.employerCost?.[costView] || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" />
                    <XAxis dataKey={costView === 'monthly' ? 'month' : 'year'} tick={chartStyle} />
                    <YAxis tick={chartStyle} />
                    <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, color: '#F8FAFC' }} />
                    <Bar dataKey="cost" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">Employee Count</h3>
                  <div className="flex gap-1">{['monthly', 'yearly'].map(v => (
                    <button key={v} onClick={() => setCountView(v)} className={`text-xs px-2 py-1 rounded ${countView === v ? 'bg-[rgba(124,58,237,0.2)] text-white' : 'text-[var(--text-secondary)]'}`}>{v}</button>
                  ))}</div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dashboard.employeeCount?.[countView] || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" />
                    <XAxis dataKey={countView === 'monthly' ? 'month' : 'year'} tick={chartStyle} />
                    <YAxis tick={chartStyle} />
                    <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, color: '#F8FAFC' }} />
                    <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )
      ) : (
        /* Payrun tab */
        <div className="space-y-4">
          <div className="flex gap-3">
            <button onClick={handleCreatePayrun} disabled={creating} className={`btn-primary flex items-center gap-2 ${creating ? 'opacity-50' : ''}`} id="payrun-create">
              <Play size={16} />{creating ? 'Creating...' : 'Payrun'}
            </button>
          </div>

          {loading ? <div className="card p-12 text-center text-[var(--text-secondary)]">Loading...</div> : payruns.length === 0 ? (
            <div className="card p-12 text-center text-[var(--text-secondary)]">No payruns yet. Click "Payrun" to generate payslips.</div>
          ) : payruns.map(pr => (
            <div key={pr.id} className="card p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-semibold">{pr.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">{formatDate(pr.periodStart)} — {formatDate(pr.periodEnd)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={pr.status} />
                  {pr.status === 'computed' && <button onClick={() => handleValidate(pr.id)} className="btn-success flex items-center gap-1 text-sm px-3 py-1.5"><CheckCircle size={14} />Validate</button>}
                  {pr.status !== 'cancelled' && pr.status !== 'validated' && <button onClick={() => handleCancel(pr.id)} className="btn-danger flex items-center gap-1 text-sm px-3 py-1.5"><XCircle size={14} />Cancel</button>}
                </div>
              </div>

              {pr.payslips && pr.payslips.length > 0 && (
                <div className="table-container">
                  <table className="data-table">
                    <thead><tr><th>Pay Period</th><th>Employee</th><th>Employer Cost</th><th>Basic</th><th>Gross</th><th>Net</th><th>Status</th></tr></thead>
                    <tbody>
                      {pr.payslips.map(ps => (
                        <tr key={ps.id} onClick={() => handlePayslipClick(ps.id)} className="cursor-pointer">
                          <td className="text-xs">{formatDate(ps.periodStart)} – {formatDate(ps.periodEnd)}</td>
                          <td className="font-medium">{ps.employeeName}</td>
                          <td>{formatCurrency(ps.employerCost)}</td>
                          <td>{formatCurrency(ps.basicAmount)}</td>
                          <td>{formatCurrency(ps.grossWage)}</td>
                          <td className="font-semibold text-[var(--color-success)]">{formatCurrency(ps.netWage)}</td>
                          <td><StatusBadge status={ps.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
