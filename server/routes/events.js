import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.post('/', async (req, res) => {
  try {
    const { title, description, organization, start_date, end_date, event_time, event_location, members } = req.body;

    if (!title) return res.status(400).json({ error: 'Title is required' });

    const event = await db.events.create({
      title, description: description || '', organization: organization || '',
      start_date: start_date || null, end_date: end_date || null,
      event_time: event_time || null, event_location: event_location || '',
      created_by: req.user.id
    });

    const eventId = event._id.toString();

    await db.eventMembers.create({ event_id: eventId, user_id: req.user.id, role: 'admin' });

    if (members && members.length > 0) {
      for (const memberId of members) {
        if (memberId !== req.user.id) {
          await db.eventMembers.create({ event_id: eventId, user_id: memberId, role: 'member' });
        }
      }
    }

    const defaultCategories = ['Finances', 'Marketing', 'Logistics', 'General'];
    for (const name of defaultCategories) {
      await db.categories.create({ event_id: eventId, name });
    }

    res.status(201).json({ id: eventId, ...event.toObject() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.get('/', async (req, res) => {
  try {
    const memberships = await db.eventMembers.find({ user_id: req.user.id }).lean();
    const eventIds = memberships.map(m => m.event_id);
    const events = await db.events.find({ _id: { $in: eventIds } }).sort({ created_at: -1 }).lean();

    const results = [];
    for (const event of events) {
      const creator = await db.users.findById(event.created_by);
      results.push({ id: event._id.toString(), ...event, creator_name: creator?.username || 'Unknown' });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load events' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const event = await db.events.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const eventId = event._id.toString();
    const creator = await db.users.findById(event.created_by);
    const memberships = await db.eventMembers.find({ event_id: eventId }).lean();

    const members = [];
    for (const m of memberships) {
      const user = await db.users.findById(m.user_id);
      if (user) {
        members.push({ id: user._id.toString(), username: user.username, email: user.email, role: m.role, group: m.group || null });
      }
    }

    const categories = await db.categories.find({ event_id: eventId }).lean();
    const groups = await db.groups.find({ event_id: eventId }).lean();

    res.json({
      id: eventId, ...event, creator_name: creator?.username || 'Unknown', members,
      categories: categories.map(c => ({ id: c._id.toString(), name: c.name, event_id: c.event_id })),
      groups: groups.map(g => ({ id: g._id.toString(), name: g.name, event_id: g.event_id }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load event' });
  }
});

router.put('/:id', async (req, res) => {
  const { title, description, organization, start_date, end_date, event_time, event_location } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (organization !== undefined) updates.organization = organization;
  if (start_date !== undefined) updates.start_date = start_date;
  if (end_date !== undefined) updates.end_date = end_date;
  if (event_time !== undefined) updates.event_time = event_time;
  if (event_location !== undefined) updates.event_location = event_location;

  await db.events.findByIdAndUpdate(req.params.id, updates);
  const event = await db.events.findById(req.params.id).lean();
  res.json({ id: event._id.toString(), ...event });
});

router.delete('/:id', async (req, res) => {
  const eventId = req.params.id;
  await db.events.deleteOne({ _id: eventId, created_by: req.user.id });
  await db.eventMembers.deleteMany({ event_id: eventId });
  await db.categories.deleteMany({ event_id: eventId });
  await db.tasks.deleteMany({ event_id: eventId });
  await db.finances.deleteMany({ event_id: eventId });
  await db.messages.deleteMany({ event_id: eventId });
  await db.groups.deleteMany({ event_id: eventId });
  await db.meetingNotes.deleteMany({ event_id: eventId });
  res.json({ success: true });
});

router.post('/:id/members', async (req, res) => {
  const { user_id, group } = req.body;
  const existing = await db.eventMembers.findOne({ event_id: req.params.id, user_id });
  if (!existing) {
    await db.eventMembers.create({ event_id: req.params.id, user_id, role: 'member', group: group || null });
  } else if (group) {
    await db.eventMembers.updateOne({ event_id: req.params.id, user_id }, { group });
  }
  res.json({ success: true });
});

router.put('/:id/members/:userId', async (req, res) => {
  const { group } = req.body;
  await db.eventMembers.updateOne({ event_id: req.params.id, user_id: req.params.userId }, { group: group || null });
  res.json({ success: true });
});

router.post('/:id/groups', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Group name required' });
  const group = await db.groups.create({ event_id: req.params.id, name });
  res.status(201).json({ id: group._id.toString(), event_id: req.params.id, name });
});

router.delete('/:id/groups/:groupId', async (req, res) => {
  await db.groups.findByIdAndDelete(req.params.groupId);
  await db.eventMembers.updateMany({ event_id: req.params.id, group: req.params.groupId }, { group: null });
  res.json({ success: true });
});

router.post('/:id/categories', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name required' });
  const category = await db.categories.create({ event_id: req.params.id, name });
  res.status(201).json({ id: category._id.toString(), event_id: req.params.id, name });
});

export default router;
