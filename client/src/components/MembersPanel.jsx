import { useState, useEffect } from 'react';
import api from '../api';
import socket from '../socket';

const ROLES = [
  { id: 'member', label: 'Member', color: 'bg-gray-100 text-gray-600' },
  { id: 'co-host', label: 'Co-Host', color: 'bg-blue-100 text-blue-700' },
  { id: 'co-admin', label: 'Co-Admin', color: 'bg-purple-100 text-purple-700' },
  { id: 'admin', label: 'Admin', color: 'bg-indigo-100 text-indigo-700' }
];

export default function MembersPanel({ eventId, members, groups, user, onMembersChanged }) {
  const [allUsers, setAllUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [pingMessage, setPingMessage] = useState('');
  const [pingTarget, setPingTarget] = useState(null);
  const [inviteTab, setInviteTab] = useState('friends');

  const currentUserRole = members.find(m => m.id === user.id)?.role || 'member';
  const isAdmin = ['admin', 'co-admin'].includes(currentUserRole);

  useEffect(() => {
    loadUsers();
    loadFriends();
  }, []);

  const loadUsers = async () => {
    const { data } = await api.get('/auth/users');
    setAllUsers(data);
  };

  const loadFriends = async () => {
    try {
      const { data } = await api.get('/friends');
      setFriends(data);
    } catch (err) { console.error(err); }
  };

  const addMember = async (userId) => {
    try {
      await api.post(`/events/${eventId}/members`, { user_id: userId });
      socket.emit('notify-user', { user_id: userId, event_id: eventId, message: `You've been added to an event by ${user.username}` });
      onMembersChanged();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add member');
    }
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member from the event?')) return;
    try {
      await api.delete(`/events/${eventId}/members/${userId}`);
      onMembersChanged();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const changeRole = async (userId, role) => {
    try {
      await api.put(`/events/${eventId}/members/${userId}`, { role });
      onMembersChanged();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to change role');
    }
  };

  const assignGroup = async (userId, groupId) => {
    await api.put(`/events/${eventId}/members/${userId}`, { group: groupId });
    onMembersChanged();
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    await api.post(`/events/${eventId}/groups`, { name: newGroupName.trim() });
    setNewGroupName('');
    setShowCreateGroup(false);
    onMembersChanged();
  };

  const deleteGroup = async (groupId) => {
    await api.delete(`/events/${eventId}/groups/${groupId}`);
    onMembersChanged();
  };

  const sendPing = (targetUser) => {
    if (!pingMessage.trim()) return;
    socket.emit('notify-user', { user_id: targetUser.id, event_id: eventId, message: `📢 ${user.username}: "${pingMessage}"` });
    setPingMessage('');
    setPingTarget(null);
  };

  const pingAll = () => {
    if (!pingMessage.trim()) return;
    for (const member of members) {
      if (member.id !== user.id) {
        socket.emit('notify-user', { user_id: member.id, event_id: eventId, message: `📢 ${user.username} to everyone: "${pingMessage}"` });
      }
    }
    setPingMessage('');
  };

  const nonMembers = allUsers.filter(u => !members.some(m => m.id === u.id));
  const friendsNotInEvent = friends.filter(f => !members.some(m => m.id === f.id));

  const getRoleConfig = (role) => ROLES.find(r => r.id === role) || ROLES[0];

  return (
    <div>
      {/* Actions bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-bold text-gray-900">Team ({members.length})</h3>
        <div className="flex gap-2">
          <button onClick={() => setShowCreateGroup(true)} className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-100 transition">
            + Group
          </button>
          {isAdmin && (
            <button onClick={() => setShowInvite(true)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700 transition">
              + Add People
            </button>
          )}
        </div>
      </div>

      {/* Members list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        {members.map((m, idx) => {
          const roleConfig = getRoleConfig(m.role);
          const memberGroup = groups.find(g => g.id === m.group);

          return (
            <div key={m.id} className={`p-3 flex items-center justify-between ${idx !== members.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {m.username[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{m.username} {m.id === user.id && '(you)'}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${roleConfig.color}`}>
                      {roleConfig.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {m.email}
                    {memberGroup && ` • ${memberGroup.name}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Ping button */}
                {m.id !== user.id && (
                  <button
                    onClick={() => setPingTarget(pingTarget?.id === m.id ? null : m)}
                    className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-100"
                  >
                    🔔
                  </button>
                )}

                {/* Admin controls */}
                {isAdmin && m.id !== user.id && m.role !== 'admin' && (
                  <>
                    <select
                      value={m.role}
                      onChange={(e) => changeRole(m.id, e.target.value)}
                      className="text-[10px] border border-gray-200 rounded-lg px-1.5 py-1"
                      aria-label={`Role for ${m.username}`}
                    >
                      <option value="member">Member</option>
                      <option value="co-host">Co-Host</option>
                      {currentUserRole === 'admin' && <option value="co-admin">Co-Admin</option>}
                    </select>
                    <button
                      onClick={() => removeMember(m.id)}
                      className="text-xs text-red-400 hover:text-red-600 px-1.5 py-1"
                      aria-label={`Remove ${m.username}`}
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ping area */}
      {pingTarget && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          <p className="text-sm font-medium text-amber-800 mb-2">Ping {pingTarget.username}:</p>
          <div className="flex gap-2">
            <input type="text" value={pingMessage} onChange={(e) => setPingMessage(e.target.value)} placeholder="Message..." className="flex-1 px-3 py-1.5 border rounded-lg text-sm" onKeyDown={(e) => e.key === 'Enter' && sendPing(pingTarget)} aria-label="Ping message" />
            <button onClick={() => sendPing(pingTarget)} className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-amber-600">Send</button>
            <button onClick={() => setPingTarget(null)} className="text-gray-400 px-2">✕</button>
          </div>
        </div>
      )}

      {/* Ping all */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 mb-4">
        <p className="text-xs text-gray-500 mb-2">📢 Ping everyone</p>
        <div className="flex gap-2">
          <input type="text" value={!pingTarget ? pingMessage : ''} onChange={(e) => { setPingTarget(null); setPingMessage(e.target.value); }} placeholder="Broadcast a message..." className="flex-1 px-3 py-2 border rounded-lg text-sm" onKeyDown={(e) => e.key === 'Enter' && !pingTarget && pingAll()} aria-label="Broadcast message" />
          <button onClick={pingAll} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600">Send</button>
        </div>
      </div>

      {/* Groups */}
      {groups.length > 0 && (
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 mb-4">
          <p className="text-xs text-gray-500 mb-2 font-medium">Groups</p>
          <div className="flex flex-wrap gap-2">
            {groups.map(g => (
              <div key={g.id} className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                {g.name} ({members.filter(m => m.group === g.id).length})
                {isAdmin && (
                  <button onClick={() => deleteGroup(g.id)} className="text-purple-400 hover:text-red-500 ml-1">✕</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create group modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-3">Create Group</h3>
            <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Group name..." className="w-full px-3 py-2.5 border rounded-xl mb-3 text-sm" onKeyDown={(e) => e.key === 'Enter' && createGroup()} autoFocus aria-label="Group name" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreateGroup(false)} className="px-4 py-2 text-gray-500 text-sm">Cancel</button>
              <button onClick={createGroup} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Add people modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Add People</h3>
              <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {/* Friends / All toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 mb-4">
              <button onClick={() => setInviteTab('friends')} className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition ${inviteTab === 'friends' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
                Friends ({friendsNotInEvent.length})
              </button>
              <button onClick={() => setInviteTab('all')} className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition ${inviteTab === 'all' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
                All Users ({nonMembers.length})
              </button>
            </div>

            <div className="space-y-2">
              {(inviteTab === 'friends' ? friendsNotInEvent : nonMembers).map(u => (
                <div key={u.id} className="flex items-center justify-between p-2.5 border border-gray-100 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                      {u.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.username}</p>
                      <p className="text-[11px] text-gray-400">{u.email}</p>
                    </div>
                  </div>
                  <button onClick={() => addMember(u.id)} className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-indigo-700">
                    Add
                  </button>
                </div>
              ))}
              {(inviteTab === 'friends' ? friendsNotInEvent : nonMembers).length === 0 && (
                <p className="text-center text-gray-400 text-sm py-6">
                  {inviteTab === 'friends' ? 'All your friends are already in this event' : 'All users are already members'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {!isAdmin && (
        <p className="text-xs text-gray-400 text-center mt-4">Only admins and co-admins can add or remove team members</p>
      )}
    </div>
  );
}
