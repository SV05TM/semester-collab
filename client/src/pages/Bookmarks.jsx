import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import NotificationBell from '../components/NotificationBell';

const TYPE_COLORS = {
  social: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  fundraiser: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  workshop: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'community-service': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  cultural: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  networking: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  academic: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
};

export default function Bookmarks({ user, onLogout }) {
  const [bookmarks, setBookmarks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const { data } = await api.get('/bookmarks');
      setBookmarks(data);
    } catch (err) {
      console.error('Failed to load bookmarks', err);
    }
  };

  const deleteBookmark = async (id) => {
    await api.delete(`/bookmarks/${id}`);
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  const createFromBookmark = async (bookmark) => {
    try {
      const { data } = await api.post('/events', {
        title: bookmark.title,
        description: bookmark.description,
        organization: user.organization || ''
      });
      const eventId = data.id || data._id;
      navigate(`/event/${eventId}`);
    } catch (err) {
      alert('Failed to create event');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="w-full px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Saved Ideas</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell user={user} />
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user.username[0].toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-4 sm:px-8 py-6">
        {bookmarks.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-2xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No saved ideas yet</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Bookmark event ideas from the Dashboard to save them here</p>
            <Link to="/" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">Back to Dashboard</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookmarks.map(bookmark => (
              <div key={bookmark.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">{bookmark.title}</h3>
                    {bookmark.type && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[bookmark.type] || 'bg-gray-100 text-gray-600'}`}>
                        {bookmark.type}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="text-slate-400 hover:text-red-500 transition p-1"
                    aria-label="Remove bookmark"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 flex-1">{bookmark.description}</p>

                <div className="flex gap-3 text-xs text-slate-400 dark:text-slate-500 mb-4">
                  {bookmark.estimated_budget && <span>Budget: {bookmark.estimated_budget}</span>}
                  {bookmark.best_time && <span>Best: {bookmark.best_time} semester</span>}
                </div>

                <button
                  onClick={() => createFromBookmark(bookmark)}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Event
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
