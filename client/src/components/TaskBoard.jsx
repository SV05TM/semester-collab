import { useState, useEffect } from 'react';
import api from '../api';
import socket from '../socket';

export default function TaskBoard({ eventId, categories, members, user }) {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [form, setForm] = useState({
    title: '', description: '', assigned_to: '', category_id: '', deadline: ''
  });

  useEffect(() => {
    loadTasks();
  }, [eventId]);

  useEffect(() => {
    const handleTaskCreated = (task) => {
      setTasks(prev => {
        if (prev.some(t => t.id === task.id)) return prev;
        return [...prev, task];
      });
    };

    const handleTaskUpdated = (task) => {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    };

    const handleTaskDeleted = (data) => {
      setTasks(prev => prev.filter(t => t.id !== data.id));
    };

    socket.on('task-created', handleTaskCreated);
    socket.on('task-updated', handleTaskUpdated);
    socket.on('task-deleted', handleTaskDeleted);

    return () => {
      socket.off('task-created', handleTaskCreated);
      socket.off('task-updated', handleTaskUpdated);
      socket.off('task-deleted', handleTaskDeleted);
    };
  }, []);

  const loadTasks = async () => {
    const { data } = await api.get(`/tasks/event/${eventId}`);
    setTasks(data);
  };

  const createTask = async (e) => {
    e.preventDefault();
    const payload = {
      event_id: eventId,
      title: form.title,
      description: form.description,
      assigned_to: form.assigned_to || null,
      category_id: form.category_id || null,
      deadline: form.deadline || null
    };

    // Optimistic: add to list immediately
    const tempId = 'temp-' + Date.now();
    const assignedMember = members.find(m => m.id === payload.assigned_to);
    const category = categories.find(c => c.id === payload.category_id);
    const optimisticTask = {
      id: tempId,
      ...payload,
      status: 'pending',
      assigned_username: assignedMember?.username || null,
      category_name: category?.name || null,
      created_at: new Date().toISOString()
    };
    setTasks(prev => [optimisticTask, ...prev]);
    setForm({ title: '', description: '', assigned_to: '', category_id: '', deadline: '' });
    setShowForm(false);

    // Then sync with server
    try {
      const { data } = await api.post('/tasks', payload);
      setTasks(prev => prev.map(t => t.id === tempId ? data : t));
    } catch (err) {
      // Remove optimistic task on failure
      setTasks(prev => prev.filter(t => t.id !== tempId));
    }

    if (payload.assigned_to) {
      socket.emit('notify-user', {
        user_id: payload.assigned_to,
        event_id: eventId,
        message: `New task assigned to you: "${form.title}"`
      });
    }
  };

  const sendDeadlineReminders = () => {
    socket.emit('deadline-reminder', { event_id: eventId });
  };

  const updateStatus = async (taskId, status) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    try {
      await api.put(`/tasks/${taskId}`, { status });
    } catch (err) {
      loadTasks(); // Revert on failure
    }
  };

  const deleteTask = async (taskId) => {
    // Optimistic delete
    const prev = tasks;
    setTasks(tasks.filter(t => t.id !== taskId));
    try {
      await api.delete(`/tasks/${taskId}`);
    } catch (err) {
      setTasks(prev); // Revert on failure
    }
  };

  const filteredTasks = activeCategory === 'all'
    ? tasks
    : tasks.filter(t => t.category_id === activeCategory);

  const statusConfig = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
    'in-progress': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-400' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400' }
  };

  const getCategoryCount = (catId) => tasks.filter(t => t.category_id === catId).length;

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div>
      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">{completedCount}/{tasks.length} completed</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Section tabs - scrollable on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 min-w-max">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                activeCategory === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              All ({tasks.length})
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                  activeCategory === c.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {c.name} ({getCategoryCount(c.id)})
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={sendDeadlineReminders}
            className="bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl hover:bg-amber-100 text-sm font-medium transition flex items-center gap-1.5"
            title="Notify all members with upcoming deadlines (within 24h)"
          >
            ⏰ Remind
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 text-sm font-medium shadow-lg shadow-indigo-500/25 transition flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Task
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 glass-overlay flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">New Task</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={createTask} className="space-y-4">
              <div>
                <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input
                  id="task-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                  placeholder="What needs to be done?"
                  required
                />
              </div>
              <div>
                <label htmlFor="task-desc" className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  id="task-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                  rows={2}
                  placeholder="Add details..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="task-category" className="block text-sm font-medium text-gray-700 mb-1.5">Section</label>
                  <select
                    id="task-category"
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                  >
                    <option value="">No section</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="task-assign" className="block text-sm font-medium text-gray-700 mb-1.5">Assign To</label>
                  <select
                    id="task-assign"
                    value={form.assigned_to}
                    onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.username}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="task-deadline" className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
                <input
                  id="task-deadline"
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition">Cancel</button>
                <button type="submit" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-medium shadow-lg shadow-indigo-500/25 transition">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-2xl mb-4">
            <span className="text-3xl">📋</span>
          </div>
          <h3 className="text-gray-700 font-medium mb-1">No tasks yet</h3>
          <p className="text-gray-400 text-sm">Click "Add Task" to create one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => {
            const status = statusConfig[task.status] || statusConfig.pending;
            const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';

            return (
              <div key={task.id} className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 card-hover ${task.status === 'completed' ? 'opacity-75' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h4 className={`font-semibold text-gray-900 ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </h4>
                      {task.category_name && (
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-medium">{task.category_name}</span>
                      )}
                      {isOverdue && (
                        <span className="text-xs bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                          ⚠️ Overdue
                        </span>
                      )}
                    </div>
                    {task.description && <p className="text-sm text-gray-500 mb-2">{task.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {task.assigned_username && (
                        <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                          <span className="w-5 h-5 bg-gradient-to-br from-indigo-400 to-purple-500 text-white rounded-full flex items-center justify-center text-[10px] font-medium">
                            {task.assigned_username[0].toUpperCase()}
                          </span>
                          {task.assigned_username}
                        </span>
                      )}
                      {task.deadline && (
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(task.deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={task.status}
                      onChange={(e) => updateStatus(task.id, e.target.value)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${status.bg} ${status.text} ${status.border} cursor-pointer`}
                      aria-label={`Status for ${task.title}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-gray-300 hover:text-red-500 transition p-1"
                      aria-label={`Delete task ${task.title}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
