import { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { reportsApi } from '../api/reports.api';
import { fetchEmployees } from '../store/slices/employeeSlice';
import { formatCurrency } from '../utils/formatters';
import { useReactToPrint } from 'react-to-print';
import { 
  Printer, 
  FileText, 
  Users, 
  Wallet, 
  ShieldCheck, 
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  {
    id: 'employee',
    title: 'Employee Insights',
    description: 'Attendance logs, performance, and profile documentation.',
    icon: Users,
    color: '#10b981', // Emerald
    reports: [
      { id: 'attendance_summary', name: 'Monthly Attendance Summary', icon: Clock },
      { id: 'employee_profile', name: 'Employee Master Record', icon: FileText },
      { id: 'leave_history', name: 'Personal Leave History', icon: Briefcase }
    ]
  },
  {
    id: 'payroll',
    title: 'Payroll Intelligence',
    description: 'Salary statements, tax compliance, and budget trends.',
    icon: Wallet,
    color: '#3b82f6', // Blue
    reports: [
      { id: 'salary_statement', name: 'Individual Salary Statement', icon: FileText },
      { id: 'tax_report', name: 'Fiscal Tax (PF/PT) Analysis', icon: TrendingUp },
      { id: 'payroll_summary', name: 'Company Payroll Summary', icon: Wallet }
    ]
  },
  {
    id: 'hr',
    title: 'HR Strategy',
    description: 'Headcount growth, leave approvals, and workforce data.',
    icon: ShieldCheck,
    color: '#f59e0b', // Amber
    reports: [
      { id: 'headcount_growth', name: 'Annual Headcount Growth', icon: TrendingUp },
      { id: 'leave_approvals', name: 'Managerial Leave Approvals', icon: ShieldCheck },
      { id: 'attrition_report', name: 'Workforce Attrition Stats', icon: Users }
    ]
  }
];

export default function Reports() {
  const dispatch = useDispatch();
  const { list: employees } = useSelector((state) => state.employees);
  
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  
  const printRef = useRef();

  const handlePrint = useReactToPrint({ 
    content: () => printRef.current, 
    documentTitle: 'EmPay-ERP-Report' 
  });

  useEffect(() => {
    if (employees.length === 0) dispatch(fetchEmployees());
  }, [dispatch, employees.length]);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const filteredEmployees = useMemo(() => {
    if (!activeCategory) return [];
    if (showAll) return employees;
    
    return employees.filter(emp => {
      const role = (emp.role || '').toLowerCase();
      const dept = (emp.department || '').toLowerCase();
      const pos = (emp.job_position || '').toLowerCase();

      if (activeCategory.id === 'employee') return true; 
      
      if (activeCategory.id === 'payroll') {
        return role.includes('payroll') || role.includes('admin') || role.includes('accountant') ||
               dept.includes('payroll') || dept.includes('finance') || dept.includes('acc') ||
               pos.includes('account') || pos.includes('payroll') || pos.includes('finance');
      }
      
      if (activeCategory.id === 'hr') {
        return role.includes('hr') || role.includes('admin') || role.includes('manager') ||
               dept.includes('hr') || dept.includes('human') || dept.includes('people') ||
               dept.includes('admin') || pos.includes('hr') || pos.includes('recruitment') || 
               pos.includes('people') || pos.includes('manager') || pos.includes('admin');
      }
      
      return true;
    });
  }, [employees, activeCategory, showAll]);

  useEffect(() => {
    setShowAll(false);
  }, [activeCategory]);

  const handleGenerate = async () => {
    const isEmployeeReport = activeCategory?.id === 'employee' || selectedReport === 'salary_statement';
    if (isEmployeeReport && !selectedEmp) { 
      toast.error('Select an employee'); 
      return; 
    }
    
    setLoading(true);
    try {
      const res = await reportsApi.getSalaryStatement(selectedEmp, year);
      if (res.success) setReportData(res.data);
      else toast.error('Failed to generate report');
    } catch (err) {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (!activeCategory) {
    return (
      <div className="animate-fade-in space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-[var(--text-primary)]">ERP Reports</h1>
          <p className="text-[var(--text-secondary)] font-medium">Select a department category to view available intelligence reports.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat)}
              className="group text-left p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-emerald-500 transition-all duration-300 hover:shadow-2xl hover:shadow-black/10 relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-[var(--bg-body)] border border-[var(--border-color)] group-hover:scale-110 transition-transform duration-300">
                  <cat.icon size={28} style={{ color: cat.color }} />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{cat.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">{cat.description}</p>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest" style={{ color: cat.color }}>
                  Explore Reports <ChevronRight size={14} />
                </div>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <cat.icon size={120} style={{ color: cat.color }} />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setActiveCategory(null); setSelectedReport(null); setReportData(null); }}
            className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[var(--text-primary)]">{activeCategory.title} Reports</h1>
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mt-1">Enterprise Intelligence Unit</p>
          </div>
        </div>
        {reportData && (
          <button onClick={handlePrint} className="btn-primary flex items-center gap-2 px-6 py-3">
            <Printer size={18} /> Print Report
          </button>
        )}
      </div>

      {!reportData ? (
        <div className="space-y-8">
          {activeCategory.id === 'hr' && (
            <div className="animate-slide-down">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">HR Personnel Directory</p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredEmployees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => { setSelectedEmp(emp.id); if(!selectedReport) setSelectedReport('leave_approvals'); }}
                    className={`p-3 rounded-2xl border transition-all duration-300 text-center flex flex-col items-center gap-2
                      ${selectedEmp === emp.id 
                        ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20' 
                        : 'bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-emerald-500/50 group'}
                    `}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                      ${selectedEmp === emp.id ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-body)] text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white'}
                    `}>
                      {emp.first_name[0]}{emp.last_name[0]}
                    </div>
                    <div className="min-w-0 w-full">
                      <p className="text-[11px] font-bold text-[var(--text-primary)] truncate">{emp.first_name}</p>
                      <p className="text-[9px] text-[var(--text-muted)] truncate uppercase font-medium">{emp.job_position || 'Staff'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">Available Intelligence</p>
              {activeCategory.reports.map(rep => (
                <button
                  key={rep.id}
                  onClick={() => setSelectedReport(rep.id)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300
                    ${selectedReport === rep.id 
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                      : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <rep.icon size={20} className={selectedReport === rep.id ? 'text-emerald-500' : 'text-[var(--text-muted)]'} />
                    <span className="font-bold">{rep.name}</span>
                  </div>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>

            {selectedReport && (
              <div className="card p-8 animate-slide-in-right bg-[var(--bg-card)] border border-[var(--border-color)]">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="text-emerald-500" size={20} />
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Report Configuration</h3>
                </div>
                <div className="space-y-6">
                  {(activeCategory.id === 'employee' || selectedReport === 'salary_statement') && (
                    <div>
                      <div className="flex items-center justify-between mb-2 ml-1">
                        <label className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Choose Employee</label>
                        {filteredEmployees.length === 0 && !showAll && (
                          <button onClick={() => setShowAll(true)} className="text-[10px] text-emerald-500 hover:underline font-bold">Show All</button>
                        )}
                      </div>
                      <select 
                        value={selectedEmp} 
                        onChange={e => setSelectedEmp(e.target.value)} 
                        className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none hover:border-[var(--text-muted)] transition-colors"
                      >
                        <option value="">Select an associate...</option>
                        {filteredEmployees.map(e => (
                          <option key={e.id} value={e.id} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                            {e.first_name} {e.last_name} — [{e.role?.replace('_', ' ').toUpperCase() || 'EMPLOYEE'}] {e.department ? `(${e.department})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block ml-1">Fiscal Target Year</label>
                    <select 
                      value={year} 
                      onChange={e => setYear(Number(e.target.value))} 
                      className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none hover:border-[var(--text-muted)] transition-colors"
                    >
                      {years.map(y => <option key={y} value={y} className="bg-[var(--bg-card)] text-[var(--text-primary)]">{y}</option>)}
                    </select>
                  </div>
                  <button 
                    onClick={handleGenerate} 
                    disabled={loading} 
                    className={`w-full py-4 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all transform active:scale-[0.98] ${loading ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Compiling Intelligence...' : 'Generate ERP Report'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* The Printed Report Display */
        <div className="card p-12 printable-area" ref={printRef} style={{ background: '#fff', color: '#111' }}>
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tight text-slate-900">{reportData.company?.name}</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Enterprise ERP Intelligence</p>
            </div>
            <div className="text-right">
              <h3 className="text-xl font-black text-slate-900">SALARY STATEMENT</h3>
              <p className="text-slate-500 font-bold">FISCAL YEAR {year}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mb-12">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Employee Details</p>
              <div className="space-y-1">
                <p className="text-lg font-black text-slate-900">{reportData.employee?.name}</p>
                <p className="text-sm font-bold text-slate-600">{reportData.employee?.designation}</p>
                <p className="text-xs text-slate-500">Joined: {reportData.employee?.date_of_joining}</p>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Status Metrics</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Employment</p>
                  <p className="text-xs font-black text-slate-900">FULL TIME</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Reported By</p>
                  <p className="text-xs font-black text-slate-900">EmPay Engine</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-slate-900 rounded-xl overflow-hidden mb-8">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-6 py-4 text-xs font-black uppercase">Component Description</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-right">Monthly (Avg)</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-right">Annual Projection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td colSpan={3} className="px-6 py-4 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest">Earnings Breakdown</td></tr>
                {(reportData.components || []).map((c, i) => (
                  <tr key={i}>
                    <td className="px-6 py-3 text-sm font-bold text-slate-800">{c.name}</td>
                    <td className="px-6 py-3 text-sm text-right text-slate-800">{formatCurrency(c.monthly_amount)}</td>
                    <td className="px-6 py-3 text-sm font-black text-right text-slate-900">{formatCurrency(c.yearly_amount)}</td>
                  </tr>
                ))}
                <tr><td colSpan={3} className="px-6 py-4 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest">Mandatory Deductions</td></tr>
                {(reportData.deductions || []).map((d, i) => (
                  <tr key={i}>
                    <td className="px-6 py-3 text-sm font-bold text-slate-800">{d.name}</td>
                    <td className="px-6 py-3 text-sm text-right text-red-600">{formatCurrency(d.monthly_amount)}</td>
                    <td className="px-6 py-3 text-sm font-black text-right text-red-600">{formatCurrency(d.yearly_amount)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-900 text-white">
                  <td className="px-6 py-6 text-sm font-black uppercase tracking-widest">Total Net Disbursement</td>
                  <td className="px-6 py-6 text-xl font-black text-right">{formatCurrency(reportData.net_salary?.monthly)}</td>
                  <td className="px-6 py-6 text-xl font-black text-right">{formatCurrency(reportData.net_salary?.yearly)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between items-end mt-24">
            <div className="border-t-2 border-slate-900 pt-2 w-48 text-center">
              <p className="text-[10px] font-black uppercase text-slate-900">HR Authorization</p>
            </div>
            <div className="text-right italic text-slate-400 text-[10px]">
              Computer generated report - No signature required.
            </div>
            <div className="border-t-2 border-slate-900 pt-2 w-48 text-center">
              <p className="text-[10px] font-black uppercase text-slate-900">Admin Approval</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
