import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireEventMember, checkEventMemberFromBody } from '../middleware/eventAccess.js';

const router = Router();
router.use(authenticateToken);

router.get('/event/:eventId', requireEventMember('eventId'), async (req, res) => {
  try {
    const query = { event_id: req.params.eventId };
    if (req.query.section) query.section = req.query.section;

    const finances = await db.finances.find(query).sort({ created_at: 1 }).lean();

    const enriched = [];
    for (const f of finances) {
      const user = await db.users.findById(f.created_by);
      enriched.push({ id: f._id.toString(), ...f, created_by_name: user?.username || 'Unknown' });
    }

    let total_income = 0;
    let total_expense = 0;
    for (const f of finances) {
      if (f.section === 'fundraising') total_income += f.revenue || f.amount || 0;
      else if (f.section === 'budget') total_expense += (f.quantity || 0) * (f.price_per_item || 0);
    }

    res.json({ finances: enriched, total_income, total_expense, balance: total_income - total_expense });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load finances' });
  }
});

router.post('/', checkEventMemberFromBody, async (req, res) => {
  try {
    const { event_id, section, ...fields } = req.body;
    if (!event_id || !section) return res.status(400).json({ error: 'event_id and section are required' });

    const finance = await db.finances.create({ event_id, section, ...fields, created_by: req.user.id });
    const user = await db.users.findById(req.user.id);
    res.status(201).json({ id: finance._id.toString(), ...finance.toObject(), created_by_name: user?.username || 'Unknown' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add finance entry' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const entry = await db.finances.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    const membership = await db.eventMembers.findOne({ event_id: entry.event_id, user_id: req.user.id });
    if (!membership) return res.status(403).json({ error: 'You are not a member of this event' });

    const updates = { ...req.body };
    delete updates.id;
    delete updates._id;
    await db.finances.findByIdAndUpdate(req.params.id, updates);
    const updated = await db.finances.findById(req.params.id).lean();
    res.json({ id: updated._id.toString(), ...updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

router.delete('/:id', async (req, res) => {
  const entry = await db.finances.findById(req.params.id);
  if (!entry) return res.json({ success: true });

  const membership = await db.eventMembers.findOne({ event_id: entry.event_id, user_id: req.user.id });
  if (!membership) return res.status(403).json({ error: 'You are not a member of this event' });

  await db.finances.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
