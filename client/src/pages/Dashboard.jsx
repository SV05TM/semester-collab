import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import NotificationBell from '../components/NotificationBell';
import CalendarView from '../components/CalendarView';
import ThemeToggle from '../components/ThemeToggle';
import EventIdeas from '../components/EventIdeas';
import UserMenu from '../components/UserMenu';

export default function Dashboard({ user, onLogout, theme, toggleTheme }) {
  const [events, setEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [form, setForm] = useState({
    title: '', description: '', organization: user.organization || '', start_date: '', end_date: '', event_time: '', event_location: '', members: []
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
    // Save org name to user profile
    if (form.organization && form.organization !== user.organization) {
      try {
        await api.put('/auth/me', { organization: form.organization });
        // Update local user data
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        stored.organization = form.organization;
        localStorage.setItem('user', JSON.stringify(stored));
      } catch (err) { /* non-critical */ }
    }
    await api.post('/events', form);
    setForm({ title: '', description: '', organization: form.organization, start_date: '', end_date: '', event_time: '', event_location: '', members: [] });
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

  const deleteEvent = async (eventId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this event? This cannot be undone.')) return;
    try {
      await api.delete(`/events/${eventId}`);
      loadEvents();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete event');
    }
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
    <div className="app-shell">
      <header className="app-header">
        <div className="w-full px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-700 rounded-lg flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-slate-950 dark:text-white">Semester Collab</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell user={user} />
            <UserMenu user={user} onLogout={onLogout} theme={theme} toggleTheme={toggleTheme} />
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-6 sm:px-8">
        <div className="mb-6 rounded-lg border border-stone-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
              <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">Dashboard</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">Your Events</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage and collaborate on your semester events</p>
          </div>
            <div className="flex flex-wrap items-center gap-3">
            {/* View toggle */}
              <div className="flex rounded-lg border border-stone-200 bg-stone-100 p-0.5 dark:border-slate-700 dark:bg-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-950 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                aria-label="Grid view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'calendar' ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-950 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                aria-label="Calendar view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => setShowCreate(true)}
                className="primary-button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Event
            </button>
            </div>
          </div>
        </div>

        {showCreate && (
          <div className="fixed inset-0 glass-overlay flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="panel w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-950 dark:text-white">Create New Event</h3>
                <button onClick={() => setShowCreate(false)} className="icon-button" aria-label="Close create event modal">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={createEvent} className="space-y-4">
                <div>
                  <label htmlFor="org-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Organization Name</label>
                  <div className="relative">
                    <input
                      id="org-name"
                      type="text"
                      value={form.organization}
                      onChange={(e) => setForm({ ...form, organization: e.target.value })}
                      placeholder="e.g. Phi Iota Alpha"
                      className="field-input"
                      list="org-suggestions"
                    />
                    <datalist id="org-suggestions">
                      {(user.organizations || []).map((org, idx) => (
                        <option key={idx} value={org} />
                      ))}
                    </datalist>
                  </div>
                  {(user.organizations || []).length > 0 && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {user.organizations.map((org, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setForm({ ...form, organization: org })}
                          className={`text-[11px] px-2 py-0.5 rounded-full transition ${
                            form.organization === org
                              ? 'bg-teal-700 text-white'
                              : 'bg-stone-100 text-slate-600 hover:bg-stone-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                          }`}
                        >
                          {org}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="event-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Event Title</label>
                  <input
                    id="event-title"
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="field-input"
                    placeholder="Spring Fundraiser Gala"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="event-desc" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                  <textarea
                    id="event-desc"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="field-input"
                    rows={2}
                    placeholder="What's this event about?"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Event Date</label>
                    <input
                      id="start-date"
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="field-input"
                    />
                  </div>
                  <div>
                    <label htmlFor="event-time" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Event Time</label>
                    <input
                      id="event-time"
                      type="time"
                      value={form.event_time}
                      onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                      className="field-input"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="event-location" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Event Location</label>
                  <input
                    id="event-location"
                    type="text"
                    value={form.event_location}
                    onChange={(e) => setForm({ ...form, event_location: e.target.value })}
                    placeholder="e.g. Student Union Building Room 201"
                    className="field-input"
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">End Date (optional)</label>
                  <input
                    id="end-date"
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="field-input"
                  />
                </div>
                {allUsers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Add Team Members</label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto border border-stone-200 rounded-lg p-3 bg-stone-50 dark:border-slate-700 dark:bg-slate-950">
                      {allUsers.map(u => (
                        <label key={u.id} className="flex items-center gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-white transition">
                          <input
                            type="checkbox"
                            checked={form.members.includes(u.id)}
                            onChange={() => toggleMember(u.id)}
                            className="rounded border-stone-300 text-teal-700 focus:ring-teal-600"
                          />
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-teal-100 text-teal-800 rounded-full flex items-center justify-center text-xs font-medium dark:bg-teal-900/40 dark:text-teal-200">
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
                  <button type="button" onClick={() => setShowCreate(false)} className="secondary-button">
                    Cancel
                  </button>
                  <button type="submit" className="primary-button">
                    Create Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* AI Event Ideas */}
        <EventIdeas />

        {events.length === 0 ? (
          <div className="panel py-16 px-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-50 rounded-lg mb-4 dark:bg-teal-950/40">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-700 dark:text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">No events yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Create your first event to start collaborating with your team</p>
            <button
              onClick={() => setShowCreate(true)}
              className="primary-button"
            >
              Create Your First Event
            </button>
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView events={events} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event, idx) => (
              <Link
                key={event.id}
                to={`/event/${event.id}`}
                className="group panel overflow-hidden card-hover block"
              >
                {/* Color bar at top */}
                <div className={`h-2 bg-gradient-to-r ${eventColors[idx % eventColors.length]}`}></div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-950 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition">{event.title}</h3>
                      {event.organization && (
                        <p className="text-teal-700 dark:text-teal-300 text-xs font-semibold mt-0.5 uppercase tracking-wide">{event.organization}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => deleteEvent(event.id, e)}
                      className="w-8 h-8 bg-stone-50 dark:bg-slate-800 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                      aria-label={`Delete ${event.title}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-red-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  {event.description && (
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 min-w-0">
                      <div className="w-5 h-5 bg-stone-100 rounded-full flex items-center justify-center text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {event.creator_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="truncate">{event.creator_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
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
