const mongoose = require('mongoose');

/**
 * Review — Member D's trust module uses this.
 * Member C session completion triggers review eligibility.
 */
const reviewSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  revieweeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', maxlength: 1000 },
}, { timestamps: true });

reviewSchema.index({ sessionId: 1, reviewerId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
