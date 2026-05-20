import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import socket from '../socket';
import TaskBoard from '../components/TaskBoard';
import FinancePanel from '../components/FinancePanel';
import ChatPanel from '../components/ChatPanel';
import MembersPanel from '../components/MembersPanel';
import NotificationBell from '../components/NotificationBell';

export default function EventDetail({ user, onLogout }) {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

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

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!event) return <div className="flex items-center justify-center h-screen">Event not found</div>;

  const tabs = [
    { id: 'tasks', label: '📋 Tasks' },
    { id: 'finances', label: '💰 Finances' },
    { id: 'chat', label: '💬 Chat' },
    { id: 'members', label: `👥 Team (${event.members?.length || 0})` },
  ];

  const categories = event.categories || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className="fixed top-4 right-4 z-[100] animate-slide-in">
          <div className="bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-lg max-w-sm flex items-center gap-3">
            <span className="text-lg">🔔</span>
            <p className="text-sm flex-1">{toast}</p>
            <button onClick={() => setToast(null)} className="text-white/70 hover:text-white">✕</button>
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-indigo-600 hover:text-indigo-800">&larr; Back</Link>
            <div>
              <h1 className="text-xl font-bold">{event.title}</h1>
              {event.organization && <p className="text-xs text-indigo-600 font-medium">{event.organization}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell user={user} />
            <span className="text-gray-600 text-sm">{user.username}</span>
            <button onClick={onLogout} className="text-sm text-red-500 hover:text-red-700">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Event info */}
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border">
          {event.description && <p className="text-gray-600 mb-2">{event.description}</p>}
          <div className="flex gap-4 flex-wrap text-sm text-gray-500">
            {event.start_date && <span>📅 {event.start_date}</span>}
            {event.event_time && <span>🕐 {event.event_time}</span>}
            {event.event_location && <span>📍 {event.event_location}</span>}
            {event.end_date && event.end_date !== event.start_date && <span>→ {event.end_date}</span>}
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {event.members?.map(m => (
              <span key={m.id} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full">
                {m.username} {m.role === 'admin' && '👑'} {m.group && `• ${event.groups?.find(g => g.id === m.group)?.name || ''}`}
              </span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-white rounded-lg p-1 shadow-sm border w-fit flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
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
