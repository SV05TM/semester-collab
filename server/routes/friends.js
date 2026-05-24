import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// Get my friends list
router.get('/', async (req, res) => {
  try {
    const friendships = await db.friends.find({ user_id: req.user.id }).lean();
    const friendIds = friendships.map(f => f.friend_id);

    const friends = [];
    for (const fid of friendIds) {
      const user = await db.users.findById(fid).select('-password').lean();
      if (user) friends.push({ id: user._id.toString(), username: user.username, email: user.email });
    }

    res.json(friends);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load friends' });
  }
});

// Add friend
router.post('/', async (req, res) => {
  try {
    const { friend_id } = req.body;
    if (!friend_id) return res.status(400).json({ error: 'friend_id required' });
    if (friend_id === req.user.id) return res.status(400).json({ error: 'Cannot add yourself' });

    const existing = await db.friends.findOne({ user_id: req.user.id, friend_id });
    if (existing) return res.status(409).json({ error: 'Already friends' });

    await db.friends.create({ user_id: req.user.id, friend_id });
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add friend' });
  }
});

// Remove friend
router.delete('/:friendId', async (req, res) => {
  await db.friends.deleteOne({ user_id: req.user.id, friend_id: req.params.friendId });
  res.json({ success: true });
});

export default router;
