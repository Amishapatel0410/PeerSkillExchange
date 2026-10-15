# SkillSync — Peer-to-Peer Skill Swapping Platform

A full-stack MERN application for exchanging skills between peers. Users can match with each other, schedule sessions, chat in real-time, track learning progress, and receive session reminders.

---

## 🏗️ Project Structure

```
PeerSkillExchange/
├── server/                  # Express + Socket.IO API
│   ├── src/
│   │   ├── models/          # Mongoose schemas
│   │   │   ├── User.js          (Member A)
│   │   │   ├── Match.js         (Member B)
│   │   │   ├── Session.js       (Member C ★)
│   │   │   ├── SessionNote.js   (Member C ★)
│   │   │   ├── ChatMessage.js   (Member C ★)
│   │   │   └── Review.js        (Member D)
│   │   ├── controllers/     # Business logic
│   │   ├── routes/          # Express routers
│   │   ├── middleware/      # auth.js, upload.js, validate.js
│   │   └── utils/           # helpers, meetingLink, email, jwt, seed
│   ├── uploads/             # Local file storage (dev only)
│   ├── index.js             # Server entry point
│   ├── .env                 # (not committed)
│   └── .env.example         # Template for required vars
└── client/                  # React + Vite frontend
    ├── src/
    │   ├── api/             # axios.js + services.js
    │   ├── context/         # AuthContext, SocketContext
    │   ├── hooks/           # useChat, useSessions, useReminders
    │   ├── components/
    │   │   ├── common/      # Navbar, ProtectedRoute, ReminderBanner
    │   │   ├── sessions/    # SessionCard, AvailabilityOverlapPicker, ProgressNotes
    │   │   └── chat/        # MessageList, MessageInput
    │   ├── pages/
    │   │   ├── auth/        # LoginPage, RegisterPage
    │   │   ├── matches/     # DiscoverPage, MatchesPage
    │   │   ├── sessions/    # SessionsDashboard, RequestSessionPage, SessionDetailPage
    │   │   └── chat/        # ChatPage
    │   └── index.css        # Global design system
    └── .env                 # (not committed)
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm

### 1. Clone & install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure environment

```bash
# Server
cd server
copy .env.example .env
# Edit .env and set MONGODB_URI and JWT_SECRET
```

The only required variables for basic development are:
```
MONGODB_URI=mongodb://localhost:27017/skillsync
JWT_SECRET=any_long_random_string_here
```

### 3. Seed demo data (optional)

```bash
cd server
npm run seed
```

This creates 4 demo accounts with an accepted match, scheduled session, and chat messages.

**Demo credentials:**
| Email | Password | Role |
|-------|----------|------|
| alice@skillsync.demo | password123 | User |
| bob@skillsync.demo | password123 | User |
| carol@skillsync.demo | password123 | User |
| admin@skillsync.demo | admin123456 | Admin |

### 4. Start the servers

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# API running at http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# App running at http://localhost:5173
```

---

## 🔌 API Reference (Module 3 — Sessions & Chat)

### Sessions
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/sessions` | Create session for accepted match | ✅ |
| GET | `/api/sessions/mine` | Get current user's sessions | ✅ |
| GET | `/api/sessions/overlap/:matchId` | Get availability overlap | ✅ |
| GET | `/api/sessions/:id` | Session details | ✅ Participant |
| PUT | `/api/sessions/:id/schedule` | Set date/time & generate meeting link | ✅ Participant |
| PUT | `/api/sessions/:id/status` | Update status (completed/cancelled) | ✅ Participant |
| POST | `/api/sessions/:id/notes` | Add progress note | ✅ Participant |
| GET | `/api/sessions/:id/notes` | Get notes & milestones | ✅ Participant |
| PATCH | `/api/sessions/:id/notes/:noteId/milestone` | Toggle milestone completion | ✅ Participant |
| GET | `/api/sessions/admin/all` | All sessions (admin) | ✅ Admin |

### Chat
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/chat/:matchId` | Fetch messages (accepted matches only) | ✅ Participant |
| POST | `/api/chat/:matchId/message` | Send text or file message | ✅ Participant |

