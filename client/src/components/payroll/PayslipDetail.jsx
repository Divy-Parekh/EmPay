import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { formatCurrency, formatDate, numberToWords } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import { payrollApi } from '../../api/payroll.api';
import { ArrowLeft, Printer, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PayslipDetail({ payslip, onBack }) {
  const printRef = useRef();
  const [tab, setTab] = useState('Worked Days');

  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `Payslip-${payslip.employeeName}` });

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
    { name: 'Basic Salary', amount: payslip.basicAmount },
    { name: 'House Rent Allowance', amount: payslip.hraAmount },
    { name: 'Standard Allowance', amount: payslip.standardAllowance },
    { name: 'Performance Bonus', amount: payslip.performanceBonus },
    { name: 'Leave Travel Allowance', amount: payslip.leaveTravel },
    { name: 'Fixed Allowance', amount: payslip.fixedAllowance },
  ];

  const deductions = [
    { name: 'PF (Employee)', amount: payslip.pfEmployee },
    { name: 'PF (Employer)', amount: payslip.pfEmployer },
    { name: 'Professional Tax', amount: payslip.professionalTax },
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
            <h2 className="text-lg font-bold">{payslip.employeeName}</h2>
            <p className="text-sm text-[var(--text-secondary)]">{payslip.payrunName} • {formatDate(payslip.periodStart)} – {formatDate(payslip.periodEnd)}</p>
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
                <tr><td>Attendance</td><td>{payslip.attendanceDays}</td><td>{formatCurrency(payslip.grossWage * (payslip.attendanceDays / payslip.totalWorkingDays))}</td></tr>
                <tr><td>Paid Time Off</td><td>{payslip.paidLeaveDays}</td><td>{formatCurrency(payslip.grossWage * (payslip.paidLeaveDays / payslip.totalWorkingDays))}</td></tr>
                {payslip.unpaidLeaveDays > 0 && <tr><td>Unpaid Leave</td><td>{payslip.unpaidLeaveDays}</td><td className="text-[var(--color-danger)]">- {formatCurrency(payslip.grossWage * (payslip.unpaidLeaveDays / payslip.totalWorkingDays))}</td></tr>}
                <tr className="font-bold border-t-2 border-[var(--border-color)]">
                  <td>Total Payable</td><td>{payslip.payableDays} / {payslip.totalWorkingDays}</td><td>{formatCurrency(payslip.grossWage)}</td>
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
                <tr className="border-t-2 border-[var(--border-color)] font-bold"><td>Gross</td><td className="text-right">{formatCurrency(payslip.grossWage)}</td></tr>
                {deductions.map((d, i) => (
                  <tr key={i}><td>{d.name}</td><td className="text-right text-[var(--color-danger)]">- {formatCurrency(d.amount)}</td></tr>
                ))}
                <tr className="border-t-2 border-[var(--border-color)] font-bold bg-[rgba(124,58,237,0.05)]"><td>Net Salary</td><td className="text-right text-[var(--color-success)] text-lg">{formatCurrency(payslip.netWage)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable payslip (hidden) */}
      <div className="hidden">
        <div ref={printRef} className="p-8 bg-white text-black" style={{ fontFamily: 'Inter, sans-serif' }}>
          <h2 className="text-xl font-bold text-center mb-1">PAYSLIP</h2>
          <p className="text-center text-sm text-gray-500 mb-6">{formatDate(payslip.periodStart)} – {formatDate(payslip.periodEnd)}</p>
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div><strong>Employee:</strong> {payslip.employeeName}</div>
            <div><strong>Pay Period:</strong> {payslip.payrunName}</div>
          </div>
          <table className="w-full text-sm border-collapse mb-6">
            <thead><tr className="border-b-2"><th className="text-left py-2">Earnings</th><th className="text-right py-2">Amount</th></tr></thead>
            <tbody>
              {components.map((c, i) => <tr key={i} className="border-b"><td className="py-1.5">{c.name}</td><td className="text-right">₹{c.amount?.toFixed(2)}</td></tr>)}
              <tr className="border-b-2 font-bold"><td className="py-2">Gross</td><td className="text-right">₹{payslip.grossWage?.toFixed(2)}</td></tr>
            </tbody>
          </table>
          <table className="w-full text-sm border-collapse mb-6">
            <thead><tr className="border-b-2"><th className="text-left py-2">Deductions</th><th className="text-right py-2">Amount</th></tr></thead>
            <tbody>
              {deductions.map((d, i) => <tr key={i} className="border-b"><td className="py-1.5">{d.name}</td><td className="text-right">₹{d.amount?.toFixed(2)}</td></tr>)}
              <tr className="border-b-2 font-bold"><td className="py-2">Total Deductions</td><td className="text-right">₹{payslip.totalDeductions?.toFixed(2)}</td></tr>
            </tbody>
          </table>
          <div className="border-t-2 pt-3 flex justify-between font-bold text-lg">
            <span>Net Pay</span><span>₹{payslip.netWage?.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2 italic">{numberToWords(payslip.netWage)}</p>
        </div>
      </div>
    </div>
  );
}


