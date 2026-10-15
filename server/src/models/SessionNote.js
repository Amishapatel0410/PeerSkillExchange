const mongoose = require('mongoose');

const sessionNoteSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true,
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  milestones: [{
    title:       { type: String, required: true, trim: true, maxlength: 200 },
    completed:   { type: Boolean, default: false },
    completedAt: { type: Date },
  }],
  resources: [{
    name: { type: String, trim: true },
    url:  { type: String, trim: true },
  }],
}, { timestamps: true });

module.exports = mongoose.model('SessionNote', sessionNoteSchema);
