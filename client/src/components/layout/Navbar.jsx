import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { getInitials } from '../../utils/formatters';
import { Menu, User, LogOut, Bell, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchNotifications, markAsRead } from '../../store/slices/notificationSlice';

export default function Navbar({ onMenuToggle }) {
  const dispatch = useDispatch();
  const { user, employee, is_checked_in, toggleCheckIn, logout } = useAuth();
  const { items: notifications, unreadCount } = useSelector((state) => state.notification);
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  
  const dropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  /* Close dropdowns on outside click */
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleToggleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const result = await toggleCheckIn();
      toast.success(result.is_checked_in ? 'Checked in successfully' : 'Checked out successfully');
    } catch (err) {
      toast.error(err?.message || 'Failed to update status');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out');
  };

  const handleNotificationClick = (id, isRead) => {
    if (!isRead) {
      dispatch(markAsRead(id));
    }
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
        {/* Notifications Dropdown */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowDropdown(false);
            }}
            className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors relative"
            title="Notifications"
          >
            <Bell size={20} className="text-[var(--text-secondary)]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden animate-slide-up"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-modal)',
              }}
            >
              <div className="px-4 py-3 border-b border-[var(--border-color)] flex justify-between items-center">
                <h3 className="font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-[rgba(59,130,246,0.15)] text-[#3B82F6] px-2 py-0.5 rounded-full font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 4).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif.id, notif.is_read)}
                      className={`px-4 py-3 border-b border-[var(--border-color)] cursor-pointer transition-colors ${
                        !notif.is_read ? 'bg-[var(--bg-card-hover)]' : 'hover:bg-[var(--bg-card-hover)]'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className={`text-sm ${!notif.is_read ? 'font-semibold text-white' : 'font-medium text-[var(--text-primary)]'}`}>
                          {notif.title}
                        </p>
                        {!notif.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-2">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <Link
                to="/dashboard/notifications"
                onClick={() => setShowNotifDropdown(false)}
                className="block text-center px-4 py-3 text-sm text-[#3B82F6] hover:bg-[var(--bg-card-hover)] font-medium transition-colors border-t border-[var(--border-color)]"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>

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
            onClick={() => {
              setShowDropdown(!showDropdown);
              setShowNotifDropdown(false);
            }}
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
