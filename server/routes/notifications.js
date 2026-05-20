import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// Get notifications for current user
router.get('/', async (req, res) => {
  try {
    const notifications = await db.notifications.find({ user_id: req.user.id }).sort({ created_at: -1 }).limit(50);
    res.json(notifications.map(n => ({ id: n._id, ...n })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  await db.notifications.update({ _id: req.params.id, user_id: req.user.id }, { $set: { is_read: true } });
  res.json({ success: true });
});

// Mark all as read
router.put('/read-all', async (req, res) => {
  await db.notifications.update({ user_id: req.user.id }, { $set: { is_read: true } }, { multi: true });
  res.json({ success: true });
});

export default router;
