import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, CheckCircle2, Inbox, Loader2, Clock } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

const typeStyles = {
  approval: 'border-blue-100 bg-blue-50 text-blue-700',
  reminder: 'border-amber-100 bg-amber-50 text-amber-700',
  system: 'border-gray-100 bg-gray-50 text-gray-700',
};

const formatRelativeTime = (value) => {
  if (!value) return '';
  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.getTime())) return '';

  const diffMs = Date.now() - dateValue.getTime();
  if (diffMs < 60 * 1000) return 'just now';

  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  return dateValue.toLocaleString();
};

const NotificationBell = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const payload = await api.get('/notifications', { params: { limit: 10 } });
      const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setNotifications(list);
    } catch (error) {
      toast.error(error?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (!open) {
      fetchNotifications();
    }
  };

  const markNotificationRead = async (notificationId) => {
    const target = notifications.find((item) => item._id === notificationId);
    if (!target || target.isRead) return;
    try {
      await api.post(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId ? { ...notification, isRead: true } : notification
        )
      );
    } catch (error) {
      toast.error(error?.message || 'Failed to update notification');
    }
  };

  const handleMarkAll = async () => {
    try {
      setMarkingAll(true);
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
    } catch (error) {
      toast.error(error?.message || 'Failed to mark notifications as read');
    } finally {
      setMarkingAll(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className={`relative inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-colors hover:bg-gray-100 ${
          open ? 'bg-gray-100 text-gray-900' : ''
        }`}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 max-w-sm rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              <p className="text-xs text-gray-500">Updates from approvals and itineraries</p>
            </div>
            <button
              type="button"
              onClick={handleMarkAll}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
              disabled={markingAll || unreadCount === 0}
            >
              {markingAll ? 'Marking…' : 'Mark all read'}
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto py-2">
            {loading ? (
              <div className="flex flex-col items-center gap-2 py-8 text-sm text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading notifications…
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-sm text-gray-500">
                <Inbox className="h-6 w-6" />
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => {
                const styleKey = notification.type && typeStyles[notification.type] ? notification.type : 'system';
                const badgeClass = typeStyles[styleKey];
                return (
                  <button
                    key={notification._id}
                    type="button"
                    onClick={() => markNotificationRead(notification._id)}
                    className={`flex w-full gap-3 px-4 py-3 text-left transition-colors ${
                      notification.isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/60 hover:bg-blue-50'
                    }`}
                  >
                    <span
                      className={`mt-1 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-xs font-semibold uppercase ${badgeClass}`}
                    >
                      {notification.type?.slice(0, 2) || 'IN'}
                    </span>
                    <span className="flex-1 text-sm text-gray-700">
                      <span className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-900">{notification.title}</span>
                        <span className="text-gray-500">{formatRelativeTime(notification.createdAt)}</span>
                      </span>
                      <span className="mt-1 block text-left text-sm text-gray-600">
                        {notification.message}
                      </span>
                      {!notification.isRead && (
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark as read
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
            <span>
              Last refresh{' '}
              {notifications[0]?.createdAt ? formatRelativeTime(notifications[0].createdAt) : 'just now'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Auto-refreshes on open
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
