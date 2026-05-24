import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const notifications = await db.notifications.find({ user_id: req.user.id }).sort({ created_at: -1 }).limit(50).lean();
    res.json(notifications.map(n => ({ id: n._id.toString(), ...n })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

router.put('/:id/read', async (req, res) => {
  await db.notifications.findOneAndUpdate({ _id: req.params.id, user_id: req.user.id }, { is_read: true });
  res.json({ success: true });
});

router.put('/read-all', async (req, res) => {
  await db.notifications.updateMany({ user_id: req.user.id }, { is_read: true });
  res.json({ success: true });
});

export default router;
