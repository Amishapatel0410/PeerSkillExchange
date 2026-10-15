const User   = require('../models/User');
const { signToken } = require('../utils/jwt');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

// ── Validation chains ──────────────────────────────────────────────────────────

exports.registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
];

exports.loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// ── Controllers ───────────────────────────────────────────────────────────────

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user  = await User.create({ name, email, password });
    const token = signToken(user._id);

    res.status(201).json({ success: true, token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (user.isBanned) {
      return res.status(403).json({ success: false, message: 'Account suspended' });
    }

    const token = signToken(user._id);
    res.json({ success: true, token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
};

exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['name', 'bio', 'location', 'skillsOffered', 'skillsWanted', 'availability', 'notificationPrefs'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (req.file) updates.avatar = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -notificationPrefs');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
