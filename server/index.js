import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import db from './db.js';
import { sendPushToUser } from './routes/push.js';

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

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
  });

  socket.on('join-event', (eventId) => {
    socket.join(`event-${eventId}`);
  });

  socket.on('leave-event', (eventId) => {
    socket.leave(`event-${eventId}`);
  });

  socket.on('send-message', async (data) => {
    const { event_id, content, user_id, username } = data;

    const message = await db.messages.insert({
      event_id,
      user_id,
      content,
      created_at: new Date().toISOString()
    });

    io.to(`event-${event_id}`).emit('new-message', {
      id: message._id,
      event_id,
      user_id,
      username,
      content,
      created_at: message.created_at
    });
  });

  socket.on('notify-user', async (data) => {
    const { user_id, event_id, message } = data;

    await db.notifications.insert({
      user_id,
      event_id,
      message,
      is_read: false,
      created_at: new Date().toISOString()
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
    });

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    for (const task of tasks) {
      const deadline = new Date(task.deadline);
      if (deadline >= now && deadline <= tomorrow && task.assigned_to) {
        const msg = `Deadline approaching: "${task.title}" is due ${task.deadline}`;

        await db.notifications.insert({
          user_id: task.assigned_to,
          event_id,
          message: msg,
          is_read: false,
          created_at: new Date().toISOString()
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
