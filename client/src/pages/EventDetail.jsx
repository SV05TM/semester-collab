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
import AIAssistant from '../components/AIAssistant';

export default function EventDetail({ user, onLogout }) {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showAI, setShowAI] = useState(false);

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

  const openEditEvent = () => {
    setEditForm({
      title: event.title || '',
      description: event.description || '',
      organization: event.organization || '',
      start_date: event.start_date || '',
      end_date: event.end_date || '',
      event_time: event.event_time || '',
      event_location: event.event_location || ''
    });
    setShowEditEvent(true);
  };

  const saveEventEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/events/${id}`, editForm);
      setShowEditEvent(false);
      loadEvent();
    } catch (err) {
      console.error('Failed to update event', err);
    }
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
    { id: 'tasks', label: 'Tasks', icon: null },
    { id: 'finances', label: 'Finances', icon: null },
    { id: 'planning', label: 'Planning', icon: null },
    { id: 'chat', label: 'Chat', icon: null },
    { id: 'members', label: 'Team', icon: null },
  ];

  const categories = event.categories || [];

  return (
    <div className="min-h-screen bg-slate-100">
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
        <div className="w-full px-4 sm:px-8 py-3 flex items-center justify-between">
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

      <div className="w-full px-4 sm:px-8 py-4">
        {/* Event info card - stacked on mobile */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 mb-4 shadow-sm border border-slate-200">
          {event.description && <p className="text-gray-600 text-sm mb-3">{event.description}</p>}

          {/* Info grid - responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
            {event.start_date && (
              <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2.5 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-[10px] text-indigo-600 font-semibold uppercase">Date</p>
                  <p className="text-sm font-medium text-gray-800">{event.start_date}</p>
                </div>
              </div>
            )}
            {event.event_time && (
              <div className="flex items-center gap-2 bg-purple-50 px-3 py-2.5 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-[10px] text-purple-600 font-semibold uppercase">Time</p>
                  <p className="text-sm font-medium text-gray-800">{event.event_time}</p>
                </div>
              </div>
            )}
            {event.event_location && (
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2.5 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-[10px] text-emerald-600 font-semibold uppercase">Location</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{event.event_location}</p>
                </div>
              </div>
            )}
          </div>

          {/* Members + Actions row */}
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
            <div className="flex items-center gap-2">
              <button
                onClick={openEditEvent}
                className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200 transition"
              >
                ✏️ Edit
              </button>
              <button
                onClick={handleExportWord}
                disabled={exporting}
                className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200 transition disabled:opacity-50"
              >
                {exporting ? '⏳' : '📄'} Export
              </button>
            </div>
          </div>
        </div>

        {/* Edit Event Modal */}
        {showEditEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Edit Event</h3>
                <button onClick={() => setShowEditEvent(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <form onSubmit={saveEventEdit} className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Event Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Organization</label>
                  <input
                    type="text"
                    value={editForm.organization}
                    onChange={(e) => setEditForm({ ...editForm, organization: e.target.value })}
                    placeholder="e.g. Phi Iota Alpha"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Event Date</label>
                    <input
                      type="date"
                      value={editForm.start_date}
                      onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Event Time</label>
                    <input
                      type="time"
                      value={editForm.event_time}
                      onChange={(e) => setEditForm({ ...editForm, event_time: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Location</label>
                  <input
                    type="text"
                    value={editForm.event_location}
                    onChange={(e) => setEditForm({ ...editForm, event_location: e.target.value })}
                    placeholder="e.g. Student Union Room 201"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">End Date (optional)</label>
                  <input
                    type="date"
                    value={editForm.end_date}
                    onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-3 border-t">
                  <button type="button" onClick={() => setShowEditEvent(false)} className="px-4 py-2 text-gray-500 text-sm">Cancel</button>
                  <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabs - horizontally scrollable on mobile */}
        <div className="mb-4 -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {tab.label}
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

      {/* AI Assistant floating button */}
      <button
        onClick={() => setShowAI(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center hover:scale-110 transition-transform z-30"
        aria-label="Open AI Assistant"
      >
        <span className="text-xl">🤖</span>
      </button>

      {/* AI Assistant modal */}
      {showAI && <AIAssistant eventInfo={event} onClose={() => setShowAI(false)} />}
    </div>
  );
}
