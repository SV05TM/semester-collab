import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// Create event with default categories
router.post('/', async (req, res) => {
  try {
    const { title, description, organization, start_date, end_date, event_time, event_location, members } = req.body;

    if (!title) return res.status(400).json({ error: 'Title is required' });

    const event = await db.events.insert({
      title,
      description: description || '',
      organization: organization || '',
      start_date: start_date || null,
      end_date: end_date || null,
      event_time: event_time || null,
      event_location: event_location || '',
      created_by: req.user.id,
      created_at: new Date().toISOString()
    });

    // Add creator as admin member
    await db.eventMembers.insert({ event_id: event._id, user_id: req.user.id, role: 'admin' });

    // Add other members
    if (members && members.length > 0) {
      for (const memberId of members) {
        if (memberId !== req.user.id) {
          await db.eventMembers.insert({ event_id: event._id, user_id: memberId, role: 'member' });
        }
      }
    }

    // Create default categories
    const defaultCategories = ['Finances', 'Marketing', 'Logistics', 'General'];
    for (const name of defaultCategories) {
      await db.categories.insert({ event_id: event._id, name });
    }

    res.status(201).json({ id: event._id, ...event });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Get all events for current user
router.get('/', async (req, res) => {
  try {
    const memberships = await db.eventMembers.find({ user_id: req.user.id });
    const eventIds = memberships.map(m => m.event_id);
    const events = await db.events.find({ _id: { $in: eventIds } }).sort({ created_at: -1 });

    const results = [];
    for (const event of events) {
      const creator = await db.users.findOne({ _id: event.created_by });
      results.push({
        id: event._id,
        ...event,
        creator_name: creator?.username || 'Unknown'
      });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load events' });
  }
});

// Get single event with details
router.get('/:id', async (req, res) => {
  try {
    const event = await db.events.findOne({ _id: req.params.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const creator = await db.users.findOne({ _id: event.created_by });
    const memberships = await db.eventMembers.find({ event_id: event._id });

    const members = [];
    for (const m of memberships) {
      const user = await db.users.findOne({ _id: m.user_id });
      if (user) {
        members.push({ id: user._id, username: user.username, email: user.email, role: m.role, group: m.group || null });
      }
    }

    const categories = await db.categories.find({ event_id: event._id });
    const groups = await db.groups.find({ event_id: event._id });

    res.json({
      id: event._id,
      ...event,
      creator_name: creator?.username || 'Unknown',
      members,
      categories: categories.map(c => ({ id: c._id, name: c.name, event_id: c.event_id })),
      groups: groups.map(g => ({ id: g._id, name: g.name, event_id: g.event_id }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load event' });
  }
});

// Update event
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

  await db.events.update({ _id: req.params.id }, { $set: updates });
  const event = await db.events.findOne({ _id: req.params.id });
  res.json({ id: event._id, ...event });
});

// Delete event
router.delete('/:id', async (req, res) => {
  await db.events.remove({ _id: req.params.id, created_by: req.user.id });
  await db.eventMembers.remove({ event_id: req.params.id }, { multi: true });
  await db.categories.remove({ event_id: req.params.id }, { multi: true });
  await db.tasks.remove({ event_id: req.params.id }, { multi: true });
  await db.finances.remove({ event_id: req.params.id }, { multi: true });
  await db.messages.remove({ event_id: req.params.id }, { multi: true });
  await db.groups.remove({ event_id: req.params.id }, { multi: true });
  res.json({ success: true });
});

// Add member to event
router.post('/:id/members', async (req, res) => {
  const { user_id, group } = req.body;
  const existing = await db.eventMembers.findOne({ event_id: req.params.id, user_id });
  if (!existing) {
    await db.eventMembers.insert({ event_id: req.params.id, user_id, role: 'member', group: group || null });
  } else if (group) {
    await db.eventMembers.update({ event_id: req.params.id, user_id }, { $set: { group } });
  }
  res.json({ success: true });
});

// Update member group
router.put('/:id/members/:userId', async (req, res) => {
  const { group } = req.body;
  await db.eventMembers.update(
    { event_id: req.params.id, user_id: req.params.userId },
    { $set: { group: group || null } }
  );
  res.json({ success: true });
});

// Groups
router.post('/:id/groups', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Group name required' });

  const group = await db.groups.insert({ event_id: req.params.id, name });
  res.status(201).json({ id: group._id, event_id: req.params.id, name });
});

router.delete('/:id/groups/:groupId', async (req, res) => {
  await db.groups.remove({ _id: req.params.groupId });
  // Remove group assignment from members
  const members = await db.eventMembers.find({ event_id: req.params.id, group: req.params.groupId });
  for (const m of members) {
    await db.eventMembers.update({ _id: m._id }, { $set: { group: null } });
  }
  res.json({ success: true });
});

// Add custom category
router.post('/:id/categories', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name required' });

  const category = await db.categories.insert({ event_id: req.params.id, name });
  res.status(201).json({ id: category._id, event_id: req.params.id, name });
});

export default router;
