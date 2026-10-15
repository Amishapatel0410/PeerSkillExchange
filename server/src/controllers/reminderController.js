const Session = require('../models/Session');
const User    = require('../models/User');
const { sendEmail, sessionReminderHtml } = require('../utils/email');

// ── GET /api/reminders/mine ───────────────────────────────────────────────────
/**
 * Returns sessions for the current user that are scheduled within the next 24h
 * and haven't been cancelled/completed.
 * Used by the frontend reminder banner — no duplicate filtering needed here
 * since the banner is idempotent.
 */
exports.getMyReminders = async (req, res) => {
  try {
    const now     = new Date();
    const in24h   = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const sessions = await Session.find({
      participants:      req.user._id,
      status:            'scheduled',
      scheduledDateTime: { $gte: now, $lte: in24h },
    })
      .populate('participants', 'name avatar')
      .sort({ scheduledDateTime: 1 });

    res.json({ success: true, reminders: sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Background cron job: send email reminders ─────────────────────────────────
/**
 * Called by the node-cron job in server.js.
 * Processes 24h and 1h reminder windows without sending duplicates.
 */
exports.processReminders = async () => {
  try {
    const now = new Date();

    // 24-hour window: sessions starting 23–25h from now
    const window24Start = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const window24End   = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const sessions24h = await Session.find({
      status:            'scheduled',
      scheduledDateTime: { $gte: window24Start, $lte: window24End },
      reminder24hSent:   false,
    }).populate('participants', 'name email notificationPrefs');

    for (const session of sessions24h) {
      for (const participant of session.participants) {
        if (participant.notificationPrefs?.email) {
          await sendEmail({
            to:      participant.email,
            subject: `⏰ Reminder: Session in ~24 hours — ${session.title || 'Skill Exchange'}`,
            html:    sessionReminderHtml(session, participant),
          });
        }
      }
      session.reminder24hSent = true;
      await session.save();
    }

    // 1-hour window: sessions starting 50–70 min from now
    const window1hStart = new Date(now.getTime() + 50 * 60 * 1000);
    const window1hEnd   = new Date(now.getTime() + 70 * 60 * 1000);

    const sessions1h = await Session.find({
      status:            'scheduled',
      scheduledDateTime: { $gte: window1hStart, $lte: window1hEnd },
      reminder1hSent:    false,
    }).populate('participants', 'name email notificationPrefs');

    for (const session of sessions1h) {
      for (const participant of session.participants) {
        if (participant.notificationPrefs?.email) {
          await sendEmail({
            to:      participant.email,
            subject: `🔔 Starting soon: ${session.title || 'Skill Exchange'} in ~1 hour`,
            html:    sessionReminderHtml(session, participant),
          });
        }
      }
      session.reminder1hSent = true;
      await session.save();
    }

    console.log(`[Reminders] Processed ${sessions24h.length} 24h + ${sessions1h.length} 1h reminders`);
  } catch (err) {
    console.error('[Reminders] Error processing reminders:', err.message);
  }
};
