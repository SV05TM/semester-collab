import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/event/:eventId', async (req, res) => {
  try {
    const tasks = await db.tasks.find({ event_id: req.params.eventId }).sort({ deadline: 1 }).lean();

    const enriched = [];
    for (const task of tasks) {
      let assigned_username = null;
      let category_name = null;

      if (task.assigned_to) {
        const user = await db.users.findById(task.assigned_to);
        assigned_username = user?.username || null;
      }
      if (task.category_id) {
        const cat = await db.categories.findById(task.category_id);
        category_name = cat?.name || null;
      }

      enriched.push({ id: task._id.toString(), ...task, assigned_username, category_name });
    }

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load tasks' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { event_id, category_id, title, description, assigned_to, deadline } = req.body;

    if (!event_id || !title) {
      return res.status(400).json({ error: 'Event ID and title are required' });
    }

    const task = await db.tasks.create({
      event_id, category_id: category_id || null, title,
      description: description || '', assigned_to: assigned_to || null,
      status: 'pending', priority: req.body.priority || 'medium', deadline: deadline || null
    });

    if (assigned_to) {
      await db.notifications.create({
        user_id: assigned_to, event_id,
        message: `You've been assigned a new task: "${title}"`
      });
    }

    let assigned_username = null;
    let category_name = null;
    if (task.assigned_to) {
      const user = await db.users.findById(task.assigned_to);
      assigned_username = user?.username || null;
    }
    if (task.category_id) {
      const cat = await db.categories.findById(task.category_id);
      category_name = cat?.name || null;
    }

    res.status(201).json({ id: task._id.toString(), ...task.toObject(), assigned_username, category_name });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description, assigned_to, status, deadline, category_id } = req.body;

    const existing = await db.tasks.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to;
    if (status !== undefined) updates.status = status;
    if (req.body.priority !== undefined) updates.priority = req.body.priority;
    if (deadline !== undefined) updates.deadline = deadline;
    if (category_id !== undefined) updates.category_id = category_id;

    await db.tasks.findByIdAndUpdate(req.params.id, updates);

    if (assigned_to && assigned_to !== existing.assigned_to) {
      await db.notifications.create({
        user_id: assigned_to, event_id: existing.event_id,
        message: `You've been assigned task: "${title || existing.title}"`
      });
    }

    const task = await db.tasks.findById(req.params.id).lean();
    let assigned_username = null;
    let category_name = null;
    if (task.assigned_to) {
      const user = await db.users.findById(task.assigned_to);
      assigned_username = user?.username || null;
    }
    if (task.category_id) {
      const cat = await db.categories.findById(task.category_id);
      category_name = cat?.name || null;
    }

    res.json({ id: task._id.toString(), ...task, assigned_username, category_name });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/:id', async (req, res) => {
  await db.tasks.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
