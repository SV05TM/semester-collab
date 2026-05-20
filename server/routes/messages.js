import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// Get messages for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const messages = await db.messages.find({ event_id: req.params.eventId }).sort({ created_at: 1 });

    const enriched = [];
    for (const msg of messages) {
      const user = await db.users.findOne({ _id: msg.user_id });
      enriched.push({ id: msg._id, ...msg, username: user?.username || 'Unknown' });
    }

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// Post a message (REST fallback, main messaging is via socket)
router.post('/', async (req, res) => {
  try {
    const { event_id, content } = req.body;

    if (!event_id || !content) {
      return res.status(400).json({ error: 'Event ID and content are required' });
    }

    const message = await db.messages.insert({
      event_id,
      user_id: req.user.id,
      content,
      created_at: new Date().toISOString()
    });

    const user = await db.users.findOne({ _id: req.user.id });
    res.status(201).json({ id: message._id, ...message, username: user?.username || 'Unknown' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
