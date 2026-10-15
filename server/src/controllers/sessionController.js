const Session     = require('../models/Session');
const SessionNote = require('../models/SessionNote');
const Match       = require('../models/Match');
const User        = require('../models/User');
const { isValidId, findAvailabilityOverlap, isWithinOverlap } = require('../utils/helpers');
const { generateMeetingLink } = require('../utils/meetingLink');

// ── Helpers ───────────────────────────────────────────────────────────────────

const assertParticipant = (session, userId) => {
  return session.participants.map((p) => p.toString()).includes(userId.toString());
};

// ── POST /api/sessions ────────────────────────────────────────────────────────
exports.createSession = async (req, res) => {
  try {
    const { matchId, title, learningGoals, requestedDateTime, duration } = req.body;

    if (!isValidId(matchId)) {
      return res.status(400).json({ success: false, message: 'Invalid match ID' });
    }

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    // Only accepted matches can have sessions
    if (match.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Sessions can only be created for accepted matches',
      });
    }

    // Only participants can create
    const participants = [match.requester.toString(), match.receiver.toString()];
    if (!participants.includes(req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Prevent duplicate pending sessions for same match
    const existing = await Session.findOne({ matchId, status: { $in: ['pending', 'scheduled'] } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An active session already exists for this match',
        existingSessionId: existing._id,
      });
    }

    const session = await Session.create({
      matchId,
      participants: [match.requester, match.receiver],
      title:           title        || `${match.skillOffered} ↔ ${match.skillWanted}`,
      skillOffered:    match.skillOffered,
      skillWanted:     match.skillWanted,
      learningGoals:   learningGoals || '',
      requestedDateTime: requestedDateTime ? new Date(requestedDateTime) : undefined,
      duration:        duration || 60,
      status:          'pending',
    });

    await session.populate('participants', '-password');
    res.status(201).json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/sessions/mine ────────────────────────────────────────────────────
exports.getMySessions = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { participants: req.user._id };
    if (status) query.status = status;

    const sessions = await Session.find(query)
      .populate('participants', '-password')
      .populate('matchId')
      .sort({ scheduledDateTime: 1, createdAt: -1 });

    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/sessions/overlap/:matchId ───────────────────────────────────────
exports.getAvailabilityOverlap = async (req, res) => {
  try {
    const { matchId } = req.params;
    if (!isValidId(matchId)) {
      return res.status(400).json({ success: false, message: 'Invalid match ID' });
    }

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const participants = [match.requester.toString(), match.receiver.toString()];
    if (!participants.includes(req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const [userA, userB] = await Promise.all([
      User.findById(match.requester).select('availability name'),
      User.findById(match.receiver).select('availability name'),
    ]);

    const overlaps = findAvailabilityOverlap(userA.availability, userB.availability);

    res.json({
      success: true,
      overlaps,
      participants: [
        { id: userA._id, name: userA.name, availability: userA.availability },
        { id: userB._id, name: userB.name, availability: userB.availability },
      ],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/sessions/:id ─────────────────────────────────────────────────────
exports.getSession = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }

    const session = await Session.findById(req.params.id)
      .populate('participants', '-password')
      .populate('matchId');

    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    if (!assertParticipant(session, req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/sessions/:id/schedule ───────────────────────────────────────────
exports.scheduleSession = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }

    const session = await Session.findById(id).populate({
      path: 'matchId',
      populate: { path: 'requester receiver', select: 'availability name' },
    });

    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (!assertParticipant(session, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (!['pending'].includes(session.status)) {
      return res.status(400).json({ success: false, message: 'Session is already scheduled or closed' });
    }

    const { scheduledDateTime, duration } = req.body;
    if (!scheduledDateTime) {
      return res.status(400).json({ success: false, message: 'scheduledDateTime is required' });
    }

    const proposed = new Date(scheduledDateTime);
    if (isNaN(proposed.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }
    if (proposed < new Date()) {
      return res.status(400).json({ success: false, message: 'Scheduled time must be in the future' });
    }

    const durationMins = duration || session.duration;

    // Availability validation (soft — warns if both have availability set)
    const { requester, receiver } = session.matchId;
    if (requester.availability.length && receiver.availability.length) {
      const overlaps = findAvailabilityOverlap(requester.availability, receiver.availability);
      if (overlaps.length && !isWithinOverlap(proposed, durationMins, overlaps)) {
        return res.status(400).json({
          success: false,
          message: 'The selected time does not fall within both participants\' shared availability',
          overlaps,
        });
      }
    }

    // Conflict check — no overlapping scheduled sessions for either participant
    const conflictEnd = new Date(proposed.getTime() + durationMins * 60000);
    const conflictQuery = {
      participants: { $in: session.participants },
      status:       'scheduled',
      _id:          { $ne: session._id },
      scheduledDateTime: {
        $lt: conflictEnd,
        $gt: new Date(proposed.getTime() - durationMins * 60000), // rough window
      },
    };
    const conflict = await Session.findOne(conflictQuery);
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'One or both participants already have a session in this time window',
      });
    }

    const { url, type } = generateMeetingLink(session._id);

    session.scheduledDateTime = proposed;
    session.duration          = durationMins;
    session.meetingLink       = url;
    session.meetingLinkType   = type;
    session.status            = 'scheduled';
    await session.save();

    await session.populate('participants', '-password');
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/sessions/:id/status ──────────────────────────────────────────────
exports.updateSessionStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }

    const allowed = ['completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be: ${allowed.join(' or ')}` });
    }

    const session = await Session.findById(id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    if (!assertParticipant(session, req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (session.status === 'completed' || session.status === 'cancelled') {
      return res.status(400).json({ success: false, message: `Session is already ${session.status}` });
    }

    session.status = status;
    if (status === 'completed') session.completedAt = new Date();
    await session.save();

    await session.populate('participants', '-password');
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/sessions/:id/notes ──────────────────────────────────────────────
exports.addNote = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }

    const session = await Session.findById(id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    if (!assertParticipant(session, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { content, milestones, resources } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Note content is required' });
    }

    const note = await SessionNote.create({
      sessionId:  id,
      authorId:   req.user._id,
      content:    content.trim(),
      milestones: milestones || [],
      resources:  resources  || [],
    });

    await note.populate('authorId', '-password');
    res.status(201).json({ success: true, note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/sessions/:id/notes ───────────────────────────────────────────────
exports.getNotes = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }

    const session = await Session.findById(id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    if (!assertParticipant(session, req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const notes = await SessionNote.find({ sessionId: id })
      .populate('authorId', 'name avatar')
      .sort({ createdAt: 1 });

    res.json({ success: true, notes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/sessions/:id/notes/:noteId/milestone ──────────────────────────
exports.toggleMilestone = async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const { milestoneId, completed } = req.body;

    if (!isValidId(id) || !isValidId(noteId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const session = await Session.findById(id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (!assertParticipant(session, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const note = await SessionNote.findOne({ _id: noteId, sessionId: id });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

    const milestone = note.milestones.id(milestoneId);
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

    milestone.completed   = completed;
    milestone.completedAt = completed ? new Date() : undefined;
    await note.save();

    res.json({ success: true, note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/sessions/admin/all (Member D) ────────────────────────────────────
exports.adminGetAllSessions = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const sessions = await Session.find(query)
      .populate('participants', '-password')
      .populate('matchId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Session.countDocuments(query);
    res.json({ success: true, sessions, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
