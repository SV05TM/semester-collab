import db from '../db.js';

// Middleware to verify user is a member of the event
export function requireEventMember(eventIdParam = 'eventId') {
  return async (req, res, next) => {
    const eventId = req.params[eventIdParam] || req.body?.event_id;
    if (!eventId) return res.status(400).json({ error: 'Event ID required' });

    const membership = await db.eventMembers.findOne({ event_id: eventId, user_id: req.user.id });
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this event' });
    }

    req.eventMembership = membership;
    next();
  };
}

// Check membership from body's event_id
export async function checkEventMemberFromBody(req, res, next) {
  const eventId = req.body?.event_id;
  if (!eventId) return res.status(400).json({ error: 'Event ID required' });

  const membership = await db.eventMembers.findOne({ event_id: eventId, user_id: req.user.id });
  if (!membership) {
    return res.status(403).json({ error: 'You are not a member of this event' });
  }

  req.eventMembership = membership;
  next();
}
