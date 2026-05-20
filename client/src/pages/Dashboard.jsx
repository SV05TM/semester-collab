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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-indigo-600">Semester Collab</h1>
          <div className="flex items-center gap-4">
            <NotificationBell user={user} />
            <span className="text-gray-600">Hi, {user.username}</span>
            <button onClick={onLogout} className="text-sm text-red-500 hover:text-red-700">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Your Events</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            + New Event
          </button>
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Create New Event</h3>
              <form onSubmit={createEvent} className="space-y-4">
                <div>
                  <label htmlFor="org-name" className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                  <input
                    id="org-name"
                    type="text"
                    value={form.organization}
                    onChange={(e) => setForm({ ...form, organization: e.target.value })}
                    placeholder="e.g. Phi Iota Alpha"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                  <input
                    id="event-title"
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="event-desc" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    id="event-desc"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                    <input
                      id="start-date"
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label htmlFor="event-time" className="block text-sm font-medium text-gray-700 mb-1">Event Time</label>
                    <input
                      id="event-time"
                      type="time"
                      value={form.event_time}
                      onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="event-location" className="block text-sm font-medium text-gray-700 mb-1">Event Location</label>
                  <input
                    id="event-location"
                    type="text"
                    value={form.event_location}
                    onChange={(e) => setForm({ ...form, event_location: e.target.value })}
                    placeholder="e.g. Student Union Building Room 201"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">End Date (optional, for multi-day events)</label>
                  <input
                    id="end-date"
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                {allUsers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add Team Members</label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                      {allUsers.map(u => (
                        <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.members.includes(u.id)}
                            onChange={() => toggleMember(u.id)}
                            className="rounded"
                          />
                          <span>{u.username} ({u.email})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                    Cancel
                  </button>
                  <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                    Create Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {events.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No events yet. Create your first event to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(event => (
              <Link
                key={event.id}
                to={`/event/${event.id}`}
                className="bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition block"
              >
                <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                {event.organization && <p className="text-indigo-600 text-xs font-medium mb-1">{event.organization}</p>}
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">{event.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>By {event.creator_name}</span>
                  <div className="text-right">
                    {event.start_date && <span>{event.start_date}</span>}
                    {event.event_time && <span className="ml-1">@ {event.event_time}</span>}
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
