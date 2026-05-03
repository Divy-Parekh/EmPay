import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { formatCurrency, formatDate, numberToWords } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import { payrollApi } from '../../api/payroll.api';
import { ArrowLeft, Printer, RefreshCw, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PayslipDetail({ payslip, onBack }) {
  const printRef = useRef();
  const [tab, setTab] = useState('Worked Days');

  const handlePrint = useReactToPrint({ 
    content: () => printRef.current, 
    documentTitle: `Payslip-${payslip.employee_name}` 
  });

  const handleNewPayslip = async () => {
    const res = await payrollApi.newPayslip(payslip.id);
    if (res.success) toast.success('New payslip generated');
    else toast.error('Failed');
  };

  const handleCancel = async () => {
    const res = await payrollApi.cancelPayslip(payslip.id);
    if (res.success) { toast.success('Payslip cancelled'); onBack(); }
    else toast.error('Failed');
  };

  const components = [
    { name: 'Basic Salary', amount: payslip.basic_amount },
    { name: 'House Rent Allowance', amount: payslip.hra_amount },
    { name: 'Standard Allowance', amount: payslip.standard_allowance },
    { name: 'Performance Bonus', amount: payslip.performance_bonus },
    { name: 'Leave Travel Allowance', amount: payslip.leave_travel },
    { name: 'Fixed Allowance', amount: payslip.fixed_allowance },
  ];

  const deductions = [
    { name: 'PF (Employee)', amount: payslip.pf_employee },
    { name: 'PF (Employer)', amount: payslip.pf_employer },
    { name: 'Professional Tax', amount: payslip.professional_tax },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to Payrun
      </button>

      {/* Header */}
      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-bold">{payslip.employee_name}</h2>
            <p className="text-sm text-[var(--text-secondary)]">{payslip.payrun_name} • {formatDate(payslip.period_start)} – {formatDate(payslip.period_end)}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={payslip.status} />
            <button onClick={handleNewPayslip} className="btn-secondary flex items-center gap-1 text-sm"><RefreshCw size={14} />New Payslip</button>
            {payslip.status !== 'cancelled' && <button onClick={handleCancel} className="btn-danger flex items-center gap-1 text-sm"><XCircle size={14} />Cancel</button>}
            <button onClick={handlePrint} className="btn-primary flex items-center gap-1 text-sm"><Printer size={14} />Print</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {['Worked Days', 'Salary Computation'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`tab-item ${tab === t ? 'active' : ''}`}>{t}</button>
        ))}
      </div>

      {tab === 'Worked Days' ? (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Type</th><th>Days</th><th>Amount</th></tr></thead>
              <tbody>
                <tr><td>Attendance</td><td>{payslip.attendance_days}</td><td>{formatCurrency(payslip.gross_wage * (payslip.attendance_days / payslip.total_working_days))}</td></tr>
                <tr><td>Paid Time Off</td><td>{payslip.paid_leave_days}</td><td>{formatCurrency(payslip.gross_wage * (payslip.paid_leave_days / payslip.total_working_days))}</td></tr>
                {payslip.unpaid_leave_days > 0 && <tr><td>Unpaid Leave</td><td>{payslip.unpaid_leave_days}</td><td className="text-[var(--color-danger)]">- {formatCurrency(payslip.gross_wage * (payslip.unpaid_leave_days / payslip.total_working_days))}</td></tr>}
                <tr className="font-bold border-t-2 border-[var(--border-color)]">
                  <td>Total Payable</td><td>{payslip.payable_days} / {payslip.total_working_days}</td><td>{formatCurrency(payslip.gross_wage)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Rule</th><th className="text-right">Amount</th></tr></thead>
              <tbody>
                {components.map((c, i) => (
                  <tr key={i}><td>{c.name}</td><td className="text-right text-[var(--color-success)]">{formatCurrency(c.amount)}</td></tr>
                ))}
                <tr className="border-t-2 border-[var(--border-color)] font-bold"><td>Gross</td><td className="text-right">{formatCurrency(payslip.gross_wage)}</td></tr>
                {deductions.map((d, i) => (
                  <tr key={i}><td>{d.name}</td><td className="text-right text-[var(--color-danger)]">- {formatCurrency(d.amount)}</td></tr>
                ))}
                <tr className="border-t-2 border-[var(--border-color)] font-bold bg-[rgba(124,58,237,0.05)]"><td>Net Salary</td><td className="text-right text-[var(--color-success)] text-lg">{formatCurrency(payslip.net_wage)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable payslip (hidden) */}
      <div className="hidden">
        <div ref={printRef} className="p-8 bg-white text-black printable-area" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-1">PAYSLIP</h2>
            <p className="text-sm text-gray-500">{formatDate(payslip.period_start)} – {formatDate(payslip.period_end)}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 mb-8 text-sm">
            <div className="flex justify-between border-b pb-1"><strong>Employee:</strong> <span>{payslip.employee_name}</span></div>
            <div className="flex justify-between border-b pb-1"><strong>Pay Period:</strong> <span>{payslip.payrun_name}</span></div>
            <div className="flex justify-between border-b pb-1"><strong>Department:</strong> <span>{payslip.department || '—'}</span></div>
            <div className="flex justify-between border-b pb-1"><strong>Location:</strong> <span>{payslip.location || '—'}</span></div>
            <div className="flex justify-between border-b pb-1"><strong>Account No:</strong> <span>{payslip.bank_acc_number || '—'}</span></div>
            <div className="flex justify-between border-b pb-1"><strong>Emp Code:</strong> <span>{payslip.emp_code || '—'}</span></div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-bold border-b-2 mb-2 text-sm uppercase">Earnings</h3>
              <div className="space-y-1.5">
                {components.map((c, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{c.name}</span>
                    <span>₹{Number(c.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold border-t pt-1 text-sm mt-2">
                  <span>Gross Earnings</span>
                  <span>₹{Number(payslip.gross_wage || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-bold border-b-2 mb-2 text-sm uppercase">Deductions</h3>
              <div className="space-y-1.5">
                {deductions.map((d, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{d.name}</span>
                    <span>₹{Number(d.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold border-t pt-1 text-sm mt-2">
                  <span>Total Deductions</span>
                  <span>₹{Number(payslip.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded border-2 border-gray-200">
            <div className="flex justify-between items-center font-bold text-xl">
              <span>Net Payable</span>
              <span className="text-green-700">₹{Number(payslip.net_wage || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic capitalize">Amount in words: {numberToWords(payslip.net_wage)} only</p>
          </div>
        </div>
      </div>
    </div>
  );
}
