import { useState, useEffect } from 'react';
import api from '../api';

export default function MeetingNotes({ eventId, members, user }) {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '', meeting_date: '', attendees: [], agenda: '', discussion: '', action_items: [], decisions: ''
  });
  const [newActionItem, setNewActionItem] = useState('');

  useEffect(() => {
    loadNotes();
  }, [eventId]);

  const loadNotes = async () => {
    try {
      const { data } = await api.get(`/meeting-notes/event/${eventId}`);
      setNotes(data);
    } catch (err) {
      console.error('Failed to load notes', err);
    }
  };

  const createNote = async (e) => {
    e.preventDefault();
    try {
      await api.post('/meeting-notes', { event_id: eventId, ...form });
      setForm({ title: '', meeting_date: '', attendees: [], agenda: '', discussion: '', action_items: [], decisions: '' });
      setShowCreate(false);
      loadNotes();
    } catch (err) {
      console.error('Failed to create note', err);
    }
  };

  const updateNote = async (noteId, updates) => {
    try {
      await api.put(`/meeting-notes/${noteId}`, updates);
      loadNotes();
      if (activeNote?.id === noteId) {
        setActiveNote(prev => ({ ...prev, ...updates }));
      }
    } catch (err) {
      console.error('Failed to update note', err);
    }
  };

  const deleteNote = async (noteId) => {
    await api.delete(`/meeting-notes/${noteId}`);
    setActiveNote(null);
    loadNotes();
  };

  const addActionItem = () => {
    if (!newActionItem.trim()) return;
    setForm(prev => ({
      ...prev,
      action_items: [...prev.action_items, { text: newActionItem.trim(), done: false }]
    }));
    setNewActionItem('');
  };

  const toggleAttendee = (memberId) => {
    setForm(prev => ({
      ...prev,
      attendees: prev.attendees.includes(memberId)
        ? prev.attendees.filter(id => id !== memberId)
        : [...prev.attendees, memberId]
    }));
  };

  // Detail view of a single note
  if (activeNote) {
    return (
      <div>
        <button
          onClick={() => setActiveNote(null)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 text-sm font-medium mb-4 transition"
        >
          ← Back to all notes
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{activeNote.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(activeNote.meeting_date).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  {' • '}Created by {activeNote.created_by_name}
                </p>
              </div>
              <button
                onClick={() => deleteNote(activeNote.id)}
                className="text-red-400 hover:text-red-600 text-sm px-3 py-1 rounded-lg hover:bg-red-50 transition"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Attendees */}
            {activeNote.attendees?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">👥 Attendees</h3>
                <div className="flex flex-wrap gap-2">
                  {activeNote.attendees.map(id => {
                    const member = members.find(m => m.id === id);
                    return member ? (
                      <span key={id} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium">
                        {member.username}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Agenda */}
            {activeNote.agenda && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">📋 Agenda</h3>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap">{activeNote.agenda}</div>
              </div>
            )}

            {/* Discussion */}
            {activeNote.discussion && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">💬 Discussion Notes</h3>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap">{activeNote.discussion}</div>
              </div>
            )}

            {/* Action Items */}
            {activeNote.action_items?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">✅ Action Items</h3>
                <div className="space-y-2">
                  {activeNote.action_items.map((item, idx) => (
                    <label key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => {
                          const updated = [...activeNote.action_items];
                          updated[idx] = { ...updated[idx], done: !updated[idx].done };
                          updateNote(activeNote.id, { action_items: updated });
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className={`text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Decisions */}
            {activeNote.decisions && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">⚡ Decisions Made</h3>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap">{activeNote.decisions}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Meeting Notes & Planning</h3>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 text-sm font-medium transition shadow-sm"
        >
          + New Meeting Note
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">New Meeting Note</h3>
            <form onSubmit={createNote} className="space-y-4">
              <div>
                <label htmlFor="note-title" className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
                <input
                  id="note-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Weekly Planning, Budget Review..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="note-date" className="block text-sm font-medium text-gray-700 mb-1">Meeting Date</label>
                <input
                  id="note-date"
                  type="datetime-local"
                  value={form.meeting_date}
                  onChange={(e) => setForm({ ...form, meeting_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attendees</label>
                <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-xl max-h-24 overflow-y-auto">
                  {members.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleAttendee(m.id)}
                      className={`text-xs px-2.5 py-1 rounded-full transition font-medium ${
                        form.attendees.includes(m.id)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {m.username}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="note-agenda" className="block text-sm font-medium text-gray-700 mb-1">Agenda</label>
                <textarea
                  id="note-agenda"
                  value={form.agenda}
                  onChange={(e) => setForm({ ...form, agenda: e.target.value })}
                  placeholder="What needs to be discussed..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  rows={3}
                />
              </div>
              <div>
                <label htmlFor="note-discussion" className="block text-sm font-medium text-gray-700 mb-1">Discussion Notes</label>
                <textarea
                  id="note-discussion"
                  value={form.discussion}
                  onChange={(e) => setForm({ ...form, discussion: e.target.value })}
                  placeholder="Key points discussed during the meeting..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action Items</label>
                <div className="space-y-2 mb-2">
                  {form.action_items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-1.5 rounded-lg">
                      <span className="text-indigo-600">•</span>
                      <span className="flex-1">{item.text}</span>
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, action_items: prev.action_items.filter((_, i) => i !== idx) }))}
                        className="text-red-400 hover:text-red-600"
                      >✕</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newActionItem}
                    onChange={(e) => setNewActionItem(e.target.value)}
                    placeholder="Add an action item..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addActionItem())}
                  />
                  <button type="button" onClick={addActionItem} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-3">Add</button>
                </div>
              </div>
              <div>
                <label htmlFor="note-decisions" className="block text-sm font-medium text-gray-700 mb-1">Decisions Made</label>
                <textarea
                  id="note-decisions"
                  value={form.decisions}
                  onChange={(e) => setForm({ ...form, decisions: e.target.value })}
                  placeholder="Key decisions and outcomes..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  rows={2}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 font-medium">Save Note</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <span className="text-4xl block mb-3">📝</span>
          <p className="text-gray-500 mb-1">No meeting notes yet</p>
          <p className="text-gray-400 text-sm">Create one to start documenting your planning sessions</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {notes.map(note => (
            <button
              key={note.id}
              onClick={() => setActiveNote(note)}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-indigo-200 hover:shadow-md transition text-left w-full"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">{note.title}</h4>
                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                  {new Date(note.meeting_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
              {note.agenda && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{note.agenda}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-400">
                {note.action_items?.length > 0 && (
                  <span>✅ {note.action_items.filter(i => i.done).length}/{note.action_items.length} done</span>
                )}
                {note.attendees?.length > 0 && (
                  <span>👥 {note.attendees.length}</span>
                )}
                <span>By {note.created_by_name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
