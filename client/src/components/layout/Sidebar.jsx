import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { canAccess } from '../../utils/roles';
import { getInitials } from '../../utils/formatters';
import {
  Users,
  Clock,
  CalendarOff,
  Wallet,
  BarChart3,
  Settings as SettingsIcon,
  Building2,
  Zap,
  ChevronRight
} from 'lucide-react';

const navItems = [
  { to: '/dashboard/employees', label: 'Employees', icon: Users, module: 'employees' },
  { to: '/dashboard/attendance', label: 'Attendance', icon: Clock, module: 'attendance' },
  { to: '/dashboard/time-off', label: 'Time Off', icon: CalendarOff, module: 'time_off' },
  { to: '/dashboard/payroll', label: 'Payroll', icon: Wallet, module: 'payroll' },
  { to: '/dashboard/reports', label: 'Reports', icon: BarChart3, module: 'reports' },
  { to: '/dashboard/settings', label: 'User Settings', icon: SettingsIcon, module: 'settings' },
  { to: '/dashboard/company', label: 'Company', icon: Building2, module: 'company' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, employee, company } = useAuth();
  const location = useLocation();

  // Role display label mapping
  const roleLabels = {
    admin: 'System Administrator',
    hr_officer: 'HR Operations',
    payroll_officer: 'Payroll Specialist',
    employee: 'Associate'
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 border-r border-[#374151]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          width: 'var(--sidebar-width)',
          background: '#111827',
        }}
      >
        {/* Header: Brand Branding */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-[#374151]">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-blue-600 shadow-lg shadow-emerald-500/20 shrink-0 overflow-hidden"
          >
            {company?.logo_url ? (
              <img 
                src={`${import.meta.env.VITE_API_URL.replace('/api', '')}${company.logo_url}`} 
                alt="Brand" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <Zap size={22} className="text-white fill-emerald-300" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black text-[#f9fafb] tracking-tight uppercase leading-tight truncate">
              {company?.name || 'EmPay'}
            </h2>
            <p className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-[0.1em] opacity-80">
              {company?.logo_url ? 'Smart HRMS' : 'Enterprise ERP'}
            </p>
          </div>
        </div>

        {/* Navigation: Main Links */}
        <nav className="flex-1 py-4 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="px-4 mb-2 text-[10px] font-black text-[#6b7280] uppercase tracking-[0.2em]">Management</p>
          {navItems.map((item) => {
            if (!canAccess(user?.role, item.module)) return null;

            const isActive =
              location.pathname === item.to ||
              (item.to === '/dashboard/employees' && location.pathname.startsWith('/dashboard/employees'));

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 group relative
                  ${
                    isActive
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-[#9ca3af] hover:text-[#f9fafb] hover:bg-[#1f2937]'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {/* Left Border indicator for active state */}
                  {isActive && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-emerald-500 rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  )}

                  <item.icon
                    size={20}
                    className={`shrink-0 transition-transform duration-300 group-hover:scale-110
                      ${isActive ? 'text-emerald-500' : 'text-[#6b7280] group-hover:text-emerald-400'}
                    `}
                  />
                  <span>{item.label}</span>
                </div>
                
                <ChevronRight 
                  size={14} 
                  className={`opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1 group-hover:translate-x-0
                    ${isActive ? 'opacity-100 text-emerald-500/50' : 'text-[#374151]'}
                  `} 
                />
              </NavLink>
            );
          })}
        </nav>

        {/* Profile Anchor: Fixed to bottom */}
        <div className="p-4 mt-auto border-t border-[#374151]/50 bg-[#111827]">
          <div className="bg-[#1f2937] rounded-2xl p-4 border border-[#374151] group hover:border-emerald-500/30 transition-all duration-300 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                {employee?.profile_picture ? (
                  <img
                    src={employee.profile_picture}
                    alt="Profile"
                    className="w-10 h-10 rounded-xl object-cover border border-[#374151]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-sm border border-emerald-500/20">
                    {employee ? getInitials(employee.first_name, employee.last_name) : '?'}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#1f2937] rounded-full" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#f9fafb] truncate leading-tight">
                  {employee ? `${employee.first_name} ${employee.last_name}` : 'Loading User...'}
                </p>
                <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mt-1">
                  {user ? (roleLabels[user.role] || user.role) : 'Checking Role...'}
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-[#374151] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-[#6b7280] uppercase tracking-widest">Workspace</span>
                <span className="text-xs font-bold text-emerald-500 truncate max-w-[120px]">{company?.name || 'EmPay HQ'}</span>
              </div>
              <NavLink 
                to="/dashboard/settings"
                className="w-8 h-8 rounded-lg bg-[#111827] flex items-center justify-center text-[#6b7280] hover:text-emerald-500 hover:bg-[#111827] cursor-pointer transition-all duration-300 border border-transparent hover:border-emerald-500/30 shadow-sm"
                title="System Settings"
              >
                <SettingsIcon size={16} />
              </NavLink>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
