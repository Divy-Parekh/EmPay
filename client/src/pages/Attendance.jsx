import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { attendanceApi } from '../api/attendance.api';
import { canAccess } from '../utils/roles';
import { formatTime, formatHours, getMonthName } from '../utils/formatters';
import DateNavigator from '../components/common/DateNavigator';
import StatusBadge from '../components/common/StatusBadge';
import { CalendarDays, Clock, TreePalm } from 'lucide-react';

export default function Attendance() {
  const { user } = useAuth();
  const isAdmin = canAccess(user?.role, 'settings') || user?.role === 'hr_officer' || user?.role === 'payroll_officer';
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) fetchAll();
    else fetchMy();
  }, [date, month, year]);

  const fetchAll = async () => {
    setLoading(true);
    const res = await attendanceApi.getAll({ date });
    if (res.success) setRecords(res.data || []);
    setLoading(false);
  };

  const fetchMy = async () => {
    setLoading(true);
    const res = await attendanceApi.getMy({ month, year });
    if (res.success) { setRecords(res.data?.records || []); setSummary(res.data?.summary || null); }
    setLoading(false);
  };

  const handleMonthChange = (dir) => {
    let m = month + dir, y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold">Attendance</h1>

      {isAdmin ? (
        /* Admin view — daily, all employees */
        <>
          <div className="flex items-center gap-4 flex-wrap">
            <DateNavigator date={date} onDateChange={setDate} />
          </div>

          <div className="card">
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Employee</th><th>Check In</th><th>Check Out</th><th>Work Hours</th><th>Extra Hours</th><th>Status</th></tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-8 text-[var(--text-secondary)]">Loading...</td></tr>
                  ) : records.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-[var(--text-secondary)]">No attendance records for this date</td></tr>
                  ) : records.map((r, i) => (
                    <tr key={i}>
                      <td className="font-medium">{r.employee_name || `${r.first_name} ${r.last_name}`}</td>
                      <td>{formatTime(r.check_in)}</td>
                      <td>{formatTime(r.check_out)}</td>
                      <td>{formatHours(r.work_hours)}</td>
                      <td>{formatHours(r.extra_hours)}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Employee view — monthly, own records */
        <>
          <div className="flex items-center gap-4 flex-wrap">
            <button onClick={() => handleMonthChange(-1)} className="btn-secondary px-3 py-2">←</button>
            <span className="text-sm font-medium">{getMonthName(month)} {year}</span>
            <button onClick={() => handleMonthChange(1)} className="btn-secondary px-3 py-2">→</button>
          </div>

          {/* Stats */}
          {summary && (
            <div className="grid grid-cols-3 gap-4">
              <div className="card p-4 text-center">
                <CalendarDays size={20} className="mx-auto mb-2 text-[var(--color-success)]" />
                <p className="text-2xl font-bold text-[var(--color-success)]">{summary.days_present}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Days Present</p>
              </div>
              <div className="card p-4 text-center">
                <TreePalm size={20} className="mx-auto mb-2 text-[var(--color-info)]" />
                <p className="text-2xl font-bold text-[var(--color-info)]">{summary.leaves_remaining}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Leaves Remaining</p>
              </div>
              <div className="card p-4 text-center">
                <Clock size={20} className="mx-auto mb-2 text-[var(--text-accent)]" />
                <p className="text-2xl font-bold">{summary.total_working_days}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Total Working Days</p>
              </div>
            </div>
          )}

          <div className="card">
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Work Hours</th><th>Extra Hours</th><th>Status</th></tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-8 text-[var(--text-secondary)]">Loading...</td></tr>
                  ) : records.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-[var(--text-secondary)]">No records for this month</td></tr>
                  ) : records.map((r, i) => (
                    <tr key={i}>
                      <td className="font-medium">{r.date}</td>
                      <td>{formatTime(r.check_in)}</td>
                      <td>{formatTime(r.check_out)}</td>
                      <td>{formatHours(r.work_hours)}</td>
                      <td>{formatHours(r.extra_hours)}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
