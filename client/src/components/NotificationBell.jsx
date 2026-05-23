import { useState, useEffect, useRef } from 'react';
import api from '../api';
import socket from '../socket';
import usePushNotifications from '../usePushNotifications';

export default function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { permission, subscribed, subscribe, unsubscribe } = usePushNotifications(user);

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
        className="relative p-2 text-gray-600 hover:text-gray-800"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border z-50 max-h-[28rem] overflow-hidden">
          <div className="p-3 border-b flex items-center justify-between">
            <span className="font-semibold text-sm">Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Push notification toggle */}
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-600">
              📱 Mobile notifications
            </span>
            {subscribed ? (
              <button onClick={unsubscribe} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300">
                ✓ Enabled
              </button>
            ) : (
              <button onClick={subscribe} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700">
                Enable
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-72">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div key={n.id} className={`p-3 border-b text-sm ${n.is_read ? 'bg-white' : 'bg-indigo-50'}`}>
                  <p>{n.message}</p>
                  <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
