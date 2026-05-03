import { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { reportsApi } from '../api/reports.api';
import { fetchEmployees } from '../store/slices/employeeSlice';
import { formatCurrency } from '../utils/formatters';
import { useReactToPrint } from 'react-to-print';
import CustomSelect from '../components/common/CustomSelect';
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
  Briefcase,
  User
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

  const employeeOptions = useMemo(() => employees.map(e => ({
    value: e.id,
    label: `${e.first_name} ${e.last_name} — [${e.role?.replace('_', ' ').toUpperCase() || 'EMPLOYEE'}] ${e.department ? `(${e.department})` : ''}`
  })), [employees]);

  const yearOptions = useMemo(() => Array.from({ length: 5 }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return { value: y, label: y.toString() };
  }), []);

  useEffect(() => {
    if (employees.length === 0) dispatch(fetchEmployees());
  }, [dispatch, employees.length]);

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
    setLoading(true);
    let res;
    try {
      switch (selectedReport) {
        case 'salary_statement':
          if (!selectedEmp) { toast.error('Select an employee'); setLoading(false); return; }
          res = await reportsApi.getSalaryStatement(selectedEmp, year);
          break;
        case 'attendance_summary':
          if (!selectedEmp) { toast.error('Select an employee'); setLoading(false); return; }
          res = await reportsApi.getAttendanceSummary(selectedEmp, year);
          break;
        case 'leave_history':
          res = await reportsApi.getLeaveHistory(selectedEmp, year);
          break;
        case 'employee_profile':
          if (!selectedEmp) { toast.error('Select an employee'); setLoading(false); return; }
          res = await reportsApi.getEmployeeProfile(selectedEmp);
          break;
        case 'leave_approvals':
          res = await reportsApi.getLeaveApprovals(year);
          break;
        case 'payroll_summary':
          res = await reportsApi.getPayrollSummary(year);
          break;
        case 'tax_report':
          res = await reportsApi.getTaxReport(year);
          break;
        case 'headcount_growth':
          res = await reportsApi.getHeadcountGrowth();
          break;
        case 'attrition_report':
          res = await reportsApi.getAttritionReport(year);
          break;
        default:
          toast.error('Report not implemented yet');
          setLoading(false);
          return;
      }

      if (res.success) setReportData(res.data);
      else toast.error(res.error?.message || 'Failed to generate report');
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
              className="group text-left p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--color-primary)] transition-all duration-300 hover:shadow-2xl hover:shadow-black/10 relative overflow-hidden"
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
              <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                <cat.icon size={160} style={{ color: cat.color }} />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      <button 
        onClick={() => { setActiveCategory(null); setSelectedReport(null); setReportData(null); }}
        className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft size={16} /> Back to Categories
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          <div className="card p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)] mb-6">Configuration</h2>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 block ml-1">Select Intelligence Report</label>
                <div className="space-y-2">
                  {activeCategory.reports.map(rep => (
                    <button 
                      key={rep.id}
                      onClick={() => { setSelectedReport(rep.id); setReportData(null); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                        selectedReport === rep.id 
                        ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary-light)]' 
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                      }`}
                    >
                      <rep.icon size={16} /> {rep.name}
                    </button>
                  ))}
                </div>
              </div>

              {selectedReport && (
                <div className="space-y-6 pt-4 border-t border-[var(--border-color)] animate-slide-up">
                  {(activeCategory.id === 'employee' || selectedReport === 'salary_statement' || selectedReport === 'leave_history') && (
                    <CustomSelect 
                      label="Choose Employee"
                      placeholder="Select an associate..."
                      options={employeeOptions}
                      value={selectedEmp}
                      onChange={setSelectedEmp}
                    />
                  )}
                  {selectedReport !== 'headcount_growth' && selectedReport !== 'employee_profile' && (
                    <CustomSelect 
                      label="Fiscal Target Year"
                      options={yearOptions}
                      value={year}
                      onChange={val => setYear(Number(val))}
                    />
                  )}
                  <button 
                    onClick={handleGenerate} 
                    disabled={loading} 
                    className="w-full btn-primary flex items-center justify-center gap-2 py-4 shadow-xl active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Generate Report'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {!reportData ? (
            <div className="card p-20 text-center flex flex-col items-center justify-center border-dashed">
              <div className="w-20 h-20 rounded-full bg-[var(--bg-card-hover)] flex items-center justify-center mb-6">
                <FileText size={40} className="text-[var(--text-muted)]" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Report Generated</h3>
              <p className="text-[var(--text-secondary)] max-w-xs mx-auto">Configure the parameters on the left and click "Generate" to view intelligence insights.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button 
                  onClick={handlePrint}
                  className="btn-secondary flex items-center gap-2 px-6 py-3"
                >
                  <Printer size={18} /> Export as PDF
                </button>
              </div>

              <div ref={printRef} className="bg-white text-slate-900 p-12 rounded-2xl shadow-sm border border-slate-100 min-h-[1000px] font-sans">
                <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-12">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">{reportData.company?.name || reportData.employee?.company_name || 'EmPay Enterprise'}</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Intelligence Department — Internal Documentation</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900 uppercase">Report: {selectedReport.replace('_', ' ')}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Generated: {new Date().toLocaleDateString()}</p>
                    {selectedReport !== 'headcount_growth' && selectedReport !== 'employee_profile' && (
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Fiscal: {year}</p>
                    )}
                  </div>
                </div>

                {reportData.type === 'employee_profile' && (
                  <div className="space-y-12">
                    <div className="flex gap-12 items-center">
                      <div className="w-32 h-32 rounded-3xl bg-slate-100 flex items-center justify-center border-2 border-slate-900">
                        {reportData.employee.profile_picture ? (
                          <img src={reportData.employee.profile_picture} className="w-full h-full object-cover rounded-[22px]" />
                        ) : (
                          <User size={64} className="text-slate-300" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-4xl font-black text-slate-900">{reportData.employee.first_name} {reportData.employee.last_name}</h3>
                        <p className="text-xl font-bold text-slate-500 uppercase tracking-widest">{reportData.employee.job_position || 'Associate'}</p>
                        <p className="text-sm font-black text-slate-900 mt-2">ID: {reportData.employee.emp_code || 'EMP-'+reportData.employee.id}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-16 gap-y-12">
                      <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest border-b-2 border-slate-900 pb-2">Professional Info</h4>
                        <div className="space-y-4">
                          <div><p className="text-[10px] font-bold text-slate-400">DEPARTMENT</p><p className="text-sm font-black">{reportData.employee.department || 'N/A'}</p></div>
                          <div><p className="text-[10px] font-bold text-slate-400">JOINED ON</p><p className="text-sm font-black">{new Date(reportData.employee.date_of_joining).toLocaleDateString()}</p></div>
                          <div><p className="text-[10px] font-bold text-slate-400">REPORTING MANAGER</p><p className="text-sm font-black">{reportData.employee.m_first ? `${reportData.employee.m_first} ${reportData.employee.m_last}` : 'Direct Management'}</p></div>
                          <div><p className="text-[10px] font-bold text-slate-400">WORK LOCATION</p><p className="text-sm font-black">{reportData.employee.location || 'Remote/Headquarters'}</p></div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest border-b-2 border-slate-900 pb-2">Contact & Personal</h4>
                        <div className="space-y-4">
                          <div><p className="text-[10px] font-bold text-slate-400">OFFICIAL EMAIL</p><p className="text-sm font-black">{reportData.employee.email}</p></div>
                          <div><p className="text-[10px] font-bold text-slate-400">PHONE NUMBER</p><p className="text-sm font-black">{reportData.employee.phone || 'N/A'}</p></div>
                          <div><p className="text-[10px] font-bold text-slate-400">DATE OF BIRTH</p><p className="text-sm font-black">{reportData.employee.date_of_birth ? new Date(reportData.employee.date_of_birth).toLocaleDateString() : 'N/A'}</p></div>
                          <div><p className="text-[10px] font-bold text-slate-400">GENDER / STATUS</p><p className="text-sm font-black">{reportData.employee.gender || 'N/A'} / {reportData.employee.marital_status || 'N/A'}</p></div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest border-b-2 border-slate-900 pb-2">Financial Intelligence</h4>
                        <div className="space-y-4">
                          <div><p className="text-[10px] font-bold text-slate-400">BANK ACCOUNT</p><p className="text-sm font-black">{reportData.employee.bank_acc_number || 'N/A'}</p></div>
                          <div><p className="text-[10px] font-bold text-slate-400">IFSC CODE</p><p className="text-sm font-black">{reportData.employee.ifsc_code || 'N/A'}</p></div>
                          <div><p className="text-[10px] font-bold text-slate-400">PAN NUMBER</p><p className="text-sm font-black">{reportData.employee.pan_number || 'N/A'}</p></div>
                          <div><p className="text-[10px] font-bold text-slate-400">UAN NUMBER</p><p className="text-sm font-black">{reportData.employee.uan_number || 'N/A'}</p></div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest border-b-2 border-slate-900 pb-2">Residential Data</h4>
                        <div className="space-y-4">
                          <div><p className="text-[10px] font-bold text-slate-400">ADDRESS</p><p className="text-sm font-bold leading-relaxed">{reportData.employee.address || 'N/A'}</p></div>
                          <div><p className="text-[10px] font-bold text-slate-400">NATIONALITY</p><p className="text-sm font-black">{reportData.employee.nationality || 'Indian'}</p></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {reportData.type === 'salary_statement' && (
                  <>
                    <div className="grid grid-cols-2 gap-12 mb-12">
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Employee Details</p>
                        <div className="space-y-1">
                          <p className="text-lg font-black text-slate-900">{reportData.employee?.name}</p>
                          <p className="text-sm font-bold text-slate-600">{reportData.employee?.designation}</p>
                          <p className="text-xs text-slate-500">Emp Code: {reportData.employee?.emp_code}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Bank & Tax Info</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div><p className="text-[10px] font-bold text-slate-400">BANK A/C</p><p className="text-xs font-black">{reportData.employee?.bank_acc_number || 'NA'}</p></div>
                          <div><p className="text-[10px] font-bold text-slate-400">PAN NO</p><p className="text-xs font-black">{reportData.employee?.pan_number || 'NA'}</p></div>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-900 rounded-xl overflow-hidden mb-8">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900 text-white">
                          <tr>
                            <th className="px-6 py-4 font-black uppercase">Earnings & Deductions</th>
                            <th className="px-6 py-4 font-black uppercase text-right">Monthly</th>
                            <th className="px-6 py-4 font-black uppercase text-right">Annual</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {reportData.components.map((c, i) => (
                            <tr key={i}>
                              <td className="px-6 py-3 font-bold">{c.name}</td>
                              <td className="px-6 py-3 text-right">{formatCurrency(c.monthly_amount)}</td>
                              <td className="px-6 py-3 text-right font-black">{formatCurrency(c.yearly_amount)}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50 font-black"><td colSpan={3} className="px-6 py-2 uppercase text-[10px]">Deductions</td></tr>
                          {reportData.deductions.map((d, i) => (
                            <tr key={i}>
                              <td className="px-6 py-3 font-bold">{d.name}</td>
                              <td className="px-6 py-3 text-right text-red-600">-{formatCurrency(d.monthly_amount)}</td>
                              <td className="px-6 py-3 text-right text-red-600 font-black">-{formatCurrency(d.yearly_amount)}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-900 text-white">
                            <td className="px-6 py-6 font-black uppercase">Net Salary</td>
                            <td className="px-6 py-6 text-xl text-right">{formatCurrency(reportData.net_salary.monthly)}</td>
                            <td className="px-6 py-6 text-xl text-right font-black">{formatCurrency(reportData.net_salary.yearly)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {reportData.type === 'attendance_summary' && (
                  <div className="space-y-8">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <h4 className="text-sm font-black uppercase tracking-widest mb-4">Annual Metrics</h4>
                      <div className="grid grid-cols-3 gap-8">
                        <div><p className="text-[10px] font-bold text-slate-400">TOTAL DAYS PRESENT</p><p className="text-2xl font-black">{reportData.total_days}</p></div>
                        <div><p className="text-[10px] font-bold text-slate-400">TOTAL WORKING HOURS</p><p className="text-2xl font-black">{reportData.total_hours}</p></div>
                        <div><p className="text-[10px] font-bold text-slate-400">AVG DAILY HOURS</p><p className="text-2xl font-black">{(reportData.total_hours / reportData.total_days || 0).toFixed(2)}</p></div>
                      </div>
                    </div>
                    <div className="border border-slate-900 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900 text-white">
                          <tr>
                            <th className="px-6 py-4 font-black uppercase">Month</th>
                            <th className="px-6 py-4 font-black uppercase text-right">Days Present</th>
                            <th className="px-6 py-4 font-black uppercase text-right">Total Hours</th>
                            <th className="px-6 py-4 font-black uppercase text-right">Avg / Day</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {reportData.months.map((m, i) => (
                            <tr key={i}>
                              <td className="px-6 py-4 font-bold">{m.month}</td>
                              <td className="px-6 py-4 text-right">{m.days_present}</td>
                              <td className="px-6 py-4 text-right font-black">{m.total_hours} hrs</td>
                              <td className="px-6 py-4 text-right font-black text-emerald-600">{m.avg_hours} hrs</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {reportData.type === 'leave_history' && (
                  <div className="border border-slate-900 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900 text-white">
                        <tr>
                          <th className="px-6 py-4 font-black uppercase">Type</th>
                          <th className="px-6 py-4 font-black uppercase">Duration</th>
                          <th className="px-6 py-4 font-black uppercase">Status</th>
                          <th className="px-6 py-4 font-black uppercase">Applied On</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.requests.map((r, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4 font-bold">{r.leave_type}</td>
                            <td className="px-6 py-4">{new Date(r.start_date).toLocaleDateString()} - {new Date(r.end_date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 font-black uppercase text-xs">{r.status}</td>
                            <td className="px-6 py-4">{new Date(r.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {reportData.type === 'leave_approvals' && (
                  <div className="border border-slate-900 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900 text-white">
                        <tr>
                          <th className="px-6 py-4 font-black uppercase">Employee</th>
                          <th className="px-6 py-4 font-black uppercase">Type</th>
                          <th className="px-6 py-4 font-black uppercase text-right">Period</th>
                          <th className="px-6 py-4 font-black uppercase text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.requests.map((r, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4 font-bold">{r.first_name} {r.last_name}</td>
                            <td className="px-6 py-4 uppercase text-[10px] font-black">{r.leave_type}</td>
                            <td className="px-6 py-4 text-right text-xs">
                              {new Date(r.start_date).toLocaleDateString()} - {new Date(r.end_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                                r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                                r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {reportData.type === 'payroll_summary' && (
                  <div className="border border-slate-900 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900 text-white">
                        <tr>
                          <th className="px-6 py-4 font-black uppercase">Month Index</th>
                          <th className="px-6 py-4 font-black uppercase text-right">Employees Paid</th>
                          <th className="px-6 py-4 font-black uppercase text-right">Total Net (₹)</th>
                          <th className="px-6 py-4 font-black uppercase text-right">Total PF (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.data.map((m, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4 font-bold">{m.month}</td>
                            <td className="px-6 py-4 text-right">{m.employees_paid}</td>
                            <td className="px-6 py-4 text-right font-black">{formatCurrency(m.total_net)}</td>
                            <td className="px-6 py-4 text-right text-blue-600">{formatCurrency(m.total_pf)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-900 text-white font-black">
                          <td className="px-6 py-4 uppercase">Total Annual</td>
                          <td className="px-6 py-4 text-right">-</td>
                          <td className="px-6 py-4 text-right text-lg">{formatCurrency(reportData.data.reduce((s, m) => s + parseFloat(m.total_net), 0))}</td>
                          <td className="px-6 py-4 text-right">{formatCurrency(reportData.data.reduce((s, m) => s + parseFloat(m.total_pf), 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {reportData.type === 'tax_report' && (
                  <div className="border border-slate-900 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900 text-white">
                        <tr>
                          <th className="px-6 py-4 font-black uppercase">Month</th>
                          <th className="px-6 py-4 font-black uppercase text-right">PF (Employee)</th>
                          <th className="px-6 py-4 font-black uppercase text-right">PF (Employer)</th>
                          <th className="px-6 py-4 font-black uppercase text-right">Prof. Tax</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.data.map((m, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4 font-bold">{m.month}</td>
                            <td className="px-6 py-4 text-right">{formatCurrency(m.total_pf_employee)}</td>
                            <td className="px-6 py-4 text-right">{formatCurrency(m.total_pf_employer)}</td>
                            <td className="px-6 py-4 text-right font-black text-blue-600">{formatCurrency(m.total_pt)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-900 text-white font-black">
                          <td className="px-6 py-4 uppercase">Annual Liability</td>
                          <td className="px-6 py-4 text-right">{formatCurrency(reportData.data.reduce((s, m) => s + parseFloat(m.total_pf_employee), 0))}</td>
                          <td className="px-6 py-4 text-right">{formatCurrency(reportData.data.reduce((s, m) => s + parseFloat(m.total_pf_employer), 0))}</td>
                          <td className="px-6 py-4 text-right text-lg">{formatCurrency(reportData.data.reduce((s, m) => s + parseFloat(m.total_pt), 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {reportData.type === 'headcount_growth' && (
                  <div className="border border-slate-900 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900 text-white">
                        <tr>
                          <th className="px-6 py-4 font-black uppercase">Fiscal Year</th>
                          <th className="px-6 py-4 font-black uppercase text-right">New Hires</th>
                          <th className="px-6 py-4 font-black uppercase text-right">Cumulative Headcount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.growth.map((g, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4 font-bold">{g.year}</td>
                            <td className="px-6 py-4 text-right font-black text-emerald-600">+{g.hires}</td>
                            <td className="px-6 py-4 text-right font-black">{g.total} employees</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {reportData.type === 'attrition_report' && (
                  <div className="border border-slate-900 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900 text-white">
                        <tr>
                          <th className="px-6 py-4 font-black uppercase">Month</th>
                          <th className="px-6 py-4 font-black uppercase text-right">Exit Count</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.data.map((m, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4 font-bold">{m.month}</td>
                            <td className="px-6 py-4 text-right font-black text-red-600">{m.count} deactivations</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-900 text-white font-black">
                          <td className="px-6 py-4 uppercase">Total Annual Loss</td>
                          <td className="px-6 py-4 text-right text-lg">{reportData.data.reduce((s, m) => s + parseInt(m.count), 0)} employees</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
