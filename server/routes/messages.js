import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireEventMember, checkEventMemberFromBody } from '../middleware/eventAccess.js';

const router = Router();
router.use(authenticateToken);

router.get('/event/:eventId', requireEventMember('eventId'), async (req, res) => {
  try {
    const messages = await db.messages.find({ event_id: req.params.eventId }).sort({ created_at: 1 }).lean();

    const enriched = [];
    for (const msg of messages) {
      const user = await db.users.findById(msg.user_id);
      enriched.push({ id: msg._id.toString(), ...msg, username: user?.username || 'Unknown' });
    }

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

router.post('/', checkEventMemberFromBody, async (req, res) => {
  try {
    const { event_id, content } = req.body;
    if (!event_id || !content) return res.status(400).json({ error: 'Event ID and content are required' });

    const message = await db.messages.create({ event_id, user_id: req.user.id, content });
    const user = await db.users.findById(req.user.id);
    res.status(201).json({ id: message._id.toString(), ...message.toObject(), username: user?.username || 'Unknown' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