### Reminders
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/reminders/mine` | Upcoming sessions (within 24h) | ✅ |

---

## 🔒 Security Model

- All protected routes require `Authorization: Bearer <token>`
- JWT payload contains only `user._id` — identity is always re-fetched from DB
- Chat access requires **accepted** match status
- Session creation requires **accepted** match status
- Notes/milestones restricted to session participants
- File uploads validated on both client (MIME type, size) and server (multer filter)
- Reminder flags (`reminder24hSent`, `reminder1hSent`) prevent duplicate emails
- Admin routes require `isAdmin: true` flag in DB

---

## 📹 Meeting Links

Confirmed sessions receive a meeting link automatically. **Currently using placeholder links** for demonstration.

To enable real meeting links, set `MEETING_PROVIDER` in `server/.env`:

**Google Meet:**
```env
MEETING_PROVIDER=google_meet
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
```

**Zoom:**
```env
MEETING_PROVIDER=zoom
ZOOM_API_KEY=...
ZOOM_API_SECRET=...
```

See `server/src/utils/meetingLink.js` for implementation details and API references.

---

## 📧 Email Reminders

Email reminders are optional. Add to `server/.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=SkillSync <noreply@skillsync.demo>
```

Without email config, in-app reminders still work (banner in navbar, polled every 5 minutes).

The cron job runs every 30 minutes and sends:
- 24-hour advance reminder (`reminder24hSent` flag prevents duplicates)
- 1-hour advance reminder (`reminder1hSent` flag prevents duplicates)

---

## 📁 File Sharing

Supported file types: **PDF, DOC, DOCX, PNG, JPG, GIF, WEBP**  
Maximum size: **10 MB**

**⚠️ Local storage limitation:** Uploaded files are stored in `server/uploads/` on disk. This is suitable for local development only.

**For production**, migrate to cloud storage:
- AWS S3: Use `multer-s3` package
- Google Cloud Storage: Use `@google-cloud/storage`
- Azure Blob: Use `multer-azure-blob-storage`

Update `server/src/middleware/upload.js` to change storage configuration.

---

## 🔄 Real-Time Chat

- Socket.IO is used for real-time message delivery
- Client joins a room `match:<matchId>` on chat page load
- New messages are emitted to the room by the server
- **Fallback:** If socket disconnects, the client polls for new messages every 10 seconds
- Real-time indicator ("Live" / "Polling") shown in chat header

---

## 👥 Team Module Map

| Module | Owner | Key Models | Status |
|--------|-------|------------|--------|
| Identity & Profile | Member A | User | Scaffold ✅ |
| Discovery & Matching | Member B | Match | Scaffold ✅ |
| **Sessions & Chat** | **Member C** | **Session, SessionNote, ChatMessage** | **Complete ✅** |
| Trust & Admin | Member D | Review | Scaffold ✅ |

---

## 🧪 Manual Testing Checklist

```
□ Register two users (or use seed accounts)
□ Accept a match between them
□ Open chat — verify it works for accepted match
□ Open /chat/<rejected-match-id> — verify access is blocked
□ Create a session from an accepted match
□ View availability overlap on scheduling page
□ Schedule a date/time — verify meeting link is generated
□ Add a progress note with milestones
□ Toggle a milestone as completed
□ Mark session as completed
□ Verify reminder banner appears for sessions within 24h
□ Upload a file in chat — verify it appears with download link
□ Try uploading an unsupported file type — verify error message
□ Try accessing another user's session — verify 403
```

---

## 📝 Environment Variables Reference

### Server (`server/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 5000 | Server port |
| MONGODB_URI | **Yes** | - | MongoDB connection string |
| JWT_SECRET | **Yes** | - | JWT signing secret |
| JWT_EXPIRES_IN | No | 7d | Token expiry |
| CLIENT_URL | No | http://localhost:5173 | CORS origin |
| MEETING_PROVIDER | No | placeholder | placeholder / google_meet / zoom |
| EMAIL_HOST | No | - | SMTP host (enables email reminders) |
| EMAIL_PORT | No | 587 | SMTP port |
| EMAIL_USER | No | - | SMTP username |
| EMAIL_PASS | No | - | SMTP password |

### Client (`client/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| VITE_API_URL | http://localhost:5000/api | Backend API base URL |
| VITE_SOCKET_URL | http://localhost:5000 | Socket.IO server URL |