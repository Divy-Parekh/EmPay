import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getInitials } from '../../utils/formatters';
import { Menu, User, LogOut, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar({ onMenuToggle }) {
  const { user, employee, is_checked_in, toggleCheckIn, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  /* Close dropdown on outside click */
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleToggleCheckIn = async () => {
    setCheckingIn(true);
    const res = await toggleCheckIn();
    setCheckingIn(false);
    if (res?.success) {
      toast.success(is_checked_in ? 'Checked out successfully' : 'Checked in successfully');
    } else {
      toast.error(res?.error?.message || 'Failed to update status');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out');
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6"
      style={{
        height: 'var(--navbar-height)',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      {/* Left — menu toggle (mobile) */}
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors lg:hidden"
        id="navbar-menu-toggle"
      >
        <Menu size={20} className="text-[var(--text-secondary)]" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right — Status + Avatar */}
      <div className="flex items-center gap-3">
        {/* Check In / Out button */}
        <button
          onClick={handleToggleCheckIn}
          disabled={checkingIn}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${
              is_checked_in
                ? 'bg-[rgba(16,185,129,0.15)] text-[#34D399] hover:bg-[rgba(16,185,129,0.25)]'
                : 'bg-[rgba(239,68,68,0.15)] text-[#F87171] hover:bg-[rgba(239,68,68,0.25)]'
            }
            ${checkingIn ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          id="navbar-checkin-btn"
        >
          {/* Status dot */}
          <span
            className={`w-2.5 h-2.5 rounded-full ${is_checked_in ? 'animate-pulse-dot' : ''}`}
            style={{
              background: is_checked_in ? 'var(--color-success)' : 'var(--color-danger)',
              boxShadow: is_checked_in
                ? '0 0 8px rgba(16, 185, 129, 0.5)'
                : '0 0 8px rgba(239, 68, 68, 0.5)',
            }}
          />
          <span>{checkingIn ? '...' : is_checked_in ? 'Check Out' : 'Check In'}</span>
        </button>

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors"
            id="navbar-profile-btn"
          >
            {/* Avatar */}
            {employee?.profile_picture ? (
              <img
                src={employee.profile_picture}
                alt=""
                className="w-8 h-8 rounded-full object-cover ring-2 ring-[var(--border-color)]"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary), #9333EA)',
                }}
              >
                {getInitials(employee?.first_name, employee?.last_name)}
              </div>
            )}
            <ChevronDown
              size={14}
              className={`text-[var(--text-secondary)] transition-transform duration-200
                ${showDropdown ? 'rotate-180' : ''}
              `}
            />
          </button>

          {/* Dropdown menu */}
          {showDropdown && (
            <div
              className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden animate-slide-up"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-modal)',
              }}
            >
              {/* User info */}
              <div className="px-4 py-3 border-b border-[var(--border-color)]">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {employee?.first_name} {employee?.last_name}
                </p>
                <p className="text-xs text-[var(--text-secondary)] truncate">{user?.email}</p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    navigate('/dashboard/profile');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-card-hover)] transition-colors"
                  id="navbar-myprofile-btn"
                >
                  <User size={16} />
                  My Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#F87171] hover:bg-[rgba(239,68,68,0.1)] transition-colors"
                  id="navbar-logout-btn"
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
