import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/event/:eventId', async (req, res) => {
  try {
    const notes = await db.meetingNotes.find({ event_id: req.params.eventId }).sort({ meeting_date: -1 }).lean();

    const enriched = [];
    for (const note of notes) {
      const user = await db.users.findById(note.created_by);
      enriched.push({ id: note._id.toString(), ...note, created_by_name: user?.username || 'Unknown' });
    }

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load meeting notes' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const note = await db.meetingNotes.findById(req.params.id).lean();
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const user = await db.users.findById(note.created_by);
    res.json({ id: note._id.toString(), ...note, created_by_name: user?.username || 'Unknown' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load note' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { event_id, title, meeting_date, attendees, agenda, discussion, action_items, decisions } = req.body;
    if (!event_id || !title) return res.status(400).json({ error: 'Event ID and title are required' });

    const note = await db.meetingNotes.create({
      event_id, title, meeting_date: meeting_date || new Date().toISOString(),
      attendees: attendees || [], agenda: agenda || '', discussion: discussion || '',
      action_items: action_items || [], decisions: decisions || '', created_by: req.user.id
    });

    const user = await db.users.findById(req.user.id);
    res.status(201).json({ id: note._id.toString(), ...note.toObject(), created_by_name: user?.username || 'Unknown' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create meeting note' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, meeting_date, attendees, agenda, discussion, action_items, decisions } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (meeting_date !== undefined) updates.meeting_date = meeting_date;
    if (attendees !== undefined) updates.attendees = attendees;
    if (agenda !== undefined) updates.agenda = agenda;
    if (discussion !== undefined) updates.discussion = discussion;
    if (action_items !== undefined) updates.action_items = action_items;
    if (decisions !== undefined) updates.decisions = decisions;

    await db.meetingNotes.findByIdAndUpdate(req.params.id, updates);
    const note = await db.meetingNotes.findById(req.params.id).lean();
    res.json({ id: note._id.toString(), ...note });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

router.delete('/:id', async (req, res) => {
  await db.meetingNotes.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
