import { useState, useEffect, useRef } from 'react';
import { reportsApi } from '../api/reports.api';
import { employeeApi } from '../api/employee.api';
import { formatCurrency } from '../utils/formatters';
import { useReactToPrint } from 'react-to-print';
import { Printer, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Reports() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef();

  const handlePrint = useReactToPrint({ 
    content: () => printRef.current, 
    documentTitle: 'Salary-Statement' 
  });

  useEffect(() => {
    employeeApi.list().then(res => { if (res.success) setEmployees(res.data || []); });
  }, []);

  const handleGenerate = async () => {
    if (!selectedEmp) { toast.error('Select an employee'); return; }
    setLoading(true);
    const res = await reportsApi.getSalaryStatement(selectedEmp, year);
    if (res.success) setReport(res.data);
    else toast.error('Failed to generate report');
    setLoading(false);
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Reports</h1>
        {report && <button onClick={handlePrint} className="btn-primary flex items-center gap-2" id="report-print-btn"><Printer size={16} />Print</button>}
      </div>

      {/* Form */}
      <div className="card p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold mb-4"><FileText size={16} className="text-[var(--color-primary)]" />Salary Statement Report</h3>
        <div className="flex gap-4 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Employee</label>
            <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)} className="select-field" id="report-employee-select">
              <option value="">Select employee...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
            </select>
          </div>
          <div className="w-32">
            <label className="label">Year</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="select-field" id="report-year-select">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={handleGenerate} disabled={loading} className={`btn-primary ${loading ? 'opacity-50' : ''}`} id="report-generate">
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Report Display */}
      {report && (
        <div className="card p-6 printable-area" ref={printRef}>
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold">{report.company?.name}</h2>
            <p className="text-sm text-[var(--text-secondary)]">Salary Statement Report — {year}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div><span className="text-[var(--text-secondary)]">Employee:</span> <strong>{report.employee?.name}</strong></div>
            <div><span className="text-[var(--text-secondary)]">Designation:</span> {report.employee?.designation || '—'}</div>
            <div><span className="text-[var(--text-secondary)]">Date of Joining:</span> {report.employee?.date_of_joining || '—'}</div>
            <div><span className="text-[var(--text-secondary)]">Salary Effective From:</span> {report.employee?.salary_effective_from || '—'}</div>
          </div>

          <div className="table-container mb-4">
            <table className="data-table">
              <thead><tr><th>Salary Component</th><th className="text-right">Monthly</th><th className="text-right">Yearly</th></tr></thead>
              <tbody>
                <tr><td colSpan={3} className="font-bold text-[var(--text-accent)] text-xs uppercase tracking-wider pt-4">Earnings</td></tr>
                {(report.components || []).map((c, i) => (
                  <tr key={i}><td>{c.name}</td><td className="text-right">{formatCurrency(c.monthly_amount)}</td><td className="text-right">{formatCurrency(c.yearly_amount)}</td></tr>
                ))}
                <tr><td colSpan={3} className="font-bold text-[var(--text-accent)] text-xs uppercase tracking-wider pt-4">Deductions</td></tr>
                {(report.deductions || []).map((d, i) => (
                  <tr key={i}><td>{d.name}</td><td className="text-right text-[var(--color-danger)]">{formatCurrency(d.monthly_amount)}</td><td className="text-right text-[var(--color-danger)]">{formatCurrency(d.yearly_amount)}</td></tr>
                ))}
                <tr className="border-t-2 border-[var(--border-color)] font-bold bg-[rgba(124,58,237,0.05)]">
                  <td>Net Salary</td>
                  <td className="text-right text-[var(--color-success)]">{formatCurrency(report.net_salary?.monthly)}</td>
                  <td className="text-right text-[var(--color-success)]">{formatCurrency(report.net_salary?.yearly)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
