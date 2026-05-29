import { useState, useEffect, useRef } from 'react';
import api from '../api';
import socket from '../socket';
import usePushNotifications from '../usePushNotifications';

export default function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { subscribed, supported, subscribe, unsubscribe } = usePushNotifications(user);

  useEffect(() => {
    loadNotifications();

    const handleNotification = (data) => {
      setNotifications(prev => [{ id: Date.now(), message: data.message, is_read: 0, created_at: new Date().toISOString() }, ...prev]);
    };

    socket.on('notification', handleNotification);
    return () => socket.off('notification', handleNotification);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    const { data } = await api.get('/notifications');
    setNotifications(data);
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="icon-button relative"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="panel absolute right-0 top-full z-50 mt-2 max-h-[28rem] w-80 overflow-hidden shadow-lg">
          <div className="flex items-center justify-between border-b border-stone-100 p-3 dark:border-slate-800">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-300">
                Mark all read
              </button>
            )}
          </div>

          {supported && (
            <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
              <span className="text-xs text-slate-600 dark:text-slate-300">Mobile notifications</span>
              {subscribed ? (
                <button onClick={unsubscribe} className="rounded bg-stone-200 px-2 py-1 text-xs text-slate-700 hover:bg-stone-300 dark:bg-slate-800 dark:text-slate-200">
                  Enabled
                </button>
              ) : (
                <button onClick={subscribe} className="rounded bg-teal-700 px-2 py-1 text-xs text-white hover:bg-teal-800">
                  Enable
                </button>
              )}
            </div>
          )}

          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">No notifications</div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div key={n.id} className={`border-b border-stone-100 p-3 text-sm dark:border-slate-800 ${n.is_read ? 'bg-white dark:bg-slate-900' : 'bg-teal-50 dark:bg-teal-950/30'}`}>
                  <p className="text-slate-700 dark:text-slate-200">{n.message}</p>
                  <span className="text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
