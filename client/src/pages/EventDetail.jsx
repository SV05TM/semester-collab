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
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
    { id: 'members', label: `Team (${event.members?.length || 0})`, icon: '👥' },
  ];

  const categories = event.categories || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {toast && (
        <div className="fixed top-4 right-4 z-[100] animate-slide-in">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3.5 rounded-xl shadow-2xl shadow-indigo-500/25 max-w-sm flex items-center gap-3">
            <span className="text-lg">🔔</span>
            <p className="text-sm flex-1 font-medium">{toast}</p>
            <button onClick={() => setToast(null)} className="text-white/70 hover:text-white transition">✕</button>
          </div>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 transition text-sm font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <div className="h-5 w-px bg-gray-200"></div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{event.title}</h1>
              {event.organization && <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">{event.organization}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell user={user} />
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user.username[0].toUpperCase()}
              </div>
              <span className="text-gray-700 text-sm font-medium hidden sm:block">{user.username}</span>
              <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Event info card */}
        <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              {event.description && <p className="text-gray-600 mb-3">{event.description}</p>}
              <div className="flex gap-4 flex-wrap text-sm text-gray-500">
                {event.start_date && (
                  <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {event.start_date}
                    {event.end_date && event.end_date !== event.start_date && ` → ${event.end_date}`}
                  </span>
                )}
                {event.event_time && (
                  <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {event.event_time}
                  </span>
                )}
                {event.event_location && (
                  <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.event_location}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportWord}
                disabled={exporting}
                className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition disabled:opacity-50"
              >
                {exporting ? '⏳ Exporting...' : '📄 Export Word'}
              </button>
              <div className="flex -space-x-2">
                {event.members?.slice(0, 5).map(m => (
                  <div key={m.id} className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white" title={m.username}>
                    {m.username[0].toUpperCase()}
                  </div>
                ))}
                {event.members?.length > 5 && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                    +{event.members.length - 5}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

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
