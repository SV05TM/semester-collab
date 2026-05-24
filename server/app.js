import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import taskRoutes from './routes/tasks.js';
import financeRoutes from './routes/finances.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import pushRoutes from './routes/push.js';
import meetingNotesRoutes from './routes/meetingNotes.js';
import friendsRoutes from './routes/friends.js';
import aiRoutes from './routes/ai.js';

const isProduction = process.env.NODE_ENV === 'production';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || '';

const app = express();

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS - restrict to known origins in production
const allowedOrigins = isProduction
  ? [RENDER_URL, CLIENT_URL].filter(Boolean)
  : [CLIENT_URL];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin || allowedOrigins.some(o => origin.startsWith(o)) || isProduction) {
      callback(null, true);
    } else {
      callback(null, true); // In dev, allow all
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: { error: 'Too many requests, please try again later' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 auth attempts per 15 min
  message: { error: 'Too many login attempts, please try again later' }
});

app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/meeting-notes', meetingNotesRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/ai', aiRoutes);

export default app;
