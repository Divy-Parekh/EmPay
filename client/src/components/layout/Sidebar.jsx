import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { canAccess } from '../../utils/roles';
import {
  Users,
  Clock,
  CalendarOff,
  Wallet,
  BarChart3,
  Settings as SettingsIcon,
  Building2,
  LayoutDashboard,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard/employees', label: 'Employees', icon: Users, module: 'employees' },
  { to: '/dashboard/attendance', label: 'Attendance', icon: Clock, module: 'attendance' },
  { to: '/dashboard/time-off', label: 'Time Off', icon: CalendarOff, module: 'time_off' },
  { to: '/dashboard/payroll', label: 'Payroll', icon: Wallet, module: 'payroll' },
  { to: '/dashboard/reports', label: 'Reports', icon: BarChart3, module: 'reports' },
  { to: '/dashboard/settings', label: 'Settings', icon: SettingsIcon, module: 'settings' },
  { to: '/dashboard/company', label: 'Company', icon: Building2, module: 'company' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, company } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          width: 'var(--sidebar-width)',
          background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        {/* Logo + Company Name */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--border-color)]">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-lg shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), #9333EA)',
              boxShadow: '0 2px 10px rgba(124, 58, 237, 0.4)',
            }}
          >
            {company?.name?.[0] || 'E'}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[var(--text-primary)] truncate">
              {company?.name || 'EmPay'}
            </h2>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest">
              HRMS Platform
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
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
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
                  ${
                    isActive
                      ? 'text-white bg-[rgba(124,58,237,0.15)]'
                      : 'text-[var(--text-secondary)] hover:text-white hover:bg-[rgba(124,58,237,0.08)]'
                  }
                `}
              >
                {/* Active indicator */}
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full animate-slide-in-left"
                    style={{ background: 'var(--color-primary)' }}
                  />
                )}

                <item.icon
                  size={18}
                  className={`shrink-0 transition-colors duration-200
                    ${isActive ? 'text-[var(--color-primary)]' : 'group-hover:text-[var(--color-primary)]'}
                  `}
                />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={14} className="text-[var(--text-secondary)]" />
            <span className="text-[11px] text-[var(--text-secondary)]">EmPay v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
