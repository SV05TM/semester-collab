import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import NotificationBell from '../components/NotificationBell';

export default function Profile({ user, onLogout, onUserUpdate }) {
  const [username, setUsername] = useState(user.username);
  const [organization, setOrganization] = useState(user.organization || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const { data } = await api.put('/auth/me', { organization });
      // Update local storage
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.organization = organization;
      stored.organizations = data.user.organizations || stored.organizations;
      localStorage.setItem('user', JSON.stringify(stored));
      if (onUserUpdate) onUserUpdate(stored);
      setMessage('Profile saved');
    } catch (err) {
      setMessage('Failed to save');
    }
    setSaving(false);
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
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Profile</h1>
          </div>
          <NotificationBell user={user} />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Avatar section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-3">
            {user.username[0].toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.username}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
        </div>

        {/* Profile form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Account Settings</h3>

          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Username</label>
              <input
                type="text"
                value={username}
                disabled
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400 mt-1">Username cannot be changed</p>
            </div>

            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Default Organization</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Phi Iota Alpha"
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Auto-fills when creating new events</p>
            </div>

            {message && (
              <p className={`text-sm font-medium ${message === 'Profile saved' ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Danger zone */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm mt-4">
          <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">Account</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Sign out of your account on this device</p>
          <button
            onClick={onLogout}
            className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
