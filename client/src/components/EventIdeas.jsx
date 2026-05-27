import { useState, useEffect } from 'react';
import api from '../api';

const TYPE_COLORS = {
  social: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  fundraiser: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  workshop: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'community-service': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  cultural: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  networking: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  academic: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
};

export default function EventIdeas() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/ai/event-ideas');
      setIdeas(data.ideas || []);
    } catch (err) {
      console.error('Failed to load ideas', err);
      setIdeas([]);
    }
    setLoading(false);
  };

  const bookmarkIdea = async (idea) => {
    setSaving(idea.title);
    try {
      await api.post('/bookmarks', idea);
      setSaving(null);
    } catch (err) {
      console.error('Failed to bookmark', err);
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/5 dark:to-purple-500/5 border border-indigo-200/50 dark:border-indigo-800/50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Generating event ideas...</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white/50 dark:bg-slate-800/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (ideas.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/5 dark:to-purple-500/5 border border-indigo-200/50 dark:border-indigo-800/50 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Event Ideas</h3>
        </div>
        <button
          onClick={loadIdeas}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="space-y-2.5">
        {ideas.map((idea, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-100 dark:border-slate-700 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{idea.title}</h4>
                {idea.type && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[idea.type] || 'bg-gray-100 text-gray-600'}`}>
                    {idea.type}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{idea.description}</p>
              <div className="flex gap-3 mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                {idea.estimated_budget && <span>Budget: {idea.estimated_budget}</span>}
                {idea.best_time && <span>Best: {idea.best_time} semester</span>}
              </div>
            </div>
            <button
              onClick={() => bookmarkIdea(idea)}
              disabled={saving === idea.title}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50"
              aria-label={`Bookmark ${idea.title}`}
            >
              {saving === idea.title ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
