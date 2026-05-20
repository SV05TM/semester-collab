import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// Get all finance entries for an event (supports section filter)
router.get('/event/:eventId', async (req, res) => {
  try {
    const query = { event_id: req.params.eventId };
    if (req.query.section) {
      query.section = req.query.section;
    }

    const finances = await db.finances.find(query).sort({ created_at: 1 });

    const enriched = [];
    for (const f of finances) {
      const user = await db.users.findOne({ _id: f.created_by });
      enriched.push({ id: f._id, ...f, created_by_name: user?.username || 'Unknown' });
    }

    // Compute totals
    let total_income = 0;
    let total_expense = 0;
    for (const f of finances) {
      if (f.section === 'fundraising') total_income += f.amount || 0;
      else if (f.section === 'budget') {
        total_expense += (f.quantity || 0) * (f.price_per_item || 0);
      }
    }

    res.json({ finances: enriched, total_income, total_expense, balance: total_income - total_expense });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load finances' });
  }
});

// Add finance entry
router.post('/', async (req, res) => {
  try {
    const { event_id, section, ...fields } = req.body;

    if (!event_id || !section) {
      return res.status(400).json({ error: 'event_id and section are required' });
    }

    const entry = {
      event_id,
      section,
      ...fields,
      created_by: req.user.id,
      created_at: new Date().toISOString()
    };

    const finance = await db.finances.insert(entry);
    const user = await db.users.findOne({ _id: req.user.id });
    res.status(201).json({ id: finance._id, ...finance, created_by_name: user?.username || 'Unknown' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add finance entry' });
  }
});

// Update finance entry
router.put('/:id', async (req, res) => {
  try {
    const { ...fields } = req.body;
    delete fields.id;
    delete fields._id;

    await db.finances.update({ _id: req.params.id }, { $set: fields });
    const updated = await db.finances.findOne({ _id: req.params.id });
    res.json({ id: updated._id, ...updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// Delete finance entry
router.delete('/:id', async (req, res) => {
  await db.finances.remove({ _id: req.params.id });
  res.json({ success: true });
});

export default router;
