import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import taskRoutes from './routes/tasks.js';
import financeRoutes from './routes/finances.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import pushRoutes from './routes/push.js';

const isProduction = process.env.NODE_ENV === 'production';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();

app.use(cors({
  origin: isProduction ? true : CLIENT_URL
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/push', pushRoutes);

export default app;
