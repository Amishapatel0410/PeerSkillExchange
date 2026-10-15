require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const mongoose   = require('mongoose');
const cors       = require('cors');
const path       = require('path');
const cron       = require('node-cron');

const authRoutes     = require('./src/routes/auth');
const matchRoutes    = require('./src/routes/matches');
const sessionRoutes  = require('./src/routes/sessions');
const chatRoutes     = require('./src/routes/chat');
const reminderRoutes = require('./src/routes/reminders');
const reviewRoutes   = require('./src/routes/reviews');
const { processReminders } = require('./src/controllers/reminderController');

// ── App & HTTP server ─────────────────────────────────────────────────────────

const app    = express();
const server = http.createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────────────────────

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

app.set('io', io);   // Make io accessible in controllers via req.app.get('io')

io.on('connection', (socket) => {
  console.log('[Socket.IO] Client connected:', socket.id);

  // Client joins a match-specific room for real-time chat
  socket.on('join_match', ({ matchId, token }) => {
    // Basic room join — auth verification happens at REST layer
    // For production, verify JWT here before joining
    socket.join(`match:${matchId}`);
    console.log(`[Socket.IO] ${socket.id} joined match:${matchId}`);
  });

  socket.on('leave_match', ({ matchId }) => {
    socket.leave(`match:${matchId}`);
  });

  socket.on('disconnect', () => {
    console.log('[Socket.IO] Client disconnected:', socket.id);
  });
});

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files — restricted to /uploads path
// IMPORTANT: In production, serve uploads via a CDN or cloud storage (S3, GCS) 
// and remove this static middleware. Never expose files without access control.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/api/auth',      authRoutes);
app.use('/api/matches',   matchRoutes);
app.use('/api/sessions',  sessionRoutes);
app.use('/api/chat',      chatRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/reviews',   reviewRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'SkillSync API running' }));

// ── Global error handler ──────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'File too large (max 10 MB)' });
  }
  if (err.message?.includes('Unsupported file type')) {
    return res.status(415).json({ success: false, message: err.message });
  }
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Database ──────────────────────────────────────────────────────────────────

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillsync';
    await mongoose.connect(uri);
    console.log('[MongoDB] Connected:', uri.replace(/\/\/.*@/, '//***@'));
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err.message);
    process.exit(1);
  }
};

// ── Cron Jobs ─────────────────────────────────────────────────────────────────

// Run reminder processing every 30 minutes
// Prevents duplicate reminders via reminder24hSent / reminder1hSent flags
cron.schedule('*/30 * * * *', async () => {
  console.log('[Cron] Running reminder job...');
  await processReminders();
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`[Server] SkillSync API running on http://localhost:${PORT}`);
    console.log('[Server] Socket.IO ready for real-time chat');
  });
});
