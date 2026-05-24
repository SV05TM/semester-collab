import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// Get all meeting notes for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const notes = await db.meetingNotes.find({ event_id: req.params.eventId }).sort({ meeting_date: -1 });

    const enriched = [];
    for (const note of notes) {
      const user = await db.users.findOne({ _id: note.created_by });
      enriched.push({ id: note._id, ...note, created_by_name: user?.username || 'Unknown' });
    }

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load meeting notes' });
  }
});

// Get single meeting note
router.get('/:id', async (req, res) => {
  try {
    const note = await db.meetingNotes.findOne({ _id: req.params.id });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const user = await db.users.findOne({ _id: note.created_by });
    res.json({ id: note._id, ...note, created_by_name: user?.username || 'Unknown' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load note' });
  }
});

// Create meeting note
router.post('/', async (req, res) => {
  try {
    const { event_id, title, meeting_date, attendees, agenda, discussion, action_items, decisions } = req.body;

    if (!event_id || !title) {
      return res.status(400).json({ error: 'Event ID and title are required' });
    }

    const note = await db.meetingNotes.insert({
      event_id,
      title,
      meeting_date: meeting_date || new Date().toISOString(),
      attendees: attendees || [],
      agenda: agenda || '',
      discussion: discussion || '',
      action_items: action_items || [],
      decisions: decisions || '',
      created_by: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const user = await db.users.findOne({ _id: req.user.id });
    res.status(201).json({ id: note._id, ...note, created_by_name: user?.username || 'Unknown' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create meeting note' });
  }
});

// Update meeting note
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

    await db.meetingNotes.update({ _id: req.params.id }, { $set: updates });
    const note = await db.meetingNotes.findOne({ _id: req.params.id });
    res.json({ id: note._id, ...note });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete meeting note
router.delete('/:id', async (req, res) => {
  await db.meetingNotes.remove({ _id: req.params.id });
  res.json({ success: true });
});

export default router;
