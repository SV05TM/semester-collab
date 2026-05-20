# Semester Collab

A full-stack team collaboration app for managing semester events. Create events, track finances, marketing, logistics, assign tasks to team members, and communicate in real-time.

## Features

- **Multi-user auth** — Register/login with JWT-based sessions
- **Event management** — Create semester events with dates, descriptions, and team members
- **Category tracking** — Each event auto-creates Finances, Marketing, Logistics, and General categories (add custom ones too)
- **Task assignment** — Create tasks, assign to team members, set deadlines, track status (pending/in-progress/completed)
- **Finance tracking** — Log income and expenses per event with running totals
- **Real-time chat** — Socket.IO powered messaging per event
- **Notifications** — Get pinged when assigned tasks, approaching deadlines, and team messages
- **Multi-user** — Invite team members to events, everyone sees the same data

## Quick Start

### 1. Start the server

```bash
cd server
npm install
npm run dev
```

Server runs on http://localhost:3001

### 2. Start the client

```bash
cd client
npm install
npm run dev
```

Client runs on http://localhost:5173

### 3. Use the app

1. Register two or more accounts (use different browsers or incognito)
2. Create an event and add team members
3. Open the event to see Tasks, Finances, and Chat tabs
4. Assign tasks, set deadlines, track budgets, and chat in real-time

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO
- **Database**: NeDB (embedded, zero-config, file-based)
- **Auth**: JWT + bcrypt

## Project Structure

```
server/
  index.js          — Express + Socket.IO server
  db.js             — NeDB database setup
  middleware/       — JWT auth middleware
  routes/           — API routes (auth, events, tasks, finances, messages, notifications)
  data/             — Database files (auto-created)

client/
  src/
    App.jsx         — Router and auth state
    api.js          — Axios instance with auth interceptor
    socket.js       — Socket.IO client
    pages/          — Login, Register, Dashboard, EventDetail
    components/     — TaskBoard, FinancePanel, ChatPanel, NotificationBell
```
