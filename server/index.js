import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import app from './app.js';
import db, { connectDB } from './db.js';
import { sendPushToUser } from './routes/push.js';

const JWT_SECRET = process.env.JWT_SECRET || 'semester-collab-secret-key-change-in-production';

// Connect to MongoDB
await connectDB();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: isProduction ? true : CLIENT_URL,
    methods: ['GET', 'POST']
  }
});

// In production, serve the built client files
if (isProduction) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  const express = await import('express');
  app.use(express.default.static(clientDist));

  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDist, 'index.html'));
    }
  });
}

// Socket.IO for real-time communication
const onlineUsers = new Map();

// Socket authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    socket.username = decoded.username;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id, socket.username);

  // Auto-register with verified user ID
  onlineUsers.set(socket.userId, socket.id);

  socket.on('join-event', (eventId) => {
    socket.join(`event-${eventId}`);
  });

  socket.on('leave-event', (eventId) => {
    socket.leave(`event-${eventId}`);
  });

  socket.on('send-message', async (data) => {
    const { event_id, content } = data;
    const user_id = socket.userId;
    const username = socket.username;

    // Verify membership
    const membership = await db.eventMembers.findOne({ event_id, user_id });
    if (!membership) return;

    const message = await db.messages.create({
      event_id,
      user_id,
      content
    });

    io.to(`event-${event_id}`).emit('new-message', {
      id: message._id.toString(),
      event_id,
      user_id,
      username,
      content,
      created_at: message.created_at
    });

    // Send push notifications to all event members (except sender)
    try {
      const memberships = await db.eventMembers.find({ event_id }).lean();
      for (const m of memberships) {
        if (m.user_id !== user_id) {
          sendPushToUser(m.user_id, {
            title: `💬 ${username}`,
            body: content.length > 100 ? content.substring(0, 100) + '...' : content,
            url: `/event/${event_id}`
          });
        }
      }
    } catch (err) {
      console.error('Failed to send chat push notifications:', err.message);
    }
  });

  socket.on('notify-user', async (data) => {
    const { user_id, event_id, message } = data;

    // Verify sender is a member of the event
    if (event_id) {
      const membership = await db.eventMembers.findOne({ event_id, user_id: socket.userId });
      if (!membership) return;
    }

    await db.notifications.create({
      user_id,
      event_id,
      message,
      is_read: false
    });

    const targetSocket = onlineUsers.get(user_id.toString());
    if (targetSocket) {
      io.to(targetSocket).emit('notification', { event_id, message });
    }

    // Send push notification (works even when app is closed)
    sendPushToUser(user_id, {
      title: 'Semester Collab',
      body: message,
      url: event_id ? `/event/${event_id}` : '/'
    });
  });

  socket.on('deadline-reminder', async (data) => {
    const { event_id } = data;

    const tasks = await db.tasks.find({
      event_id,
      status: { $ne: 'completed' },
      deadline: { $ne: null }
    }).lean();

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    for (const task of tasks) {
      const deadline = new Date(task.deadline);
      if (deadline >= now && deadline <= tomorrow && task.assigned_to) {
        const msg = `Deadline approaching: "${task.title}" is due ${task.deadline}`;

        await db.notifications.create({
          user_id: task.assigned_to,
          event_id,
          message: msg,
          is_read: false
        });

        const targetSocket = onlineUsers.get(task.assigned_to.toString());
        if (targetSocket) {
          io.to(targetSocket).emit('notification', { event_id, message: msg });
        }
      }
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
});
