const mongoose = require('mongoose');

/**
 * Match statuses:
 *  pending   – request sent, awaiting response
 *  accepted  – both parties agreed; unlocks chat & sessions
 *  declined  – rejected by receiver
 *  cancelled – withdrawn by requester
 */
const matchSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  skillOffered: { type: String, required: true, trim: true },
  skillWanted:  { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled'],
    default: 'pending',
    index: true,
  },
  message: { type: String, default: '', maxlength: 500 },
  acceptedAt: { type: Date },
}, { timestamps: true });

// Compound index to prevent duplicate pending requests
matchSchema.index({ requester: 1, receiver: 1, status: 1 });

module.exports = mongoose.model('Match', matchSchema);
