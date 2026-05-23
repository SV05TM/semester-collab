import { Router } from 'express';
import webpush from 'web-push';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// VAPID keys - in production, set these as environment variables
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@semestercollab.com';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

// Get VAPID public key (client needs this to subscribe)
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC });
});

// Save push subscription for a user
router.post('/subscribe', async (req, res) => {
  const { subscription } = req.body;

  if (!subscription) {
    return res.status(400).json({ error: 'Subscription object required' });
  }

  // Remove old subscriptions for this user, then save new one
  await db.pushSubscriptions.remove({ user_id: req.user.id }, { multi: true });
  await db.pushSubscriptions.insert({
    user_id: req.user.id,
    subscription,
    created_at: new Date().toISOString()
  });

  res.json({ success: true });
});

// Unsubscribe
router.post('/unsubscribe', async (req, res) => {
  await db.pushSubscriptions.remove({ user_id: req.user.id }, { multi: true });
  res.json({ success: true });
});

export default router;

// Helper function to send push to a user (used by other parts of the server)
export async function sendPushToUser(userId, payload) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;

  const subs = await db.pushSubscriptions.find({ user_id: userId });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub.subscription, JSON.stringify(payload));
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription expired, remove it
        await db.pushSubscriptions.remove({ _id: sub._id });
      }
    }
  }
}
