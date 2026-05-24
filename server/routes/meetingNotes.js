import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireEventMember, checkEventMemberFromBody } from '../middleware/eventAccess.js';

const router = Router();
router.use(authenticateToken);

router.get('/event/:eventId', requireEventMember('eventId'), async (req, res) => {
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

    // Verify membership
    const membership = await db.eventMembers.findOne({ event_id: note.event_id, user_id: req.user.id });
    if (!membership) return res.status(403).json({ error: 'You are not a member of this event' });

    const user = await db.users.findById(note.created_by);
    res.json({ id: note._id.toString(), ...note, created_by_name: user?.username || 'Unknown' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load note' });
  }
});

router.post('/', checkEventMemberFromBody, async (req, res) => {
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
    const note = await db.meetingNotes.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const membership = await db.eventMembers.findOne({ event_id: note.event_id, user_id: req.user.id });
    if (!membership) return res.status(403).json({ error: 'You are not a member of this event' });

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
    const updated = await db.meetingNotes.findById(req.params.id).lean();
    res.json({ id: updated._id.toString(), ...updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

router.delete('/:id', async (req, res) => {
  const note = await db.meetingNotes.findById(req.params.id);
  if (!note) return res.json({ success: true });

  const membership = await db.eventMembers.findOne({ event_id: note.event_id, user_id: req.user.id });
  if (!membership) return res.status(403).json({ error: 'You are not a member of this event' });

  await db.meetingNotes.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
