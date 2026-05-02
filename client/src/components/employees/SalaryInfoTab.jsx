import { useState, useEffect } from 'react';
import { employeeApi } from '../../api/employee.api';
import { formatCurrency, computeSalary } from '../../utils/formatters';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SalaryInfoTab({ employeeId, canEdit }) {
  const [wage, setWage] = useState(0);
  const [structure, setStructure] = useState({
    working_days: 22, break_time_hrs: 1, basic_pct: 50, hra_pct: 50,
    standard_allowance: 4167, performance_bonus_pct: 8.33, leave_travel_pct: 8.333,
    pf_rate: 12, professional_tax: 200,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSalary(); }, [employeeId]);

  const fetchSalary = async () => {
    setLoading(true);
    const res = await employeeApi.getSalary(employeeId);
    if (res.success && res.data) {
      const { structure } = res.data;
      setWage(structure.monthly_wage || 0);
      setStructure(prev => ({ ...prev, ...structure }));
    }
    setLoading(false);
  };

  const computed = computeSalary(wage, structure);

  const handleSave = async () => {
    setSaving(true);
    const res = await employeeApi.updateSalary(employeeId, { monthly_wage: wage, ...structure });
    setSaving(false);
    if (res.success) toast.success('Salary updated');
    else toast.error('Failed to update salary');
  };

  if (loading) return <div className="card p-8 animate-pulse"><div className="h-6 w-48 bg-[var(--bg-card-hover)] rounded" /></div>;

  const components = Object.values(computed.components);
  const deductions = Object.values(computed.deductions);

  return (
    <div className="space-y-6">
      {/* Wage & Schedule */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-accent)] uppercase tracking-wider mb-4">Wage Information</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Monthly Wage (₹)</label>
            <input type="number" value={wage} onChange={e => setWage(Number(e.target.value))} disabled={!canEdit} className="input-field" id="salary-wage" />
          </div>
          <div>
            <label className="label">Yearly Wage</label>
            <input type="text" value={formatCurrency(wage * 12)} disabled className="input-field opacity-70" />
          </div>
          <div>
            <label className="label">Working Days/Month</label>
            <input type="number" value={structure.working_days} onChange={e => setStructure({...structure, working_days: Number(e.target.value)})} disabled={!canEdit} className="input-field" />
          </div>
          <div>
            <label className="label">Break Time (hrs)</label>
            <input type="number" step="0.5" value={structure.break_time_hrs} onChange={e => setStructure({...structure, break_time_hrs: Number(e.target.value)})} disabled={!canEdit} className="input-field" />
          </div>
        </div>
      </div>

      {/* Components Table */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-accent)] uppercase tracking-wider mb-4">Salary Components</h3>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Component</th><th>Type</th><th>Rate</th><th className="text-right">Amount / Month</th></tr></thead>
            <tbody>
              {components.map((c, i) => (
                <tr key={i}><td className="font-medium">{c.label}</td>
                  <td className="text-[var(--text-secondary)] text-xs">{c.fixed ? 'Fixed' : c.calculated ? 'Calculated' : c.ofBasic ? '% of Basic' : '% of Wage'}</td>
                  <td className="text-[var(--text-secondary)]">{c.pct ? `${c.pct}%` : c.fixed ? 'Fixed' : 'Auto'}</td>
                  <td className="text-right font-medium text-[var(--color-success)]">{formatCurrency(c.amount)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-[var(--border-color)]">
                <td colSpan={3} className="font-bold">Gross Salary</td>
                <td className="text-right font-bold text-[var(--text-primary)]">{formatCurrency(computed.gross)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Deductions */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-accent)] uppercase tracking-wider mb-4">Deductions</h3>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Deduction</th><th>Rate</th><th className="text-right">Amount / Month</th></tr></thead>
            <tbody>
              {deductions.map((d, i) => (
                <tr key={i}><td className="font-medium">{d.label}</td>
                  <td className="text-[var(--text-secondary)]">{d.pct ? `${d.pct}% of Basic` : 'Fixed'}</td>
                  <td className="text-right font-medium text-[var(--color-danger)]">- {formatCurrency(d.amount)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-[var(--border-color)]">
                <td colSpan={2} className="font-bold">Net Salary</td>
                <td className="text-right font-bold text-[var(--color-success)]">{formatCurrency(computed.net)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {canEdit && (
        <button onClick={handleSave} disabled={saving} className={`btn-primary flex items-center gap-2 ${saving ? 'opacity-50' : ''}`} id="salary-save">
          <Save size={16} />{saving ? 'Saving...' : 'Save Salary Structure'}
        </button>
      )}
    </div>
  );
}
