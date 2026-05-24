# Semester Collab

A full-stack team collaboration app for managing semester events. Built for GMU student organizations to plan events, track budgets, assign tasks, and communicate in real-time.

## Features

### Event Management
- Create events with organization name, date, time, and location
- Edit event details anytime
- Calendar view to see all events at a glance
- Export full event reports to Word (.docx)

### Kanban Task Board
- Drag-and-drop tasks between columns: To Do → In Progress → Done
- Priority levels: Low, Medium, High, Urgent
- Assign tasks to team members with deadline tracking
- Filter by section (Finances, Marketing, Logistics, General)
- Click any task to edit title, description, assignee, priority, status, and due date
- Overdue task highlighting

### Finances
- **Event Budget** — SFB-style budget request form (Vendor, Item Type, Quantity, Price Per Item, Total)
- **Fundraising** — Track revenue and expenses per activity with net profit
- Export to Excel (.xls) and CSV with formatted headers

### Meeting Notes & Planning
- Document meetings with agenda, discussion notes, action items, and decisions
- Track action item completion with checkboxes
- Select attendees from your team

### Real-Time Communication
- Event chat powered by Socket.IO
- Push notifications on mobile (even when app is closed)
- Ping individual members or entire groups
- Deadline reminders notify assigned members

### Team & People
- **Friends system** — Add/remove friends from a global user directory
- **Role-based access** — Admin, Co-Admin, Co-Host, Member
- **Groups** — Organize members into sub-teams
- Only admins/co-admins can add or remove event members
- Promote members to Co-Host or Co-Admin

### Mobile & PWA
- Installable as a Progressive Web App (add to home screen)
- Push notifications on Android and iOS (16.4+)
- Responsive design optimized for mobile
- Horizontally scrollable tabs and touch-friendly controls

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO, Mongoose
- **Database**: MongoDB Atlas (cloud-hosted, persistent)
- **Auth**: JWT + bcrypt, GMU email required (@gmu.edu / @masonlive.gmu.edu)
- **Push**: Web Push API with VAPID keys
- **Export**: docx library (Word), HTML tables (Excel)
- **Deployment**: Render (auto-deploy from GitHub)
- **CI/CD**: GitHub Actions (28 server tests + 10 client tests)

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB running locally or a MongoDB Atlas connection string

### 1. Clone and install

```bash
git clone https://github.com/SV05TM/semester-collab.git
cd semester-collab
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

Create `server/.env`:
```
MONGODB_URI=mongodb://localhost:27017/semester-collab
JWT_SECRET=your-secret-here
```

### 3. Run

```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

Open http://localhost:5173

## Deployment

The app is configured for one-click deploy on Render:

1. Push to GitHub
2. Render auto-builds and deploys
3. Environment variables needed on Render:
   - `NODE_ENV=production`
   - `MONGODB_URI` — your Atlas connection string
   - `JWT_SECRET` — auto-generated
   - `VAPID_PUBLIC_KEY` — for push notifications
   - `VAPID_PRIVATE_KEY` — for push notifications
   - `VAPID_EMAIL` — mailto:your-email

## Running Tests

```bash
# Server tests (28 API tests)
cd server && npm test

# Client tests (10 component tests)
cd client && npm test
```

## Project Structure

```
server/
  app.js              — Express app setup and route mounting
  index.js            — HTTP server, Socket.IO, and startup
  db.js               — Mongoose schemas and MongoDB connection
  middleware/auth.js  — JWT authentication
  routes/
    auth.js           — Register, login, user list
    events.js         — CRUD events, members, groups, categories
    tasks.js          — CRUD tasks with priority and assignment
    finances.js       — Budget and fundraising entries
    messages.js       — Chat messages (REST)
    notifications.js  — Notification history
    meetingNotes.js   — Meeting notes CRUD
    friends.js        — Friends list management
    push.js           — Push notification subscriptions
  tests/              — Vitest API tests

client/
  src/
    App.jsx           — Router, auth state, onboarding
    api.js            — Axios with auth interceptor
    socket.js         — Socket.IO client
    pages/
      Login.jsx       — Sign in
      Register.jsx    — Create account (GMU email required)
      Dashboard.jsx   — Event grid + calendar view
      EventDetail.jsx — Event workspace with tabs
      People.jsx      — Friends list + user directory
    components/
      TaskBoard.jsx       — Kanban board with drag-drop
      FinancePanel.jsx    — Budget/Fundraising toggle
      BudgetPanel.jsx     — SFB budget table
      FundraisingPanel.jsx — Revenue/expense tracking
      ChatPanel.jsx       — Real-time messaging
      MembersPanel.jsx    — Team management with roles
      MeetingNotes.jsx    — Planning session docs
      CalendarView.jsx    — Monthly calendar
      NotificationBell.jsx — Notification dropdown + push toggle
      OnboardingTutorial.jsx — First-time user walkthrough
    exportEventDoc.js — Word document generation
    usePushNotifications.js — Push subscription hook
```

## License

MIT
