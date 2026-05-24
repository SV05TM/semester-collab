import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import NotificationBell from '../components/NotificationBell';

export default function People({ user, onLogout }) {
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('friends');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadFriends();
    loadAllUsers();
  }, []);

  const loadFriends = async () => {
    try {
      const { data } = await api.get('/friends');
      setFriends(data);
    } catch (err) { console.error(err); }
  };

  const loadAllUsers = async () => {
    const { data } = await api.get('/auth/users');
    setAllUsers(data.filter(u => u.id !== user.id));
  };

  const addFriend = async (friendId) => {
    await api.post('/friends', { friend_id: friendId });
    loadFriends();
  };

  const removeFriend = async (friendId) => {
    await api.delete(`/friends/${friendId}`);
    loadFriends();
  };

  const isFriend = (userId) => friends.some(f => f.id === userId);

  const filteredUsers = allUsers.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-indigo-600 hover:text-indigo-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold text-gray-900">People</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell user={user} />
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user.username[0].toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-4">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'friends' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}
          >
            ❤️ Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}
          >
            👥 All Users ({allUsers.length})
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
            aria-label="Search users"
          />
        </div>

        {/* Friends tab */}
        {activeTab === 'friends' && (
          <div className="space-y-2">
            {friends.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <span className="text-4xl block mb-3">👋</span>
                <p className="text-gray-500 mb-1">No friends yet</p>
                <p className="text-gray-400 text-sm">Go to "All Users" to add people</p>
              </div>
            ) : (
              friends
                .filter(f => f.username.toLowerCase().includes(search.toLowerCase()) || f.email.toLowerCase().includes(search.toLowerCase()))
                .map(f => (
                  <div key={f.id} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm">
                        {f.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{f.username}</p>
                        <p className="text-xs text-gray-400">{f.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFriend(f.id)}
                      className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 font-medium transition"
                    >
                      Remove
                    </button>
                  </div>
                ))
            )}
          </div>
        )}

        {/* All users tab */}
        {activeTab === 'all' && (
          <div className="space-y-2">
            {filteredUsers.map(u => (
              <div key={u.id} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    isFriend(u.id) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {u.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{u.username}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                </div>
                {isFriend(u.id) ? (
                  <span className="text-xs text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-lg">✓ Friend</span>
                ) : (
                  <button
                    onClick={() => addFriend(u.id)}
                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-medium transition"
                  >
                    + Add
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
