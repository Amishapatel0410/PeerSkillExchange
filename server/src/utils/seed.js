/**
 * SkillSync Seed Script
 * Populates the database with demo users, matches, sessions, and chat messages.
 * 
 * Usage: npm run seed
 * 
 * WARNING: This drops existing data in development. Do NOT run in production.
 */

require('dotenv').config();
const mongoose    = require('mongoose');
const User        = require('../models/User');
const Match       = require('../models/Match');
const Session     = require('../models/Session');
const ChatMessage = require('../models/ChatMessage');
const SessionNote = require('../models/SessionNote');

const SEED_USERS = [
  {
    name: 'Alice Chen',
    email: 'alice@skillsync.demo',
    password: 'password123',
    bio: 'Full-stack developer who loves teaching Python and learning music.',
    location: 'San Francisco, CA',
    skillsOffered: ['Python', 'Django', 'Data Analysis'],
    skillsWanted:  ['Guitar', 'Piano', 'Music Theory'],
    availability: [
      { day: 'Monday',    startTime: '18:00', endTime: '21:00' },
      { day: 'Wednesday', startTime: '18:00', endTime: '21:00' },
      { day: 'Saturday',  startTime: '09:00', endTime: '13:00' },
    ],
  },
  {
    name: 'Bob Sharma',
    email: 'bob@skillsync.demo',
    password: 'password123',
    bio: 'Musician and music teacher interested in learning programming.',
    location: 'Mumbai, India',
    skillsOffered: ['Guitar', 'Music Theory', 'Piano'],
    skillsWanted:  ['Python', 'Web Development', 'Data Science'],
    availability: [
      { day: 'Monday',    startTime: '19:00', endTime: '22:00' },
      { day: 'Wednesday', startTime: '19:00', endTime: '22:00' },
      { day: 'Saturday',  startTime: '10:00', endTime: '14:00' },
    ],
  },
  {
    name: 'Carol Davis',
    email: 'carol@skillsync.demo',
    password: 'password123',
    bio: 'Graphic designer wanting to learn Spanish and teach design skills.',
    location: 'London, UK',
    skillsOffered: ['Figma', 'UI Design', 'Illustration'],
    skillsWanted:  ['Spanish', 'French', 'Photography'],
    availability: [
      { day: 'Tuesday',  startTime: '17:00', endTime: '20:00' },
      { day: 'Thursday', startTime: '17:00', endTime: '20:00' },
      { day: 'Sunday',   startTime: '11:00', endTime: '15:00' },
    ],
  },
  {
    name: 'Admin User',
    email: 'admin@skillsync.demo',
    password: 'admin123456',
    bio: 'Platform administrator.',
    isAdmin: true,
    skillsOffered: [],
    skillsWanted:  [],
    availability: [],
  },
];

const seed = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillsync';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Clear existing data (dev only)
    await Promise.all([
      User.deleteMany({}),
      Match.deleteMany({}),
      Session.deleteMany({}),
      ChatMessage.deleteMany({}),
      SessionNote.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Create users
    const users = await User.create(SEED_USERS);
    const alice = users.find((u) => u.email === 'alice@skillsync.demo');
    const bob   = users.find((u) => u.email === 'bob@skillsync.demo');
    const carol = users.find((u) => u.email === 'carol@skillsync.demo');
    console.log(`Created ${users.length} users`);

    // Create accepted match between Alice and Bob
    const match = await Match.create({
      requester:    alice._id,
      receiver:     bob._id,
      skillOffered: 'Python',
      skillWanted:  'Guitar',
      status:       'accepted',
      acceptedAt:   new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      message:      'I would love to exchange Python and Guitar lessons!',
    });
    console.log('Created Alice↔Bob accepted match');

    // Create scheduled session for the match
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0);

    const session = await Session.create({
      matchId:           match._id,
      participants:      [alice._id, bob._id],
      title:             'Python Basics ↔ Guitar Introduction',
      skillOffered:      'Python',
      skillWanted:       'Guitar',
      scheduledDateTime: tomorrow,
      duration:          60,
      status:            'scheduled',
      meetingLink:       'https://meet.skillsync.demo/demo-session-001',
      meetingLinkType:   'placeholder',
      learningGoals:     'Alice: Learn G, C, D chords. Bob: Understand variables, loops, and functions in Python.',
    });
    console.log('Created scheduled session');

    // Create session notes
    await SessionNote.create({
      sessionId: session._id,
      authorId:  alice._id,
      content:   'Planning to start with Python data types today and cover basic string operations.',
      milestones: [
        { title: 'Understand variables and data types', completed: true, completedAt: new Date() },
        { title: 'Write a simple function', completed: false },
        { title: 'Build a small project', completed: false },
      ],
    });
    console.log('Created session note');

    // Create chat messages for the match
    const chatMessages = [
      { senderId: alice._id, message: 'Hey Bob! So excited to start our skill swap 🎉', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { senderId: bob._id,   message: 'Same here! Python seems really exciting. Where should we start?', createdAt: new Date(Date.now() - 1.9 * 60 * 60 * 1000) },
      { senderId: alice._id, message: 'Let\'s start with the basics — variables, loops, and then functions. For Guitar, what level are you at?', createdAt: new Date(Date.now() - 1.8 * 60 * 60 * 1000) },
      { senderId: bob._id,   message: 'I\'m a complete beginner! Can you suggest a good resource for Python?', createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) },
      { senderId: alice._id, message: 'Try "Python for Everybody" on Coursera — it\'s free and great for beginners!', createdAt: new Date(Date.now() - 50 * 60 * 1000) },
    ];

    for (const msg of chatMessages) {
      await ChatMessage.create({
        matchId:  match._id,
        senderId: msg.senderId,
        message:  msg.message,
        type:     'text',
      });
    }
    console.log(`Created ${chatMessages.length} chat messages`);

    // Pending match: Carol → Alice
    await Match.create({
      requester:    carol._id,
      receiver:     alice._id,
      skillOffered: 'Figma',
      skillWanted:  'Python',
      status:       'pending',
      message:      'Hi Alice! I can teach you Figma if you teach me Python basics.',
    });
    console.log('Created Carol→Alice pending match');

    console.log('\n✅ Seed complete!\n');
    console.log('Demo accounts:');
    console.log('  alice@skillsync.demo  / password123');
    console.log('  bob@skillsync.demo    / password123');
    console.log('  carol@skillsync.demo  / password123');
    console.log('  admin@skillsync.demo  / admin123456\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seed();
