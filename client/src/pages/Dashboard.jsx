import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import NotificationBell from '../components/NotificationBell';

export default function Dashboard({ user, onLogout }) {
  const [events, setEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', organization: '', start_date: '', end_date: '', event_time: '', event_location: '', members: []
  });

  useEffect(() => {
    loadEvents();
    loadUsers();
  }, []);

  const loadEvents = async () => {
    const { data } = await api.get('/events');
    setEvents(data);
  };

  const loadUsers = async () => {
    const { data } = await api.get('/auth/users');
    setAllUsers(data.filter(u => u.id !== user.id));
  };

  const createEvent = async (e) => {
    e.preventDefault();
    await api.post('/events', form);
    setForm({ title: '', description: '', organization: '', start_date: '', end_date: '', event_time: '', event_location: '', members: [] });
    setShowCreate(false);
    loadEvents();
  };

  const toggleMember = (userId) => {
    setForm(prev => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter(id => id !== userId)
        : [...prev.members, userId]
    }));
  };

  const eventColors = [
    'from-indigo-500 to-blue-500',
    'from-purple-500 to-pink-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-cyan-500 to-blue-500',
    'from-rose-500 to-pink-500',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white text-sm">🎓</span>
            </div>
            <h1 className="text-xl font-bold gradient-text">Semester Collab</h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell user={user} />
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user.username[0].toUpperCase()}
              </div>
              <span className="text-gray-700 text-sm font-medium hidden sm:block">{user.username}</span>
              <button onClick={onLogout} className="text-sm text-gray-400 hover:text-red-500 transition ml-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Events</h2>
            <p className="text-gray-500 text-sm mt-1">Manage and collaborate on your semester events</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition font-medium shadow-lg shadow-indigo-500/25 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Event
          </button>
        </div>

        {showCreate && (
          <div className="fixed inset-0 glass-overlay flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Create New Event</h3>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={createEvent} className="space-y-4">
                <div>
                  <label htmlFor="org-name" className="block text-sm font-medium text-gray-700 mb-1.5">Organization Name</label>
                  <input
                    id="org-name"
                    type="text"
                    value={form.organization}
                    onChange={(e) => setForm({ ...form, organization: e.target.value })}
                    placeholder="e.g. Phi Iota Alpha"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 mb-1.5">Event Title</label>
                  <input
                    id="event-title"
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                    placeholder="Spring Fundraiser Gala"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="event-desc" className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea
                    id="event-desc"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                    rows={2}
                    placeholder="What's this event about?"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1.5">Event Date</label>
                    <input
                      id="start-date"
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="event-time" className="block text-sm font-medium text-gray-700 mb-1.5">Event Time</label>
                    <input
                      id="event-time"
                      type="time"
                      value={form.event_time}
                      onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="event-location" className="block text-sm font-medium text-gray-700 mb-1.5">Event Location</label>
                  <input
                    id="event-location"
                    type="text"
                    value={form.event_location}
                    onChange={(e) => setForm({ ...form, event_location: e.target.value })}
                    placeholder="e.g. Student Union Building Room 201"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1.5">End Date (optional)</label>
                  <input
                    id="end-date"
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                  />
                </div>
                {allUsers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add Team Members</label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto border border-gray-200 rounded-xl p-3 bg-gray-50">
                      {allUsers.map(u => (
                        <label key={u.id} className="flex items-center gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-white transition">
                          <input
                            type="checkbox"
                            checked={form.members.includes(u.id)}
                            onChange={() => toggleMember(u.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-medium">
                              {u.username[0].toUpperCase()}
                            </div>
                            <span className="text-sm">{u.username}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition">
                    Cancel
                  </button>
                  <button type="submit" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-medium shadow-lg shadow-indigo-500/25 transition">
                    Create Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {events.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-2xl mb-4">
              <span className="text-4xl">📅</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No events yet</h3>
            <p className="text-gray-500 mb-6">Create your first event to start collaborating with your team</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition font-medium shadow-lg shadow-indigo-500/25"
            >
              Create Your First Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event, idx) => (
              <Link
                key={event.id}
                to={`/event/${event.id}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 card-hover block"
              >
                {/* Color bar at top */}
                <div className={`h-2 bg-gradient-to-r ${eventColors[idx % eventColors.length]}`}></div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition">{event.title}</h3>
                      {event.organization && (
                        <p className="text-indigo-600 text-xs font-semibold mt-0.5 uppercase tracking-wide">{event.organization}</p>
                      )}
                    </div>
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-50 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  {event.description && (
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-medium text-gray-600">
                        {event.creator_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span>{event.creator_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {event.start_date && (
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {event.start_date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
