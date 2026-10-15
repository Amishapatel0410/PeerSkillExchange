const Review  = require('../models/Review');
const Session = require('../models/Session');
const User    = require('../models/User');
const { isValidId } = require('../utils/helpers');

// ── POST /api/reviews ─────────────────────────────────────────────────────────
exports.createReview = async (req, res) => {
  try {
    const { sessionId, revieweeId, rating, comment } = req.body;

    if (!isValidId(sessionId) || !isValidId(revieweeId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed sessions' });
    }

    const participantIds = session.participants.map((p) => p.toString());
    if (!participantIds.includes(req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (!participantIds.includes(revieweeId)) {
      return res.status(400).json({ success: false, message: 'Reviewee must be a session participant' });
    }
    if (revieweeId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot review yourself' });
    }

    const existing = await Review.findOne({ sessionId, reviewerId: req.user._id });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this session' });
    }

    const review = await Review.create({
      sessionId,
      matchId:    session.matchId,
      reviewerId: req.user._id,
      revieweeId,
      rating,
      comment: comment || '',
    });

    // Update reviewee's aggregate rating
    const reviews = await Review.find({ revieweeId });
    const avg     = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await User.findByIdAndUpdate(revieweeId, { rating: Math.round(avg * 10) / 10, reviewCount: reviews.length });

    await review.populate(['reviewerId', 'revieweeId'], 'name avatar');
    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/reviews/user/:userId ─────────────────────────────────────────────
exports.getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const reviews = await Review.find({ revieweeId: userId })
      .populate('reviewerId', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/reviews/admin/all (Member D) ────────────────────────────────────
exports.adminGetAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const reviews = await Review.find()
      .populate('reviewerId revieweeId', 'name avatar email')
      .populate('sessionId', 'title status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Review.countDocuments();
    res.json({ success: true, reviews, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
