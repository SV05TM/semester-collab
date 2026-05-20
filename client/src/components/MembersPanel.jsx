import { useState, useEffect } from 'react';
import api from '../api';
import socket from '../socket';

export default function MembersPanel({ eventId, members, groups, user, onMembersChanged }) {
  const [allUsers, setAllUsers] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [pingMessage, setPingMessage] = useState('');
  const [pingTarget, setPingTarget] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all' or a group id

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data } = await api.get('/auth/users');
    setAllUsers(data);
  };

  const addMember = async (userId, groupId) => {
    await api.post(`/events/${eventId}/members`, { user_id: userId, group: groupId || null });
    socket.emit('notify-user', {
      user_id: userId,
      event_id: eventId,
      message: `You've been added to an event by ${user.username}`
    });
    onMembersChanged();
    loadUsers();
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
    if (viewMode === groupId) setViewMode('all');
    onMembersChanged();
  };

  const sendPing = (targetUser) => {
    if (!pingMessage.trim()) return;
    socket.emit('notify-user', {
      user_id: targetUser.id,
      event_id: eventId,
      message: `📢 ${user.username} pinged you: "${pingMessage}"`
    });
    setPingMessage('');
    setPingTarget(null);
  };

  const pingAll = () => {
    if (!pingMessage.trim()) return;
    const targets = viewMode === 'all'
      ? members.filter(m => m.id !== user.id)
      : members.filter(m => m.id !== user.id && m.group === viewMode);

    for (const member of targets) {
      socket.emit('notify-user', {
        user_id: member.id,
        event_id: eventId,
        message: `📢 ${user.username} pinged ${viewMode === 'all' ? 'everyone' : 'the group'}: "${pingMessage}"`
      });
    }
    setPingMessage('');
    setPingTarget(null);
  };

  const nonMembers = allUsers.filter(u => !members.some(m => m.id === u.id));

  const displayedMembers = viewMode === 'all'
    ? members
    : viewMode === 'ungrouped'
      ? members.filter(m => !m.group)
      : members.filter(m => m.group === viewMode);

  return (
    <div>
      {/* Group tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm border flex-wrap">
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              viewMode === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All ({members.length})
          </button>
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => setViewMode(g.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                viewMode === g.id ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {g.name} ({members.filter(m => m.group === g.id).length})
            </button>
          ))}
          <button
            onClick={() => setViewMode('ungrouped')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              viewMode === 'ungrouped' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Ungrouped ({members.filter(m => !m.group).length})
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateGroup(true)}
            className="bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 text-sm"
          >
            + Group
          </button>
          <button
            onClick={() => setShowInvite(true)}
            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 text-sm"
          >
            + Add People
          </button>
        </div>
      </div>

      {/* Create group modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Create Group</h3>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g. Marketing Team, Logistics Crew..."
              className="w-full px-3 py-2 border rounded-lg mb-4"
              onKeyDown={(e) => e.key === 'Enter' && createGroup()}
              autoFocus
              aria-label="Group name"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreateGroup(false)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={createGroup} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="bg-white rounded-xl p-4 shadow-sm border mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">
            {viewMode === 'all' ? 'All Members' : viewMode === 'ungrouped' ? 'Ungrouped Members' : groups.find(g => g.id === viewMode)?.name || 'Group'}
            {' '}({displayedMembers.length})
          </h3>
          {viewMode !== 'all' && viewMode !== 'ungrouped' && (
            <button
              onClick={() => deleteGroup(viewMode)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Delete Group
            </button>
          )}
        </div>

        <div className="space-y-2">
          {displayedMembers.map(m => (
            <div key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-medium">
                  {m.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {m.username} {m.id === user.id && '(you)'}
                    {m.role === 'admin' && ' 👑'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {m.group ? groups.find(g => g.id === m.group)?.name || 'Group' : 'No group'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {groups.length > 0 && (
                  <select
                    value={m.group || ''}
                    onChange={(e) => assignGroup(m.id, e.target.value || null)}
                    className="text-xs border rounded px-2 py-1"
                    aria-label={`Group for ${m.username}`}
                  >
                    <option value="">No group</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                )}
                {m.id !== user.id && (
                  <button
                    onClick={() => setPingTarget(pingTarget?.id === m.id ? null : m)}
                    className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full hover:bg-yellow-200"
                  >
                    🔔 Ping
                  </button>
                )}
              </div>
            </div>
          ))}
          {displayedMembers.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">No members in this view.</p>
          )}
        </div>

        {/* Ping individual */}
        {pingTarget && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 mb-2">Ping {pingTarget.username}:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={pingMessage}
                onChange={(e) => setPingMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
                onKeyDown={(e) => e.key === 'Enter' && sendPing(pingTarget)}
                aria-label="Ping message"
              />
              <button onClick={() => sendPing(pingTarget)} className="bg-yellow-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-yellow-600">Send</button>
              <button onClick={() => { setPingTarget(null); setPingMessage(''); }} className="text-gray-500 px-2 text-sm">✕</button>
            </div>
          </div>
        )}
      </div>

      {/* Ping group/all */}
      <div className="bg-white rounded-xl p-4 shadow-sm border mb-4">
        <h3 className="font-semibold mb-2 text-sm">
          📢 Ping {viewMode === 'all' ? 'Everyone' : viewMode === 'ungrouped' ? 'Ungrouped' : groups.find(g => g.id === viewMode)?.name || 'Group'}
        </h3>
        <p className="text-xs text-gray-500 mb-2">Send a notification to {viewMode === 'all' ? 'all' : 'this group of'} team members</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={!pingTarget ? pingMessage : ''}
            onChange={(e) => { setPingTarget(null); setPingMessage(e.target.value); }}
            placeholder="e.g. Meeting at 3pm, don't forget to submit reports..."
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
            onKeyDown={(e) => e.key === 'Enter' && !pingTarget && pingAll()}
            aria-label="Ping all message"
          />
          <button onClick={pingAll} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600">
            📢 Ping
          </button>
        </div>
      </div>

      {/* All registered users list */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <h3 className="font-semibold mb-3 text-sm">All Registered Users ({allUsers.length})</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {allUsers.map(u => {
            const isMember = members.some(m => m.id === u.id);
            return (
              <div key={u.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                    isMember ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {u.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm">{u.username} {u.id === user.id && '(you)'}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                </div>
                {isMember ? (
                  <span className="text-xs text-green-600 font-medium">✓ Member</span>
                ) : (
                  <button
                    onClick={() => addMember(u.id)}
                    className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                  >
                    Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add People to Event</h3>
              <button onClick={() => setShowInvite(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            {nonMembers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">All registered users are already members.</p>
            ) : (
              <div className="space-y-2">
                {nonMembers.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.username}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {groups.length > 0 && (
                        <select
                          className="text-xs border rounded px-2 py-1"
                          defaultValue=""
                          id={`invite-group-${u.id}`}
                          aria-label={`Group for ${u.username}`}
                        >
                          <option value="">No group</option>
                          {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={() => {
                          const select = document.getElementById(`invite-group-${u.id}`);
                          addMember(u.id, select?.value || null);
                        }}
                        className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-indigo-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
