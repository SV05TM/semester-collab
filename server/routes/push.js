import { Router } from 'express';
import webpush from 'web-push';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@semestercollab.com';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC });
});

router.post('/subscribe', async (req, res) => {
  const { subscription } = req.body;
  if (!subscription) return res.status(400).json({ error: 'Subscription object required' });

  const uid = req.user.id.toString();
  await db.pushSubscriptions.deleteMany({ user_id: uid });
  await db.pushSubscriptions.create({ user_id: uid, subscription });
  console.log(`Push subscription saved for user ${uid}`);
  res.json({ success: true });
});

router.post('/unsubscribe', async (req, res) => {
  await db.pushSubscriptions.deleteMany({ user_id: req.user.id });
  res.json({ success: true });
});

export default router;

export async function sendPushToUser(userId, payload) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;

  // Ensure we search by string ID
  const uid = userId?.toString();
  if (!uid) return;

  const subs = await db.pushSubscriptions.find({ user_id: uid }).lean();

  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub.subscription, JSON.stringify(payload));
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await db.pushSubscriptions.findByIdAndDelete(sub._id);
      }
      // Log other errors for debugging
      if (err.statusCode && err.statusCode !== 410 && err.statusCode !== 404) {
        console.error(`Push failed for user ${uid}:`, err.statusCode, err.body);
      }
    }
  }
}
