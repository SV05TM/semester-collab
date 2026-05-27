import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// Get all bookmarks for current user
router.get('/', async (req, res) => {
  try {
    const bookmarks = await db.bookmarks.find({ user_id: req.user.id }).sort({ created_at: -1 }).lean();
    res.json(bookmarks.map(b => ({ id: b._id.toString(), ...b })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load bookmarks' });
  }
});

// Save a bookmark
router.post('/', async (req, res) => {
  try {
    const { title, description, type, estimated_budget, best_time } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });

    const bookmark = await db.bookmarks.create({
      user_id: req.user.id, title, description: description || '',
      type: type || '', estimated_budget: estimated_budget || '', best_time: best_time || ''
    });

    res.status(201).json({ id: bookmark._id.toString(), ...bookmark.toObject() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save bookmark' });
  }
});

// Delete a bookmark
router.delete('/:id', async (req, res) => {
  await db.bookmarks.deleteOne({ _id: req.params.id, user_id: req.user.id });
  res.json({ success: true });
});

export default router;
