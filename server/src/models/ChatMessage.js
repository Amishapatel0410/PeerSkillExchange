const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  originalName: { type: String },
  filename:     { type: String },  // stored filename on disk
  mimetype:     { type: String },
  size:         { type: Number },  // bytes
  url:          { type: String },  // relative path served by express static
}, { _id: false });

const chatMessageSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
    index: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    trim: true,
    default: '',
    maxlength: 5000,
  },
  type: {
    type: String,
    enum: ['text', 'file'],
    default: 'text',
  },
  attachment: { type: attachmentSchema, default: null },
}, { timestamps: true });

chatMessageSchema.index({ matchId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
