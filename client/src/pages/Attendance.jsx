import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { fetchAllAttendance, fetchMyAttendance } from '../store/slices/attendanceSlice';
import { canAccess } from '../utils/roles';
import { formatTime, formatHours, getMonthName, formatDate } from '../utils/formatters';
import DateNavigator from '../components/common/DateNavigator';
import StatusBadge from '../components/common/StatusBadge';
import CustomSelect from '../components/common/CustomSelect';
import { CalendarDays, Clock, TreePalm, ChevronDown, ChevronUp, BarChart2, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { statsApi } from '../api/stats.api';

export default function Attendance() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const isAdmin = canAccess(user?.role, 'settings') || user?.role === 'hr_officer' || user?.role === 'payroll_officer';

  const monthOptions = useMemo(() => [...Array(12)].map((_, i) => ({
    value: i + 1,
    label: new Date(0, i).toLocaleString('en', { month: 'long' })
  })), []);

  const yearOptions = [2024, 2025, 2026].map(y => ({ value: y, label: y.toString() }));
  
  const { adminRecords, myRecords, summary, loading } = useSelector((state) => state.attendance);
  
  // Group employee records by date
  const groupedMyRecords = useMemo(() => {
    if (isAdmin) return [];
    const groups = {};
    myRecords.forEach(r => {
      if (!groups[r.date]) {
        groups[r.date] = {
          date: r.date,
          check_in: r.check_in,
          check_out: r.check_out,
          work_hours: 0,
          extra_hours: 0,
          status: r.status,
          sessions: []
        };
      }
      groups[r.date].sessions.push(r);
      groups[r.date].work_hours += parseFloat(r.work_hours) || 0;
      groups[r.date].extra_hours += parseFloat(r.extra_hours) || 0;
      // Update check-in to earliest and check-out to latest
      if (new Date(r.check_in) < new Date(groups[r.date].check_in)) groups[r.date].check_in = r.check_in;
      if (!groups[r.date].check_out || (r.check_out && new Date(r.check_out) > new Date(groups[r.date].check_out))) {
        groups[r.date].check_out = r.check_out;
      }
    });
    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  }, [myRecords, isAdmin]);

  const records = isAdmin ? adminRecords : groupedMyRecords;

  const today = new Date().toLocaleDateString('en-CA'); 
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [expandedRows, setExpandedRows] = useState({});

  const { is_checked_in } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchAllAttendance({ date }));
      loadStats();
    } else {
      dispatch(fetchMyAttendance({ month, year }));
    }
  }, [dispatch, isAdmin, date, month, year, is_checked_in]);

  const loadStats = async () => {
    try {
      const res = await statsApi.getAttendanceStats();
      if (res.success) setStats(res.data);
    } catch (err) {
      console.error('Failed to load attendance stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMonthChange = (dir) => {
    let m = month + dir, y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
    setExpandedRows({});
  };

  const renderSessionDetails = (sessions) => (
    <tr className="bg-[rgba(124,58,237,0.03)] border-b border-[var(--border-color)]">
      <td colSpan={isAdmin ? 6 : 6} className="px-6 py-4">
        <div className="flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-accent)] font-bold mb-1">Individual Sessions</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessions.map((s, idx) => (
              <div key={idx} className="flex flex-col p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-card-hover)] text-[var(--text-secondary)]">Session #{idx + 1}</span>
                  <span className="text-xs font-semibold text-[var(--color-success)]">{formatHours(s.work_hours)} hrs</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">In</span>
                    <span className="text-[var(--text-primary)]">{formatTime(s.check_in)}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Out</span>
                    <span className="text-[var(--text-primary)]">{s.check_out ? formatTime(s.check_out) : '--:--'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold">Attendance</h1>

      {isAdmin ? (
        /* Admin view — daily, all employees */
        <>
          {/* Admin Analytics */}
          {!statsLoading && stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Daily Trend */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart2 size={18} className="text-emerald-500" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Daily Trends (Last 7 Days)</h2>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.attendanceTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                      <Legend />
                      <Bar dataKey="present" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="absent" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="on_leave" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Work Hours Trend */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Activity size={18} className="text-blue-500" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Average Work Hours</h2>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.workHoursTrend}>
                      <defs>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                      <Area type="monotone" dataKey="hours" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 flex-wrap">
            <DateNavigator date={date} onDateChange={setDate} />
          </div>

          <div className="card">
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th></th><th>Employee</th><th>Check In</th><th>Check Out</th><th>Total Hours</th><th>Status</th></tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-8 text-[var(--text-secondary)]">Loading...</td></tr>
                  ) : records.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-[var(--text-secondary)]">No attendance records for this date</td></tr>
                  ) : records.map((r, i) => {
                    const rowId = r.employee_id;
                    const hasMultiple = r.sessions && r.sessions.length > 1;
                    const isExpanded = expandedRows[rowId];

                    return (
                      <Fragment key={rowId}>
                        <tr 
                          className={`${hasMultiple ? 'cursor-pointer hover:bg-[var(--bg-card-hover)]' : ''} transition-colors`}
                          onClick={() => hasMultiple && toggleRow(rowId)}
                        >
                          <td className="w-8 text-center">
                            {hasMultiple && (
                              isExpanded ? <ChevronUp size={16} className="text-[var(--color-primary)]" /> : <ChevronDown size={16} className="text-[var(--text-secondary)]" />
                            )}
                          </td>
                          <td className="font-medium">
                            <div className="flex flex-col">
                              <span>{r.employee_name || `${r.first_name} ${r.last_name}`}</span>
                              {hasMultiple && <span className="text-[10px] text-[var(--color-primary)] font-bold">{r.sessions.length} sessions</span>}
                            </div>
                          </td>
                          <td>{formatTime(r.check_in)}</td>
                          <td>{formatTime(r.check_out)}</td>
                          <td>{formatHours(r.work_hours)}</td>
                          <td><StatusBadge status={r.status} /></td>
                        </tr>
                        {isExpanded && hasMultiple && renderSessionDetails(r.sessions)}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Employee view — monthly, own records */
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <CustomSelect 
              options={monthOptions}
              value={month}
              onChange={setMonth}
              className="w-40"
            />
            <CustomSelect 
              options={yearOptions}
              value={year}
              onChange={setYear}
              className="w-32"
            />
          </div>

          {/* Stats Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <p className="text-2xl font-bold">{formatHours(summary.total_work_hours)}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Total Hours</p>
              </div>
              <div className="card p-4 text-center">
                <CalendarDays size={20} className="mx-auto mb-2 text-[var(--text-secondary)]" />
                <p className="text-2xl font-bold">{summary.total_working_days}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Working Days</p>
              </div>
            </div>
          )}

          <div className="card">
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th></th><th>Date</th><th>First In</th><th>Last Out</th><th>Total Hours</th><th>Status</th></tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-8 text-[var(--text-secondary)]">Loading...</td></tr>
                  ) : records.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-[var(--text-secondary)]">No records for this month</td></tr>
                  ) : records.map((r, i) => {
                    const rowId = r.date;
                    const hasMultiple = r.sessions && r.sessions.length > 1;
                    const isExpanded = expandedRows[rowId];

                    return (
                      <Fragment key={rowId}>
                        <tr 
                          className={`${hasMultiple ? 'cursor-pointer hover:bg-[var(--bg-card-hover)]' : ''} transition-colors`}
                          onClick={() => hasMultiple && toggleRow(rowId)}
                        >
                          <td className="w-8 text-center">
                            {hasMultiple && (
                              isExpanded ? <ChevronUp size={16} className="text-[var(--color-primary)]" /> : <ChevronDown size={16} className="text-[var(--text-secondary)]" />
                            )}
                          </td>
                          <td className="font-medium">
                            <div className="flex flex-col">
                              <span>{formatDate(r.date)}</span>
                              {hasMultiple && <span className="text-[10px] text-[var(--color-primary)] font-bold">{r.sessions.length} sessions</span>}
                            </div>
                          </td>
                          <td>{formatTime(r.check_in)}</td>
                          <td>{formatTime(r.check_out)}</td>
                          <td>{formatHours(r.work_hours)}</td>
                          <td><StatusBadge status={r.status} /></td>
                        </tr>
                        {isExpanded && hasMultiple && renderSessionDetails(r.sessions)}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
