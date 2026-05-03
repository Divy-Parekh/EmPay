import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markAsRead, markAllAsRead } from '../store/slices/notificationSlice';
import { Bell, Check, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Notifications() {
  const dispatch = useDispatch();
  const { items: notifications, loading } = useSelector((state) => state.notification);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkAsRead = async (id, isRead) => {
    if (!isRead) {
      try {
        await dispatch(markAsRead(id)).unwrap();
      } catch (err) {
        toast.error('Failed to mark notification as read');
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    const hasUnread = notifications.some(n => !n.is_read);
    if (!hasUnread) return;

    try {
      await dispatch(markAllAsRead()).unwrap();
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notifications</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-[rgba(59,130,246,0.1)] hover:bg-[rgba(59,130,246,0.2)] text-[#3B82F6] rounded-lg transition-all text-sm font-bold border border-[#3B82F6]/30 shadow-sm"
          >
            <Check size={16} />
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-card-hover)] flex items-center justify-center mb-4">
            <Bell size={24} className="text-[var(--text-secondary)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No notifications yet</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm">
            When you receive notifications about your account or activity, they will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-lg">
          <div className="divide-y divide-[var(--border-color)]">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleMarkAsRead(notif.id, notif.is_read)}
                className={`p-5 transition-colors duration-200 cursor-pointer flex gap-4 ${
                  !notif.is_read 
                    ? 'bg-[rgba(59,130,246,0.05)] hover:bg-[rgba(59,130,246,0.1)]' 
                    : 'hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                {/* Icon based on type */}
                <div className="mt-1 shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    notif.type === 'timeoff' ? 'bg-[rgba(16,185,129,0.15)] text-[#34D399]' :
                    notif.type === 'payroll' ? 'bg-[rgba(168,85,247,0.15)] text-[#A855F7]' :
                    notif.type === 'employee' ? 'bg-[rgba(59,130,246,0.15)] text-[#3B82F6]' :
                    'bg-[var(--bg-card-hover)] text-[var(--text-secondary)]'
                  }`}>
                    <Bell size={18} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1">
                    <h4 className={`text-base truncate ${!notif.is_read ? 'font-semibold text-[var(--text-primary)]' : 'font-medium text-[var(--text-primary)]'}`}>
                      {notif.title}
                    </h4>
                    <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] shrink-0">
                      <Clock size={12} />
                      {new Date(notif.created_at).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                {!notif.is_read && (
                  <div className="flex items-center shrink-0 pl-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
