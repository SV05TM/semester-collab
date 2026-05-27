# Semester Collab

A full-stack team collaboration app for managing semester events. Built for GMU student organizations to plan events, track budgets, assign tasks, and communicate in real-time.

**This project was AI-assisted** — built collaboratively with [Kiro](https://kiro.dev), an AI-powered development environment. The architecture, code, deployment, security hardening, and feature development were all done through conversational AI pair programming.

## Features

### Event Management
- Create events with organization name, date, time, and location
- Edit event details anytime (admin/co-admin only)
- Delete events from the dashboard
- Calendar view to see all events at a glance
- Export full event reports to Word (.docx)
- Organization name auto-saves and pre-fills across devices

### Kanban Task Board (Asana-style)
- Drag-and-drop tasks between columns: To Do → In Progress → Done
- Priority levels: Low, Medium, High, Urgent
- Assign tasks to team members with deadline tracking
- Filter by section (Finances, Marketing, Logistics, General)
- Click any task to edit title, description, assignee, priority, status, and due date
- Overdue task highlighting
- Mobile move buttons for touch devices
- Optimistic UI — tasks appear/update/delete instantly

### Finances
- **Event Budget** — SFB-style budget request form (Vendor, Item Type, Quantity, Price Per Item, Total)
- **Fundraising** — Track revenue and expenses per activity with net profit
- Export to Excel (.xls) and CSV with formatted headers

### Meeting Notes & Planning
- Document meetings with agenda, discussion notes, action items, and decisions
- Track action item completion with checkboxes
- Select attendees from your team

### AI Assistant (Google Gemini)
- Chat-style AI assistant for event planning help
- Context-aware — knows your event details
- Quick actions: suggest tasks, generate agendas, budget ideas, marketing plans
- Floating button accessible from any event page

### Event Ideas & Bookmarks
- Curated list of 36 event ideas (social, fundraiser, workshop, cultural, etc.)
- Refresh button to see new random suggestions
- Bookmark ideas to save for later
- Bookmarks page with "Create Event" button that pre-fills event info

### Real-Time Communication
- Event chat powered by Socket.IO (authenticated)
- Push notifications on mobile (even when app is closed)
- Ping individual members or entire groups
- Deadline reminders notify assigned members
- Chat messages trigger push notifications to all event members

### Team & People
- **Friends system** — Add/remove friends from a global user directory
- **Role-based access** — Admin, Co-Admin, Member
- **Groups** — Organize members into sub-teams
- Only admins/co-admins can add or remove event members
- Promote members to Co-Admin

### User Profile & Settings
- User dropdown menu with profile, bookmarks, people, and settings
- Profile page to edit default organization
- Dark/Light mode toggle (persists, respects system preference)
- No white flash on page load in dark mode

### Mobile & PWA
- Installable as a Progressive Web App (add to home screen)
- Push notifications on Android and iOS (16.4+)
- Responsive design optimized for mobile
- Horizontally scrollable tabs and touch-friendly controls
- Dark mode support throughout

### Security
- Socket.IO authentication (JWT verified on connection)
- Event membership checks on all data routes
- Rate limiting (200 req/15min general, 20/15min for auth)
- Helmet security headers
- Role-based authorization for team management
- Users endpoint requires authentication
- Input size limits

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS (with dark mode), Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO, Mongoose
- **Database**: MongoDB Atlas (cloud-hosted, persistent)
- **Auth**: JWT + bcrypt, GMU email required (@gmu.edu / @masonlive.gmu.edu)
- **AI**: Google Gemini 2.0 Flash (free tier)
- **Push**: Web Push API with VAPID keys
- **Export**: docx library (Word), HTML tables (Excel)
- **Security**: Helmet, express-rate-limit, CORS lockdown
- **Deployment**: Render (auto-deploy from GitHub)
- **CI/CD**: GitHub Actions (29 server tests + 10 client tests)

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
GEMINI_API_KEY=your-gemini-key (optional, for AI features)
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
   - `GEMINI_API_KEY` — for AI assistant (optional)
   - `VAPID_PUBLIC_KEY` — for push notifications
   - `VAPID_PRIVATE_KEY` — for push notifications
   - `VAPID_EMAIL` — mailto:your-email

## Running Tests

```bash
# Server tests (29 API tests)
cd server && npm test

# Client tests (10 component tests)
cd client && npm test
```

## Project Structure

```
server/
  app.js              — Express app setup, middleware, route mounting
  index.js            — HTTP server, Socket.IO, and startup
  db.js               — Mongoose schemas and MongoDB connection
  middleware/
    auth.js           — JWT authentication
    eventAccess.js    — Event membership verification
  routes/
    auth.js           — Register, login, profile, user list
    events.js         — CRUD events, members, groups, categories
    tasks.js          — CRUD tasks with priority and assignment
    finances.js       — Budget and fundraising entries
    messages.js       — Chat messages (REST)
    notifications.js  — Notification history
    meetingNotes.js   — Meeting notes CRUD
    friends.js        — Friends list management
    bookmarks.js      — Event idea bookmarks
    push.js           — Push notification subscriptions
    ai.js             — Gemini AI assistant endpoints
  tests/              — Vitest API tests

client/
  src/
    App.jsx           — Router, auth state, onboarding, theme
    api.js            — Axios with auth interceptor
    socket.js         — Socket.IO client with JWT auth
    useTheme.js       — Dark/light mode hook
    usePushNotifications.js — Push subscription hook
    exportEventDoc.js — Word document generation
    pages/
      Login.jsx       — Sign in
      Register.jsx    — Create account (GMU email required)
      Dashboard.jsx   — Event grid + calendar view + ideas
      EventDetail.jsx — Event workspace with tabs
      People.jsx      — Friends list + user directory
      Bookmarks.jsx   — Saved event ideas
      Profile.jsx     — User settings
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
      AIAssistant.jsx     — Gemini-powered chat assistant
      EventIdeas.jsx      — Curated event suggestions
      UserMenu.jsx        — Profile dropdown menu
      ThemeToggle.jsx     — Dark/light mode button
```

## AI-Assisted Development

This entire application was built through AI pair programming using Kiro. The development process included:

- **Architecture design** — choosing the tech stack, database structure, and deployment strategy
- **Full implementation** — all server routes, React components, and real-time features
- **Iterative debugging** — fixing bugs reported by the user in real-time
- **Security audit** — identifying and fixing vulnerabilities through code review
- **Deployment** — configuring Render, MongoDB Atlas, and CI/CD pipelines
- **Feature iteration** — adding features based on conversational feedback

The AI handled code generation, the human provided direction, testing, and feedback.

## License

MIT
