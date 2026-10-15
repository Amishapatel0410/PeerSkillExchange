const mongoose = require('mongoose');

/**
 * Session statuses (Member D monitors these):
 *  pending    – requested, awaiting scheduling
 *  scheduled  – date/time set, meeting link generated
 *  completed  – both parties confirmed completion
 *  cancelled  – session was cancelled
 */
const milestoneSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  completed:   { type: Boolean, default: false },
  completedAt: { type: Date },
}, { _id: true, timestamps: false });

const sessionSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
    index: true,
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  title: {
    type: String,
    trim: true,
    default: '',
  },
  skillOffered: { type: String, trim: true, default: '' },
  skillWanted:  { type: String, trim: true, default: '' },

  requestedDateTime: { type: Date },

  scheduledDateTime: { type: Date },
  duration: {
    type: Number,  // minutes
    min: 15,
    max: 480,
    default: 60,
  },
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'completed', 'cancelled'],
    default: 'pending',
    index: true,
  },

  // Meeting link — placeholder unless real credentials provided
  meetingLink: { type: String, default: '' },
  meetingLinkType: {
    type: String,
    enum: ['placeholder', 'google_meet', 'zoom'],
    default: 'placeholder',
  },

  learningGoals: { type: String, default: '', maxlength: 1000 },
  completedAt:   { type: Date },

  // Reminder tracking (prevents duplicate reminder windows)
  reminder24hSent: { type: Boolean, default: false },
  reminder1hSent:  { type: Boolean, default: false },
}, { timestamps: true });

// Prevent duplicate sessions for same match
sessionSchema.index({ matchId: 1, status: 1 });

module.exports = mongoose.model('Session', sessionSchema);
