const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const availabilitySlotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
    required: true,
  },
  startTime: { type: String, required: true }, // "HH:MM" 24h
  endTime:   { type: String, required: true },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '', maxlength: 500 },
  location: { type: String, default: '' },
  skillsOffered: [{ type: String, trim: true }],
  skillsWanted: [{ type: String, trim: true }],
  availability: [availabilitySlotSchema],
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  badges: [{ type: String }],
  isAdmin: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  notificationPrefs: {
    email: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
