import { useState, useEffect, useRef } from 'react';
import api from '../api';
import socket from '../socket';

const COLUMNS = [
  { id: 'pending', label: 'To Do', color: 'border-amber-300', bg: 'bg-amber-50', icon: '⏳' },
  { id: 'in-progress', label: 'In Progress', color: 'border-blue-300', bg: 'bg-blue-50', icon: '🔄' },
  { id: 'completed', label: 'Done', color: 'border-emerald-300', bg: 'bg-emerald-50', icon: '✅' }
];

const PRIORITIES = [
  { id: 'low', label: 'Low', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  { id: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  { id: 'high', label: 'High', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  { id: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' }
];

export default function TaskBoard({ eventId, categories, members, user }) {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [draggedTask, setDraggedTask] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', assigned_to: '', category_id: '', deadline: '', priority: 'medium'
  });

  useEffect(() => { loadTasks(); }, [eventId]);

  const loadTasks = async () => {
    const { data } = await api.get(`/tasks/event/${eventId}`);
    setTasks(data);
  };

  const createTask = async (e) => {
    e.preventDefault();
    const payload = {
      event_id: eventId, title: form.title, description: form.description,
      assigned_to: form.assigned_to || null, category_id: form.category_id || null,
      deadline: form.deadline || null, priority: form.priority
    };

    const tempId = 'temp-' + Date.now();
    const assignedMember = members.find(m => m.id === payload.assigned_to);
    const category = categories.find(c => c.id === payload.category_id);
    setTasks(prev => [...prev, {
      id: tempId, ...payload, status: 'pending',
      assigned_username: assignedMember?.username || null,
      category_name: category?.name || null, created_at: new Date().toISOString()
    }]);
    setForm({ title: '', description: '', assigned_to: '', category_id: '', deadline: '', priority: 'medium' });
    setShowForm(false);

    try {
      const { data } = await api.post('/tasks', payload);
      setTasks(prev => prev.map(t => t.id === tempId ? data : t));
    } catch { setTasks(prev => prev.filter(t => t.id !== tempId)); }

    if (payload.assigned_to) {
      socket.emit('notify-user', { user_id: payload.assigned_to, event_id: eventId, message: `New task assigned to you: "${form.title}"` });
    }
  };

  const updateTask = async (e) => {
    e.preventDefault();
    const updates = {
      title: form.title, description: form.description,
      assigned_to: form.assigned_to || null, category_id: form.category_id || null,
      deadline: form.deadline || null, priority: form.priority, status: form.status || editingTask.status
    };

    // Notify if assignee changed
    const assigneeChanged = updates.assigned_to && updates.assigned_to !== editingTask.assigned_to;

    setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...updates } : t));
    setEditingTask(null);
    setForm({ title: '', description: '', assigned_to: '', category_id: '', deadline: '', priority: 'medium' });

    try {
      await api.put(`/tasks/${editingTask.id}`, updates);
      loadTasks();
    } catch { loadTasks(); }

    if (assigneeChanged) {
      socket.emit('notify-user', {
        user_id: updates.assigned_to,
        event_id: eventId,
        message: `You've been assigned a task: "${updates.title}"`
      });
    }
  };

  const deleteTask = async (taskId) => {
    const prev = tasks;
    setTasks(tasks.filter(t => t.id !== taskId));
    setEditingTask(null);
    try { await api.delete(`/tasks/${taskId}`); } catch { setTasks(prev); }
  };

  const moveTask = async (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try { await api.put(`/tasks/${taskId}`, { status: newStatus }); } catch { loadTasks(); }
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title, description: task.description || '',
      assigned_to: task.assigned_to || '', category_id: task.category_id || '',
      deadline: task.deadline || '', priority: task.priority || 'medium', status: task.status
    });
  };

  // Drag and drop
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== columnId) {
      moveTask(draggedTask.id, columnId);
    }
    setDraggedTask(null);
  };

  // Touch drag for mobile
  const handleTouchMove = (taskId, columnId) => {
    moveTask(taskId, columnId);
  };

  const filteredTasks = activeCategory === 'all' ? tasks : tasks.filter(t => t.category_id === activeCategory);
  const getCategoryCount = (catId) => tasks.filter(t => t.category_id === catId).length;

  const getPriorityConfig = (p) => PRIORITIES.find(pr => pr.id === p) || PRIORITIES[1];

  return (
    <div>
      {/* Category filter + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-gray-100 dark:border-slate-700 min-w-max">
            <button onClick={() => setActiveCategory('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${activeCategory === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
              All ({tasks.length})
            </button>
            {categories.map(c => (
              <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${activeCategory === c.id ? 'bg-indigo-600 text-white' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                {c.name} ({getCategoryCount(c.id)})
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:bg-indigo-700 transition flex items-center gap-1.5 self-end sm:self-auto">
          + Add Task
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {COLUMNS.map(col => {
          const columnTasks = filteredTasks.filter(t => t.status === col.id);
          return (
            <div
              key={col.id}
              className={`rounded-2xl border-t-4 ${col.color} bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 min-h-[200px]`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column header */}
              <div className="p-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{col.icon}</span>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">{col.label}</h3>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{columnTasks.length}</span>
                </div>
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2">
                {columnTasks.map(task => {
                  const priority = getPriorityConfig(task.priority);
                  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onClick={() => openEdit(task)}
                      className={`bg-white dark:bg-slate-750 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-600 rounded-xl p-3 cursor-pointer hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500 transition group ${
                        task.status === 'completed' ? 'opacity-60' : ''
                      }`}
                    >
                      {/* Priority + Category */}
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${priority.color}`}>
                          {priority.label}
                        </span>
                        {task.category_name && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">
                            {task.category_name}
                          </span>
                        )}
                        {isOverdue && (
                          <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">Overdue</span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className={`text-sm font-semibold text-gray-800 mb-1 ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-xs text-gray-400 line-clamp-2 mb-2">{task.description}</p>
                      )}

                      {/* Footer: assignee + deadline */}
                      <div className="flex items-center justify-between mt-2">
                        {task.assigned_username ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                              {task.assigned_username[0].toUpperCase()}
                            </div>
                            <span className="text-[11px] text-gray-500">{task.assigned_username}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-300">Unassigned</span>
                        )}
                        {task.deadline && (
                          <span className={`text-[10px] ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                            {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      {/* Mobile move buttons */}
                      <div className="flex gap-1 mt-2 sm:hidden">
                        {COLUMNS.filter(c => c.id !== task.status).map(c => (
                          <button
                            key={c.id}
                            onClick={(e) => { e.stopPropagation(); handleTouchMove(task.id, c.id); }}
                            className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-200 flex-1"
                          >
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {columnTasks.length === 0 && (
                  <div className="text-center py-6 text-gray-300 text-xs">
                    {col.id === 'pending' ? 'Drop tasks here' : col.id === 'in-progress' ? 'Drag tasks here' : 'Completed tasks'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">New Task</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={createTask} className="space-y-3">
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Task title..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" required />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" rows={2} />
              <div className="grid grid-cols-2 gap-2">
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm" aria-label="Priority">
                  {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label} Priority</option>)}
                </select>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm" aria-label="Section">
                  <option value="">No section</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" aria-label="Assignee">
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
              </select>
              <input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-500 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Edit Task</h3>
              <button onClick={() => setEditingTask(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={updateTask} className="space-y-3">
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Task title..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" required />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" rows={3} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" aria-label="Priority">
                    {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" aria-label="Status">
                    {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Section</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" aria-label="Section">
                  <option value="">No section</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Assignee</label>
                <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" aria-label="Assignee">
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
                <input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <button type="button" onClick={() => deleteTask(editingTask.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete Task</button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditingTask(null)} className="px-4 py-2 text-gray-500 text-sm">Cancel</button>
                  <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">Save Changes</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
