const ChatMessage = require('../models/ChatMessage');
const Match       = require('../models/Match');
const { isValidId } = require('../utils/helpers');
const path = require('path');

// ── Auth helper ───────────────────────────────────────────────────────────────

const assertMatchParticipant = async (matchId, userId) => {
  const match = await Match.findById(matchId);
  if (!match) return { match: null, error: 'Match not found' };
  if (match.status !== 'accepted') {
    return { match, error: 'Chat is only available for accepted matches' };
  }
  const participants = [match.requester.toString(), match.receiver.toString()];
  if (!participants.includes(userId.toString())) {
    return { match, error: 'Access denied' };
  }
  return { match, error: null };
};

// ── GET /api/chat/:matchId ────────────────────────────────────────────────────
exports.getMessages = async (req, res) => {
  try {
    const { matchId } = req.params;
    if (!isValidId(matchId)) {
      return res.status(400).json({ success: false, message: 'Invalid match ID' });
    }

    const { match, error } = await assertMatchParticipant(matchId, req.user._id);
    if (error) {
      return res.status(match ? 403 : 404).json({ success: false, message: error });
    }

    const { before, limit = 50 } = req.query;
    const query = { matchId };
    if (before && isValidId(before)) {
      const pivot = await ChatMessage.findById(before);
      if (pivot) query.createdAt = { $lt: pivot.createdAt };
    }

    const messages = await ChatMessage.find(query)
      .populate('senderId', 'name avatar')
      .sort({ createdAt: 1 })
      .limit(Number(limit));

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/chat/:matchId/message ──────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { matchId } = req.params;
    if (!isValidId(matchId)) {
      return res.status(400).json({ success: false, message: 'Invalid match ID' });
    }

    const { match, error } = await assertMatchParticipant(matchId, req.user._id);
    if (error) {
      return res.status(match ? 403 : 404).json({ success: false, message: error });
    }

    const { message } = req.body;
    const hasFile    = !!req.file;
    const hasMessage = message && message.trim();

    if (!hasMessage && !hasFile) {
      return res.status(400).json({ success: false, message: 'Message or file is required' });
    }

    let attachment = null;
    if (hasFile) {
      attachment = {
        originalName: req.file.originalname,
        filename:     req.file.filename,
        mimetype:     req.file.mimetype,
        size:         req.file.size,
        url:          `/uploads/${req.file.filename}`,
      };
    }

    const chatMsg = await ChatMessage.create({
      matchId,
      senderId:   req.user._id,
      message:    hasMessage ? message.trim() : '',
      type:       hasFile    ? 'file' : 'text',
      attachment,
    });

    await chatMsg.populate('senderId', 'name avatar');

    // Emit to Socket.IO room if available
    const io = req.app.get('io');
    if (io) {
      io.to(`match:${matchId}`).emit('new_message', chatMsg);
    }

    res.status(201).json({ success: true, message: chatMsg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
