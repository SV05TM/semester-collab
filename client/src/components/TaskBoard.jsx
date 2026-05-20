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

    await api.post('/tasks', payload);

    if (payload.assigned_to) {
      socket.emit('notify-user', {
        user_id: payload.assigned_to,
        event_id: eventId,
        message: `New task assigned to you: "${form.title}"`
      });
    }

    setForm({ title: '', description: '', assigned_to: '', category_id: '', deadline: '' });
    setShowForm(false);
    loadTasks();
  };

  const sendDeadlineReminders = () => {
    socket.emit('deadline-reminder', { event_id: eventId });
  };

  const updateStatus = async (taskId, status) => {
    await api.put(`/tasks/${taskId}`, { status });
    loadTasks();
  };

  const deleteTask = async (taskId) => {
    await api.delete(`/tasks/${taskId}`);
    loadTasks();
  };

  const filteredTasks = activeCategory === 'all'
    ? tasks
    : tasks.filter(t => t.category_id === activeCategory);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800'
  };

  const getCategoryCount = (catId) => tasks.filter(t => t.category_id === catId).length;

  return (
    <div>
      {/* Section tabs like Finances */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm border flex-wrap">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              activeCategory === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All ({tasks.length})
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                activeCategory === c.id ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {c.name} ({getCategoryCount(c.id)})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={sendDeadlineReminders}
            className="bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 text-sm"
            title="Notify all members with upcoming deadlines (within 24h)"
          >
            ⏰ Remind
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 text-sm"
          >
            + Add Task
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">New Task</h3>
            <form onSubmit={createTask} className="space-y-3">
              <div>
                <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  id="task-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label htmlFor="task-desc" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  id="task-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
              <div>
                <label htmlFor="task-category" className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <select
                  id="task-category"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">No section</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="task-assign" className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  id="task-assign"
                  value={form.assigned_to}
                  onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Unassigned</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="task-deadline" className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  id="task-deadline"
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No tasks in this section. Click "+ Add Task" to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <div key={task.id} className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{task.title}</h4>
                    {task.category_name && (
                      <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{task.category_name}</span>
                    )}
                  </div>
                  {task.description && <p className="text-sm text-gray-600 mb-2">{task.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {task.assigned_username && (
                      <span className="flex items-center gap-1">
                        <span className="w-4 h-4 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[10px] font-medium">
                          {task.assigned_username[0].toUpperCase()}
                        </span>
                        {task.assigned_username}
                      </span>
                    )}
                    {task.deadline && (
                      <span className={`${new Date(task.deadline) < new Date() && task.status !== 'completed' ? 'text-red-500 font-medium' : ''}`}>
                        Due: {new Date(task.deadline).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={task.status}
                    onChange={(e) => updateStatus(task.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-full border-0 ${statusColors[task.status] || 'bg-gray-100'}`}
                    aria-label={`Status for ${task.title}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-red-400 hover:text-red-600 text-sm"
                    aria-label={`Delete task ${task.title}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
