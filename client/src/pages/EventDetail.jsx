import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import socket from '../socket';
import TaskBoard from '../components/TaskBoard';
import FinancePanel from '../components/FinancePanel';
import ChatPanel from '../components/ChatPanel';
import MembersPanel from '../components/MembersPanel';
import MeetingNotes from '../components/MeetingNotes';
import NotificationBell from '../components/NotificationBell';

export default function EventDetail({ user, onLogout }) {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [exporting, setExporting] = useState(false);

  const handleExportWord = async () => {
    setExporting(true);
    try {
      const { exportEventToWord } = await import('../exportEventDoc');
      await exportEventToWord(id, event);
    } catch (err) {
      console.error('Export failed', err);
    }
    setExporting(false);
  };

  useEffect(() => {
    loadEvent();
    socket.emit('join-event', id);

    const handleNotification = (data) => {
      setToast(data.message);
      setTimeout(() => setToast(null), 5000);
    };
    socket.on('notification', handleNotification);

    return () => {
      socket.emit('leave-event', id);
      socket.off('notification', handleNotification);
    };
  }, [id]);

  const loadEvent = async () => {
    try {
      const { data } = await api.get(`/events/${id}`);
      setEvent(data);
    } catch (err) {
      console.error('Failed to load event', err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <span className="text-4xl mb-4 block">😕</span>
          <h2 className="text-xl font-bold text-gray-700 mb-2">Event not found</h2>
          <Link to="/" className="text-indigo-600 hover:text-indigo-700 font-medium">Go back to dashboard</Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: '📋' },
    { id: 'finances', label: 'Finances', icon: '💰' },
    { id: 'planning', label: 'Planning', icon: '📝' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'members', label: 'Team', icon: '👥' },
  ];

  const categories = event.categories || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[100] animate-slide-in">
          <div className="bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <span className="text-lg">🔔</span>
            <p className="text-sm flex-1">{toast}</p>
            <button onClick={() => setToast(null)} className="text-white/70 hover:text-white">✕</button>
          </div>
        </div>
      )}

      {/* Header - compact on mobile */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="text-indigo-600 hover:text-indigo-800 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">{event.title}</h1>
              {event.organization && <p className="text-[11px] text-indigo-600 font-semibold uppercase tracking-wide truncate">{event.organization}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <NotificationBell user={user} />
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user.username[0].toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Event info card - stacked on mobile */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 mb-4 shadow-sm border border-gray-100">
          {event.description && <p className="text-gray-600 text-sm mb-3">{event.description}</p>}

          {/* Info grid - responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
            {event.start_date && (
              <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2.5 rounded-xl">
                <span className="text-indigo-500 text-lg">📅</span>
                <div>
                  <p className="text-[10px] text-indigo-600 font-semibold uppercase">Date</p>
                  <p className="text-sm font-medium text-gray-800">{event.start_date}</p>
                </div>
              </div>
            )}
            {event.event_time && (
              <div className="flex items-center gap-2 bg-purple-50 px-3 py-2.5 rounded-xl">
                <span className="text-purple-500 text-lg">🕐</span>
                <div>
                  <p className="text-[10px] text-purple-600 font-semibold uppercase">Time</p>
                  <p className="text-sm font-medium text-gray-800">{event.event_time}</p>
                </div>
              </div>
            )}
            {event.event_location && (
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2.5 rounded-xl">
                <span className="text-emerald-500 text-lg">📍</span>
                <div>
                  <p className="text-[10px] text-emerald-600 font-semibold uppercase">Location</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{event.event_location}</p>
                </div>
              </div>
            )}
          </div>

          {/* Members + Export row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {event.members?.slice(0, 4).map(m => (
                  <div key={m.id} className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white" title={m.username}>
                    {m.username[0].toUpperCase()}
                  </div>
                ))}
                {event.members?.length > 4 && (
                  <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-[10px] font-bold border-2 border-white">
                    +{event.members.length - 4}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500">{event.members?.length} member{event.members?.length !== 1 ? 's' : ''}</span>
            </div>
            <button
              onClick={handleExportWord}
              disabled={exporting}
              className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200 transition disabled:opacity-50"
            >
              {exporting ? '⏳' : '📄'} Export
            </button>
          </div>
        </div>

        {/* Tabs - horizontally scrollable on mobile */}
        <div className="mb-4 -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'tasks' && (
          <TaskBoard eventId={id} categories={categories} members={event.members || []} user={user} />
        )}
        {activeTab === 'finances' && (
          <FinancePanel eventId={id} user={user} eventInfo={event} />
        )}
        {activeTab === 'planning' && (
          <MeetingNotes eventId={id} members={event.members || []} user={user} />
        )}
        {activeTab === 'chat' && (
          <ChatPanel eventId={id} user={user} />
        )}
        {activeTab === 'members' && (
          <MembersPanel
            eventId={id}
            members={event.members || []}
            groups={event.groups || []}
            user={user}
            onMembersChanged={loadEvent}
          />
        )}
      </div>
    </div>
  );
}
