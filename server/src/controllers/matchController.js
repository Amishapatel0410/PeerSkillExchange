const Match = require('../models/Match');
const User  = require('../models/User');
const { isValidId } = require('../utils/helpers');

// ── Create Match Request ──────────────────────────────────────────────────────

exports.createMatch = async (req, res) => {
  try {
    const { receiverId, skillOffered, skillWanted, message } = req.body;

    if (!isValidId(receiverId)) {
      return res.status(400).json({ success: false, message: 'Invalid receiver ID' });
    }
    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot match with yourself' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ success: false, message: 'User not found' });

    // Prevent duplicate pending requests
    const existing = await Match.findOne({
      requester: req.user._id,
      receiver:  receiverId,
      status:    'pending',
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Match request already pending' });
    }

    const match = await Match.create({
      requester:    req.user._id,
      receiver:     receiverId,
      skillOffered: skillOffered || '',
      skillWanted:  skillWanted  || '',
      message:      message      || '',
    });

    await match.populate(['requester', 'receiver'], '-password');
    res.status(201).json({ success: true, match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get My Matches ────────────────────────────────────────────────────────────

exports.getMyMatches = async (req, res) => {
  try {
    const matches = await Match.find({
      $or: [{ requester: req.user._id }, { receiver: req.user._id }],
    })
      .populate('requester receiver', '-password')
      .sort({ updatedAt: -1 });

    res.json({ success: true, matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get Single Match ──────────────────────────────────────────────────────────

exports.getMatch = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid match ID' });
    }

    const match = await Match.findById(req.params.id).populate('requester receiver', '-password');
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const participantIds = [match.requester._id.toString(), match.receiver._id.toString()];
    if (!participantIds.includes(req.user._id.toString()) && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Update Match Status ───────────────────────────────────────────────────────

exports.updateMatchStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid match ID' });
    }

    const allowed = ['accepted', 'declined', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
    }

    const match = await Match.findById(id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const uid = req.user._id.toString();

    if (status === 'cancelled') {
      if (match.requester.toString() !== uid) {
        return res.status(403).json({ success: false, message: 'Only requester can cancel' });
      }
    } else {
      if (match.receiver.toString() !== uid) {
        return res.status(403).json({ success: false, message: 'Only receiver can accept/decline' });
      }
    }

    if (match.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot change a ${match.status} match` });
    }

    match.status = status;
    if (status === 'accepted') match.acceptedAt = new Date();
    await match.save();

    await match.populate('requester receiver', '-password');
    res.json({ success: true, match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Discover Users ────────────────────────────────────────────────────────────

exports.discoverUsers = async (req, res) => {
  try {
    const { skill, page = 1, limit = 10 } = req.query;
    const query = { _id: { $ne: req.user._id } };
    if (skill) query.skillsOffered = { $elemMatch: { $regex: skill, $options: 'i' } };

    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(query);
    res.json({ success: true, users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
